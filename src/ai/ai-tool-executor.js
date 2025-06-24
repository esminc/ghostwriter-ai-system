const OpenAI = require('openai');
const MCPConnectionManager = require('../mcp-integration/mcp-connection-manager');

/**
 * Phase 7b: AIToolExecutor - AI主導MCP Tool実行エンジン
 * 
 * 設計目標:
 * - AIが状況に応じて最適なMCPツールを選択・実行
 * - エラー時の自動回復と代替手段実行
 * - 動的ツール発見とAI判断による活用
 */
class AIToolExecutor {
    constructor(options = {}) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.mcpManager = new MCPConnectionManager();
        this.executionHistory = [];
        this.maxRetries = options.maxRetries || 3;
        this.timeout = options.timeout || 30000;
        this.model = options.model || 'gpt-4o-mini';
    }

    /**
     * 🤖 AI主導のツール実行 - メインエントリーポイント
     */
    async executeWithAIGuidance(prompt, options = {}) {
        console.log('🤖 AIToolExecutor: AI主導ツール実行開始');
        const startTime = Date.now();
        
        try {
            // 利用可能ツールの動的発見
            const availableTools = await this.discoverAvailableTools();
            console.log(`🔍 発見されたツール: ${availableTools.length}個`);
            
            if (availableTools.length === 0) {
                console.log('⚠️ 利用可能なMCPツールなし、プロンプトのみで実行');
                return await this.executePromptOnly(prompt);
            }

            // AIツール選択プロンプトの構築
            const toolAwarePrompt = this.buildToolAwarePrompt(prompt, availableTools, options);
            
            // AI実行コンテキスト準備
            const execution = new ToolExecutionContext({
                maxSteps: options.maxSteps || 5,
                timeout: options.timeout || this.timeout,
                availableTools: availableTools
            });
            
            let step = 0;
            const maxSteps = execution.maxSteps;
            
            while (!execution.isComplete() && step < maxSteps) {
                console.log(`🔧 ステップ ${step + 1}/${maxSteps}: AI判断によるツール実行`);
                
                try {
                    // AIによるツール選択と実行判断
                    const aiResponse = await this.aiSelectAndExecuteTools(
                        toolAwarePrompt, 
                        availableTools, 
                        execution.getContext()
                    );
                    
                    // ツール実行結果の処理
                    if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
                        await this.executeSelectedTools(aiResponse.toolCalls, execution);
                    }
                    
                    // 最終結果の判定
                    if (aiResponse.content && this.isExecutionComplete(aiResponse.content, execution)) {
                        execution.setResult({
                            content: aiResponse.content,
                            toolResults: execution.getToolResults(),
                            reasoning: aiResponse.reasoning || 'AI自律判断による実行'
                        });
                        break;
                    }
                    
                } catch (stepError) {
                    console.log(`⚠️ ステップ${step + 1}エラー: ${stepError.message}`);
                    execution.recordError(stepError);
                    
                    // エラー回復試行
                    if (!await this.attemptErrorRecovery(stepError, execution, availableTools)) {
                        break;
                    }
                }
                
                step++;
            }
            
            const finalResult = execution.getFinalResult();
            
            // 実行履歴記録
            this.executionHistory.push({
                timestamp: new Date().toISOString(),
                steps: step,
                success: execution.isComplete(),
                processingTime: Date.now() - startTime,
                toolsUsed: execution.getToolExecutions().length,
                result: finalResult
            });
            
            console.log(`✅ AIToolExecutor完了: ${step}ステップ, ${execution.getToolExecutions().length}ツール使用`);
            return finalResult;
            
        } catch (error) {
            console.log(`❌ AIToolExecutor失敗: ${error.message}`);
            throw new Error(`AI主導ツール実行失敗: ${error.message}`);
        }
    }

    /**
     * 🔍 利用可能ツールの動的発見
     */
    async discoverAvailableTools() {
        try {
            // MCPConnectionManagerの初期化と接続取得（ContextGathererと同じ方式）
            await this.mcpManager.initialize();
            const connections = this.mcpManager.connections || {};
            const tools = [];
            
            for (const [providerName, connection] of Object.entries(connections)) {
                try {
                    const isAvailable = connection && (typeof connection.isConnected === 'function' ? 
                        await connection.isConnected() : connection !== null);
                    
                    if (isAvailable) {
                        let providerTools = [];
                        try {
                            const rawTools = (typeof connection.listTools === 'function') ? 
                                await connection.listTools() : [];
                            providerTools = Array.isArray(rawTools) ? rawTools : 
                                           (rawTools?.tools && Array.isArray(rawTools.tools)) ? rawTools.tools : [];
                        } catch (toolsError) {
                            console.log(`⚠️ ${providerName}ツール取得エラー: ${toolsError.message}`);
                            providerTools = [];
                        }
                        
                        const enhancedTools = providerTools.map(tool => ({
                            name: `${providerName}_${tool.name}`,
                            provider: providerName,
                            description: tool.description || `${providerName}の${tool.name}ツール`,
                            parameters: tool.inputSchema?.properties || {},
                            usage_hint: this.generateToolUsageHint(providerName, tool.name),
                            connection: connection // 実行用に接続オブジェクトを保存
                        }));
                        
                        tools.push(...enhancedTools);
                        console.log(`✅ ${providerName}: ${providerTools.length}個のツール登録`);
                    } else {
                        console.log(`❌ ${providerName}: 接続不可`);
                    }
                } catch (providerError) {
                    console.log(`⚠️ ${providerName}エラー: ${providerError.message}`);
                }
            }
            
            return tools;
        } catch (error) {
            console.log(`❌ ツール発見エラー: ${error.message}`);
            return [];
        }
    }

    /**
     * 💡 ツール使用ヒント生成
     */
    generateToolUsageHint(provider, toolName) {
        const hints = {
            slack: {
                get_channel_history: 'チャンネル履歴取得。引数: { "channel_id": "チャンネル名", "limit": 20 }',
                get_user_profile: 'ユーザープロフィール取得。引数: { "user_id": "ユーザー名" }',
                list_channels: 'チャンネル一覧取得。引数: {}',
                post_message: 'メッセージ投稿。引数: { "channel_id": "チャンネル名", "text": "内容" }',
                get_users: 'ユーザー一覧取得。引数: {}'
            },
            esa: {
                list_posts: '記事検索（AI代筆除外）。引数: { "q": "user:ユーザー名 -title:【代筆】 -category:AI代筆日記", "per_page": 5 }',
                get_post: '記事取得。引数: { "post_number": 記事番号 }',
                create_post: '記事作成。引数: { "title": "タイトル", "body_md": "内容", "category": "カテゴリ" }',
                get_members: 'メンバー一覧取得。引数: { "page": 1, "per_page": 100 }'
            }
        };
        
        return hints[provider]?.[toolName] || `${provider}の${toolName}機能。正しい引数形式を使用してください`;
    }

    /**
     * 🎨 ツール認識プロンプト構築
     */
    buildToolAwarePrompt(originalPrompt, availableTools, options) {
        const toolDescriptions = availableTools.map(tool => 
            `- ${tool.name}: ${tool.description} (${tool.usage_hint})`
        ).join('\n');
        
        return `${originalPrompt}

【利用可能なMCPツール】
${toolDescriptions}

【重要：正確な引数形式】
- slack_get_channel_history: { "channel_id": "チャンネル名", "limit": 数値 }
- slack_get_user_profile: { "user_id": "ユーザー名" }
- esa_list_posts: { "q": "user:ユーザー名 -title:【代筆】 -category:AI代筆日記", "per_page": 数値 }

【重要：創造的日記生成のための学習戦略】
esaツール使用時の学習方針：
- AI代筆記事を除外: "-title:【代筆】 -category:AI代筆日記" を検索に含める
- 過去記事からは「文体パターン」「関心事の方向性」のみを学習
- 具体的な内容をコピーせず、書き方のスタイルのみを参考にする

【今日のデータを重視】
- Slackの今日のメッセージから具体的なエピソードを発見
- リアルタイムの発言・やりとりから新鮮な内容を抽出
- 今日のデータを主軸に、その人らしい視点で創造的に日記を生成

【AI実行指示】
上記のツールを使って、必要なデータを自分で収集・分析し、最終的な高品質な結果を生成してください。

**必須要件：**
1. **Slackツール**: 必ず "channel_id" を使用（"channel" ではない）
2. **esaツール**: 検索は "q" パラメータを使用
3. **エラー時**: 正しい引数形式で再試行
4. **データ品質**: 収集したリアルデータを確実に活用

【応答形式】
ツールを使用する場合は、以下の形式で応答してください：
\`\`\`json
{
  "reasoning": "実行理由と戦略",
  "tool_calls": [
    {
      "name": "ツール名",
      "arguments": { "パラメータ": "値" }
    }
  ],
  "content": "現在の状況説明または最終結果"
}
\`\`\`

最終的に要求された成果物を生成できた場合は、"EXECUTION_COMPLETE"を含めて応答してください。`;
    }

    /**
     * 🤖 AIによるツール選択と実行判断
     */
    async aiSelectAndExecuteTools(prompt, availableTools, context) {
        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'あなたは高性能なAIアシスタントです。利用可能なツールを使って、ユーザーの要求を自律的に達成してください。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3, // ツール選択は決定論的に
                max_tokens: 1500,
                response_format: { type: "json_object" }
            });

            const aiResult = JSON.parse(response.choices[0].message.content);
            
            return {
                reasoning: aiResult.reasoning || 'AI判断による実行',
                toolCalls: aiResult.tool_calls || [],
                content: aiResult.content || '',
                metadata: {
                    model: this.model,
                    contextUsed: context,
                    responseTime: Date.now()
                }
            };

        } catch (aiError) {
            console.log(`❌ AI判断エラー: ${aiError.message}`);
            throw new Error(`AI判断失敗: ${aiError.message}`);
        }
    }

    /**
     * 🔧 選択されたツールの実行
     */
    async executeSelectedTools(toolCalls, execution) {
        for (const toolCall of toolCalls) {
            console.log(`🛠️ ツール実行: ${toolCall.name}`);
            
            try {
                const result = await this.executeSpecificTool(toolCall.name, toolCall.arguments);
                execution.recordToolExecution(toolCall.name, toolCall.arguments, result);
                console.log(`✅ ${toolCall.name} 実行成功`);
                
            } catch (toolError) {
                console.log(`❌ ${toolCall.name} 実行エラー: ${toolError.message}`);
                execution.recordToolError(toolCall.name, toolError);
                
                // 代替ツール試行
                await this.attemptAlternativeTools(toolCall, execution);
            }
        }
    }

    /**
     * 🔧 特定ツールの実行
     */
    async executeSpecificTool(toolName, args) {
        // ツール名の正しい分割: slack_get_channel_history → provider: slack, method: slack_get_channel_history
        const parts = toolName.split('_');
        const provider = parts[0]; // slack or esa
        const actualToolName = parts.slice(1).join('_'); // get_channel_history or list_posts
        
        // 実際のMCPツール名にプレフィックスを付ける
        const mcpToolName = `${provider}_${actualToolName}`;
        
        try {
            const connection = await this.mcpManager.getConnection(provider);
            if (!connection) {
                throw new Error(`プロバイダー ${provider} が利用できません`);
            }
            
            // 引数自動修正機能
            let correctedArgs = this.correctToolArguments(mcpToolName, args);
            
            console.log(`🛠️ ツール実行: ${toolName} → MCP名: ${mcpToolName}`);
            if (JSON.stringify(args) !== JSON.stringify(correctedArgs)) {
                console.log(`🔧 引数自動修正: ${JSON.stringify(args)} → ${JSON.stringify(correctedArgs)}`);
            }
            
            const result = await connection.callTool({
                name: mcpToolName,
                arguments: correctedArgs
            });
            
            return result;
            
        } catch (error) {
            throw new Error(`${toolName}実行失敗: ${error.message}`);
        }
    }

    /**
     * 🔧 ツール引数自動修正
     */
    correctToolArguments(toolName, args) {
        const corrections = {
            'slack_get_channel_history': (args) => {
                if (args.channel && !args.channel_id) {
                    return { ...args, channel_id: args.channel };
                }
                if (args.count && !args.limit) {
                    return { ...args, limit: args.count };
                }
                return args;
            },
            'slack_get_user_profile': (args) => {
                if (args.user && !args.user_id) {
                    return { ...args, user_id: args.user };
                }
                return args;
            },
            'esa_list_posts': (args) => {
                if (args.user && !args.q) {
                    return { ...args, q: `user:${args.user}` };
                }
                if (args.query && !args.q) {
                    return { ...args, q: args.query };
                }
                return args;
            }
        };
        
        const corrector = corrections[toolName];
        return corrector ? corrector(args) : args;
    }

    /**
     * 🔄 代替ツール試行
     */
    async attemptAlternativeTools(failedCall, execution) {
        const alternatives = this.findAlternativeTools(failedCall.name);
        
        for (const alternative of alternatives) {
            try {
                console.log(`🔄 代替ツール試行: ${alternative.name}`);
                const result = await this.executeSpecificTool(alternative.name, alternative.args);
                
                execution.recordToolExecution(alternative.name, alternative.args, result);
                console.log(`✅ 代替ツール ${alternative.name} 成功`);
                return true;
                
            } catch (altError) {
                console.log(`❌ 代替ツール ${alternative.name} も失敗`);
                continue;
            }
        }
        
        console.log(`⚠️ ${failedCall.name} の代替手段なし`);
        return false;
    }

    /**
     * 🔍 代替ツールの発見
     */
    findAlternativeTools(failedToolName) {
        const alternatives = {
            'slack_get_channel_history': [
                { name: 'slack_list_channels', args: {} }
            ],
            'esa_list_posts': [
                { name: 'esa_get_teams', args: {} }
            ]
        };
        
        return alternatives[failedToolName] || [];
    }

    /**
     * 🔄 エラー回復試行
     */
    async attemptErrorRecovery(error, execution, availableTools) {
        console.log(`🔄 エラー回復試行: ${error.message}`);
        
        // 簡易回復: 利用可能ツールの再確認
        try {
            const updatedTools = await this.discoverAvailableTools();
            if (updatedTools.length > availableTools.length) {
                console.log('✅ 新しいツールが利用可能になりました');
                return true;
            }
        } catch (recoveryError) {
            console.log(`❌ 回復試行失敗: ${recoveryError.message}`);
        }
        
        return execution.canContinue();
    }

    /**
     * 🎯 実行完了判定
     */
    isExecutionComplete(content, execution) {
        if (!content) return false;
        
        // 完了シグナルの確認
        if (content.includes('EXECUTION_COMPLETE')) return true;
        
        // 基本的な完了条件
        const hasSubstantialContent = content.length > 200;
        const hasStructure = content.includes('やったこと') || content.includes('TIL');
        const hasToolData = execution.getToolExecutions().length > 0;
        
        return hasSubstantialContent && (hasStructure || hasToolData);
    }

    /**
     * 🔄 プロンプトのみ実行（ツール利用不可時のフォールバック）
     */
    async executePromptOnly(prompt) {
        console.log('📝 ツール利用不可、プロンプトのみで実行');
        
        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'MCPツールが利用できないため、既存の知識のみで最善の結果を生成してください。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1500
            });

            return {
                content: response.choices[0].message.content,
                toolResults: [],
                reasoning: 'ツール利用不可のためプロンプトのみで生成',
                metadata: {
                    method: 'prompt_only',
                    toolsUsed: 0
                }
            };

        } catch (error) {
            throw new Error(`プロンプト実行失敗: ${error.message}`);
        }
    }

    /**
     * 📊 実行統計取得
     */
    getExecutionStats() {
        if (this.executionHistory.length === 0) {
            return { totalExecutions: 0 };
        }
        
        const recentExecutions = this.executionHistory.slice(-10);
        
        return {
            totalExecutions: this.executionHistory.length,
            recentSuccessRate: recentExecutions.filter(e => e.success).length / recentExecutions.length,
            averageSteps: recentExecutions.reduce((sum, e) => sum + e.steps, 0) / recentExecutions.length,
            averageToolUsage: recentExecutions.reduce((sum, e) => sum + e.toolsUsed, 0) / recentExecutions.length,
            lastExecution: this.executionHistory[this.executionHistory.length - 1]
        };
    }
}

/**
 * ツール実行コンテキスト管理
 */
class ToolExecutionContext {
    constructor(options = {}) {
        this.maxSteps = options.maxSteps || 5;
        this.timeout = options.timeout || 30000;
        this.availableTools = options.availableTools || [];
        
        this.startTime = Date.now();
        this.toolExecutions = [];
        this.errors = [];
        this.result = null;
    }

    recordToolExecution(toolName, args, result) {
        this.toolExecutions.push({
            toolName,
            args,
            result,
            timestamp: new Date().toISOString(),
            success: true
        });
    }

    recordToolError(toolName, error) {
        this.toolExecutions.push({
            toolName,
            error: error.message,
            timestamp: new Date().toISOString(),
            success: false
        });
        
        this.errors.push({
            type: 'tool_error',
            toolName,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }

    recordError(error) {
        this.errors.push({
            type: 'execution_error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }

    setResult(result) {
        this.result = result;
    }

    getResult() {
        return this.result;
    }

    isComplete() {
        return this.result !== null || this.isTimeout();
    }

    isTimeout() {
        return Date.now() - this.startTime > this.timeout;
    }

    canContinue() {
        return this.errors.length < 3 && !this.isTimeout();
    }

    getContext() {
        return {
            executionTime: Date.now() - this.startTime,
            toolExecutions: this.toolExecutions,
            errorCount: this.errors.length,
            hasResult: this.result !== null
        };
    }

    getToolExecutions() {
        return this.toolExecutions;
    }

    getToolResults() {
        return this.toolExecutions
            .filter(exec => exec.success)
            .map(exec => ({ tool: exec.toolName, result: exec.result }));
    }

    getFinalResult() {
        return {
            result: this.result,
            metadata: {
                executionTime: Date.now() - this.startTime,
                toolExecutionCount: this.toolExecutions.length,
                errorCount: this.errors.length,
                toolExecutions: this.toolExecutions,
                errors: this.errors
            }
        };
    }
}

module.exports = AIToolExecutor;
# 🔧 Phase 7b: MCP Tool統合設計

**策定日**: 2025年6月24日  
**対象**: 動的MCP機能発見と自律的ツール活用  
**目標**: AIによる完全自律的なMCPツール操作の実現  

---

## 🎯 **設計目標**

### **AI主導のMCP操作**
従来の固定的なMCP操作から、AIが状況に応じて最適なツールを選択・実行する動的システムへ移行

#### **Before (Phase 6.6+): 人間制御**
```javascript
// 🚨 固定的なMCP操作
const slackData = await this.slackMCPWrapper.getUserSlackDataByUserId(userId);
const esaData = await this.mcpManager.getConnection('esa').callTool('esa_list_posts');
```

#### **After (Phase 7b): AI自律制御**
```javascript
// 🎯 AI主導のMCP操作
const masterPrompt = `必要なデータを自分で収集してください`;
const result = await this.aiClient.executeWithTools(masterPrompt, { tools: allMCPTools });
```

---

## 🏗️ **アーキテクチャ設計**

### **1. MCPCapabilityDiscovery (機能発見システム)**

```javascript
// src/mcp/mcp-capability-discovery.js
class MCPCapabilityDiscovery {
    constructor() {
        this.mcpManager = new MCPConnectionManager();
        this.capabilityCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分
    }

    /**
     * 🔍 利用可能なMCP機能の動的発見
     */
    async discoverAllCapabilities() {
        console.log('🔍 MCP機能発見開始...');
        
        const cacheKey = 'all_capabilities';
        const cached = this.capabilityCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('📋 キャッシュからMCP機能を取得');
            return cached.data;
        }
        
        try {
            const connections = await this.mcpManager.getAllConnections();
            const capabilities = {
                providers: {},
                allTools: [],
                summary: {
                    totalProviders: 0,
                    totalTools: 0,
                    availableProviders: [],
                    unavailableProviders: []
                }
            };
            
            for (const [providerName, connection] of connections) {
                console.log(`🔌 ${providerName}プロバイダー機能確認中...`);
                
                try {
                    const isAvailable = await connection.isConnected();
                    
                    if (isAvailable) {
                        const tools = await connection.listTools();
                        const resources = await this.safeListResources(connection);
                        
                        capabilities.providers[providerName] = {
                            status: 'available',
                            tools: tools.map(tool => ({
                                ...tool,
                                provider: providerName,
                                fullName: `${providerName}_${tool.name}`
                            })),
                            resources: resources,
                            connectionInfo: await this.getConnectionInfo(connection)
                        };
                        
                        capabilities.allTools.push(...capabilities.providers[providerName].tools);
                        capabilities.summary.availableProviders.push(providerName);
                        
                        console.log(`✅ ${providerName}: ${tools.length}個のツール利用可能`);
                    } else {
                        capabilities.providers[providerName] = {
                            status: 'unavailable',
                            error: 'Connection not established'
                        };
                        capabilities.summary.unavailableProviders.push(providerName);
                        console.log(`❌ ${providerName}: 接続不可`);
                    }
                } catch (error) {
                    console.log(`⚠️ ${providerName}エラー: ${error.message}`);
                    capabilities.providers[providerName] = {
                        status: 'error',
                        error: error.message
                    };
                    capabilities.summary.unavailableProviders.push(providerName);
                }
            }
            
            capabilities.summary.totalProviders = Object.keys(capabilities.providers).length;
            capabilities.summary.totalTools = capabilities.allTools.length;
            
            // キャッシュ保存
            this.capabilityCache.set(cacheKey, {
                data: capabilities,
                timestamp: Date.now()
            });
            
            console.log(`🎯 MCP機能発見完了: ${capabilities.summary.totalTools}個のツール`);
            return capabilities;
            
        } catch (error) {
            console.error('❌ MCP機能発見エラー:', error);
            return this.getEmergencyCapabilities();
        }
    }

    /**
     * 🎨 AIフレンドリーなツール説明生成
     */
    generateAIToolDescriptions(capabilities) {
        return {
            toolSummary: `利用可能なMCPツール: ${capabilities.summary.totalTools}個`,
            
            providerOverview: capabilities.summary.availableProviders.map(provider => {
                const providerTools = capabilities.providers[provider].tools;
                return `${provider}: ${providerTools.length}個のツール (${providerTools.map(t => t.name).join(', ')})`;
            }),
            
            recommendedUsage: this.generateUsageRecommendations(capabilities),
            
            toolDetails: capabilities.allTools.map(tool => ({
                name: tool.fullName,
                description: tool.description,
                provider: tool.provider,
                parameters: tool.inputSchema?.properties || {},
                usageHint: this.generateToolUsageHint(tool)
            }))
        };
    }

    /**
     * 💡 ツール使用推奨事項の生成
     */
    generateUsageRecommendations(capabilities) {
        const recommendations = [];
        
        // Slack関連の推奨事項
        if (capabilities.providers.slack?.status === 'available') {
            recommendations.push({
                purpose: 'Slackデータ収集',
                tools: ['slack_get_channel_history', 'slack_get_user_profile'],
                strategy: 'ユーザーの最近の活動を理解するため、関連チャンネルの履歴を取得'
            });
        }
        
        // esa関連の推奨事項
        if (capabilities.providers.esa?.status === 'available') {
            recommendations.push({
                purpose: 'esa記事分析',
                tools: ['esa_list_posts', 'esa_get_post'],
                strategy: 'ユーザーの過去記事から文体と関心事を学習'
            });
        }
        
        return recommendations;
    }

    /**
     * 🔧 個別ツールの使用ヒント生成
     */
    generateToolUsageHint(tool) {
        const hints = {
            slack_get_channel_history: 'ユーザーの最近の活動を知るために使用。limit=20-50が適切',
            slack_get_user_profile: 'ユーザーの基本情報取得。実名表示名の確認に有用',
            esa_list_posts: '過去記事検索。q=user:username で特定ユーザーの記事を取得',
            esa_get_post: '記事の詳細内容取得。文体学習に重要',
            esa_create_post: '日記投稿。category は AI代筆日記/YYYY/MM/DD 形式'
        };
        
        return hints[tool.name] || '詳細は tool description を参照';
    }

    /**
     * 🚨 緊急時のフォールバック機能情報
     */
    getEmergencyCapabilities() {
        return {
            providers: {},
            allTools: [],
            summary: {
                totalProviders: 0,
                totalTools: 0,
                availableProviders: [],
                unavailableProviders: ['slack', 'esa']
            },
            emergencyMode: true,
            message: 'MCP機能発見失敗、フォールバックモードで動作'
        };
    }

    async safeListResources(connection) {
        try {
            return await connection.listResources();
        } catch (error) {
            return [];
        }
    }

    async getConnectionInfo(connection) {
        try {
            return {
                status: 'connected',
                lastCheck: new Date().toISOString(),
                version: await connection.getVersion?.() || 'unknown'
            };
        } catch (error) {
            return {
                status: 'limited',
                lastCheck: new Date().toISOString(),
                error: error.message
            };
        }
    }
}
```

### **2. AIToolExecutor (AI主導ツール実行器)**

```javascript
// src/ai/ai-tool-executor.js
class AIToolExecutor {
    constructor() {
        this.aiClient = new OpenAIClient();
        this.capabilityDiscovery = new MCPCapabilityDiscovery();
        this.executionHistory = [];
        this.maxRetries = 3;
    }

    /**
     * 🤖 AI主導のツール実行
     */
    async executeWithAIGuidance(prompt, options = {}) {
        console.log('🤖 AI主導ツール実行開始');
        
        const capabilities = await this.capabilityDiscovery.discoverAllCapabilities();
        const toolDescriptions = this.capabilityDiscovery.generateAIToolDescriptions(capabilities);
        
        const enhancedPrompt = this.buildToolAwarePrompt(prompt, toolDescriptions, options);
        
        const execution = new ToolExecutionContext({
            maxSteps: options.maxSteps || 10,
            timeout: options.timeout || 300000,
            allowedTools: capabilities.allTools
        });
        
        let step = 0;
        while (!execution.isComplete() && step < execution.maxSteps) {
            console.log(`🔧 ステップ ${step + 1}: AI判断によるツール実行`);
            
            try {
                const aiResponse = await this.aiClient.generateWithFunctions(
                    enhancedPrompt,
                    capabilities.allTools,
                    {
                        context: execution.getContext(),
                        temperature: 0.3, // ツール実行は決定論的に
                        maxTokens: 1500
                    }
                );
                
                // AI判断によるツール呼び出しの実行
                if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
                    await this.executeAISelectedTools(aiResponse.functionCalls, execution);
                }
                
                // AI生成コンテンツがある場合は結果として記録
                if (aiResponse.content && aiResponse.content.length > 100) {
                    execution.setResult(aiResponse.content);
                }
                
                // 完了判定
                if (execution.hasResult() && this.isExecutionComplete(execution)) {
                    console.log('✅ AI主導実行完了');
                    break;
                }
                
            } catch (stepError) {
                console.log(`⚠️ ステップ${step + 1}エラー: ${stepError.message}`);
                execution.recordError(stepError);
                
                if (!execution.canContinue()) {
                    break;
                }
            }
            
            step++;
        }
        
        const result = execution.getFinalResult();
        this.executionHistory.push({
            timestamp: new Date().toISOString(),
            steps: step,
            success: execution.isComplete(),
            result: result
        });
        
        return result;
    }

    /**
     * 🎨 ツール認識プロンプトの構築
     */
    buildToolAwarePrompt(originalPrompt, toolDescriptions, options) {
        return `${originalPrompt}

【利用可能なツール情報】
${toolDescriptions.toolSummary}

【プロバイダー概要】
${toolDescriptions.providerOverview.join('\n')}

【推奨使用戦略】
${toolDescriptions.recommendedUsage.map(rec => 
    `${rec.purpose}: ${rec.tools.join(', ')} - ${rec.strategy}`
).join('\n')}

【詳細ツール情報】
${toolDescriptions.toolDetails.map(tool => 
    `${tool.name}: ${tool.description} (${tool.usageHint})`
).join('\n')}

【実行指示】
上記のツールを使って、必要なデータを自分で収集し、分析し、最終的な結果を生成してください。
ツールの呼び出しは必要に応じて複数回実行し、エラーが発生した場合は代替手段を自分で判断してください。

各ツールの実行後は、取得したデータを分析し、次に必要なアクションを自分で判断してください。
最終的に、要求された成果物を高品質で生成してください。`;
    }

    /**
     * 🔧 AI選択ツールの実行
     */
    async executeAISelectedTools(functionCalls, execution) {
        for (const call of functionCalls) {
            console.log(`🛠️ ツール実行: ${call.name}`);
            
            try {
                const result = await this.executeSpecificTool(call.name, call.arguments);
                execution.recordToolExecution(call.name, call.arguments, result);
                
                console.log(`✅ ${call.name} 実行成功`);
            } catch (toolError) {
                console.log(`❌ ${call.name} 実行エラー: ${toolError.message}`);
                execution.recordToolError(call.name, toolError);
                
                // エラー回復の試行
                await this.attemptToolErrorRecovery(call, execution, toolError);
            }
        }
    }

    /**
     * 🔧 特定ツールの実行
     */
    async executeSpecificTool(toolName, args) {
        const [provider, toolMethod] = toolName.split('_', 2);
        const connection = await this.mcpManager.getConnection(provider);
        
        if (!connection) {
            throw new Error(`プロバイダー ${provider} が利用できません`);
        }
        
        return await connection.callTool({
            name: toolMethod,
            arguments: args
        });
    }

    /**
     * 🔄 ツールエラー回復
     */
    async attemptToolErrorRecovery(failedCall, execution, error) {
        console.log(`🔄 ${failedCall.name} エラー回復試行...`);
        
        // 代替ツールの提案
        const alternatives = this.findAlternativeTools(failedCall.name);
        
        for (const alternative of alternatives) {
            try {
                console.log(`🔄 代替ツール試行: ${alternative.name}`);
                const result = await this.executeSpecificTool(alternative.name, alternative.args);
                
                execution.recordToolExecution(alternative.name, alternative.args, result);
                console.log(`✅ 代替ツール ${alternative.name} 成功`);
                return;
                
            } catch (altError) {
                console.log(`❌ 代替ツール ${alternative.name} も失敗`);
                continue;
            }
        }
        
        console.log(`⚠️ ${failedCall.name} の回復失敗`);
    }

    /**
     * 🔍 代替ツールの発見
     */
    findAlternativeTools(failedToolName) {
        const alternatives = {
            'slack_get_channel_history': [
                { name: 'slack_get_users', args: {} }
            ],
            'esa_list_posts': [
                { name: 'esa_get_members', args: {} }
            ]
        };
        
        return alternatives[failedToolName] || [];
    }

    /**
     * 🎯 実行完了判定
     */
    isExecutionComplete(execution) {
        const result = execution.getResult();
        
        if (!result) return false;
        
        // 基本的な完了条件
        const hasContent = result.length > 200;
        const hasStructure = result.includes('やったこと') || result.includes('TIL');
        const hasToolData = execution.getToolExecutions().length > 0;
        
        return hasContent && (hasStructure || hasToolData);
    }

    /**
     * 📊 実行統計の取得
     */
    getExecutionStats() {
        const recentExecutions = this.executionHistory.slice(-10);
        
        return {
            totalExecutions: this.executionHistory.length,
            recentSuccessRate: recentExecutions.filter(e => e.success).length / recentExecutions.length,
            averageSteps: recentExecutions.reduce((sum, e) => sum + e.steps, 0) / recentExecutions.length,
            lastExecution: this.executionHistory[this.executionHistory.length - 1]
        };
    }
}
```

### **3. ToolExecutionContext (実行コンテキスト管理)**

```javascript
// src/ai/tool-execution-context.js
class ToolExecutionContext {
    constructor(options = {}) {
        this.maxSteps = options.maxSteps || 10;
        this.timeout = options.timeout || 300000;
        this.allowedTools = options.allowedTools || [];
        
        this.startTime = Date.now();
        this.toolExecutions = [];
        this.errors = [];
        this.result = null;
        this.metadata = {};
    }

    recordToolExecution(toolName, args, result) {
        this.toolExecutions.push({
            toolName,
            args,
            result,
            timestamp: new Date().toISOString(),
            success: true
        });
        
        console.log(`📝 ツール実行記録: ${toolName}`);
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
        this.metadata.completionTime = new Date().toISOString();
    }

    getResult() {
        return this.result;
    }

    hasResult() {
        return this.result !== null;
    }

    isComplete() {
        return this.hasResult() || this.isTimeout();
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
            hasResult: this.hasResult()
        };
    }

    getToolExecutions() {
        return this.toolExecutions;
    }

    getElapsedTime() {
        return Date.now() - this.startTime;
    }

    getFinalResult() {
        return {
            result: this.result,
            metadata: {
                ...this.metadata,
                executionTime: this.getElapsedTime(),
                toolExecutionCount: this.toolExecutions.length,
                errorCount: this.errors.length,
                toolExecutions: this.toolExecutions,
                errors: this.errors
            }
        };
    }
}
```

---

## 📊 **統合効果の測定**

### **自律性レベルの評価**

```javascript
// src/monitoring/autonomy-metrics.js
class AutonomyMetrics {
    measureAutonomyLevel(execution) {
        const metrics = {
            toolSelectionAccuracy: this.calculateToolSelectionAccuracy(execution),
            errorRecoveryRate: this.calculateErrorRecoveryRate(execution),
            dataCollectionCompleteness: this.calculateDataCompleteness(execution),
            resultQuality: this.calculateResultQuality(execution)
        };
        
        const autonomyScore = Object.values(metrics).reduce((sum, score) => sum + score, 0) / 4;
        
        return {
            overall: autonomyScore,
            breakdown: metrics,
            level: this.categorizeAutonomyLevel(autonomyScore)
        };
    }

    categorizeAutonomyLevel(score) {
        if (score >= 0.9) return 'high';
        if (score >= 0.7) return 'medium';
        return 'low';
    }
}
```

---

## 🎯 **期待される成果**

### **1. 完全自律MCP操作**
- AIが状況に応じて最適なツールを選択
- エラー時の自動回復と代替手段実行
- 人間の介入なしでのデータ収集完了

### **2. 動的機能発見**
- 利用可能なMCPツールの自動検出
- 新しいプロバイダーの自動統合
- ツール変更への自動対応

### **3. 品質保証の自動化**
- AI自身による結果品質評価
- 不十分な場合の自動再実行
- 継続的な改善学習

この設計により、Phase 7bはMCP操作の完全自律化を実現し、Phase 7cでのAI Orchestratorへの準備を完了します。

---

**策定者**: Claude Code  
**実装準備**: 完了
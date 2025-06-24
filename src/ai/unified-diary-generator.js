const OpenAI = require('openai');
const ContextGatherer = require('./context-gatherer');
const AIKeywordExtractor = require('./keyword-extractor-ai');
const MCPConnectionManager = require('../mcp-integration/mcp-connection-manager');

/**
 * Phase 7b: UnifiedDiaryGenerator - 統合AI自律日記生成システム
 * 
 * 設計思想: "AIに全てを任せる"
 * - 従来の300行複雑ロジック → 20行シンプル設計
 * - 人間の詳細制御 → AI自律判断
 * - 固定的なプロンプト → 動的統合プロンプト
 */
class UnifiedDiaryGenerator {
    constructor(options = {}) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.contextGatherer = new ContextGatherer();
        this.keywordExtractor = new AIKeywordExtractor();
        this.mcpManager = new MCPConnectionManager();
        
        // 設定可能なオプション
        this.config = {
            maxIterations: options.maxIterations || 10,
            temperature: options.temperature || 0.8,
            autonomyLevel: options.autonomyLevel || 'high', // high, medium, low
            qualityThreshold: options.qualityThreshold || 0.95,
            timeoutMs: options.timeoutMs || 300000, // 5分
            model: options.model || 'gpt-4o-mini',
            ...options
        };

        // Phase 7b: AI主導ツール実行エンジン追加（config設定後）
        const AIToolExecutor = require('./ai-tool-executor');
        this.toolExecutor = new AIToolExecutor({
            model: this.config.model,
            timeout: this.config.timeoutMs
        });

        this.lastExecutionStats = null;
    }

    /**
     * 🎯 メインエントリーポイント: 統合日記生成
     */
    async generateDiary(userName, instructions = "通常の日記を生成してください", options = {}) {
        console.log(`🤖 UnifiedDiaryGenerator起動: ${userName}`);
        console.log(`📝 指示: ${instructions}`);
        console.log(`👤 Slack情報: realName=${options.slackRealName}, displayName=${options.slackDisplayName}`);
        console.log(`📊 ESA情報: screenName=${options.esaUser?.screen_name}, name=${options.esaUser?.name}`);
        const startTime = Date.now();
        
        try {
            // Step 1: コンテキスト収集（動的MCPツール発見含む）
            console.log('🔍 Step 1: コンテキスト収集');
            const context = await this.contextGatherer.gatherAll(userName, {
                instructions,
                autonomyLevel: this.config.autonomyLevel
            });
            
            // Step 2: マスタープロンプト構築（統合AI自律指示）
            console.log('🎨 Step 2: 統合マスタープロンプト構築');
            const masterPrompt = this.buildMasterPrompt(userName, context, instructions, options);
            
            // Step 3: AI自律実行（MCP動的ツール活用）
            console.log('🚀 Step 3: AI自律実行開始');
            const result = await this.executeAIAutonomous(masterPrompt, context);
            
            // Step 4: 品質検証
            console.log('🔍 Step 4: 品質検証');
            const validation = await this.validateResult(result, context);
            if (!validation.isValid) {
                throw new QualityValidationError(`品質基準未達: ${validation.reasons.join(', ')}`);
            }
            
            // Step 5: 実行統計記録
            this.lastExecutionStats = {
                processingTime: Date.now() - startTime,
                qualityScore: validation.qualityScore,
                autonomyLevel: this.config.autonomyLevel,
                toolsUsed: result.metadata?.toolsUsed || 0,
                iterationsUsed: result.metadata?.iterationsUsed || 1
            };
            
            console.log(`✅ UnifiedDiaryGenerator完了: 品質スコア ${validation.qualityScore}, ${this.lastExecutionStats.processingTime}ms`);
            
            // Phase 7b品質フッタの生成
            const qualityFooter = this.generateQualityFooter(validation, result, context);
            const contentWithFooter = result.content + '\n\n' + qualityFooter;
            
            return {
                title: result.title,
                content: contentWithFooter,
                category: result.category || this.generateEsaCategory(),
                metadata: {
                    generationMethod: 'unified_ai_autonomous',
                    qualityScore: validation.qualityScore,
                    autonomyLevel: this.config.autonomyLevel,
                    processingTime: this.lastExecutionStats.processingTime,
                    toolsUsed: result.metadata?.toolsUsed || 0,
                    iterationsUsed: result.metadata?.iterationsUsed || 1,
                    keywordSource: 'ai_extraction',
                    version: '7b.1.0'
                }
            };
            
        } catch (error) {
            console.log(`⚠️ UnifiedDiaryGenerator エラー: ${error.message}`);
            
            // Phase 6.6+フォールバック
            return await this.executeEmergencyFallback(userName, instructions, error, options);
        }
    }

    /**
     * 🎨 統合マスタープロンプト構築 - AI自律性最大化
     */
    buildMasterPrompt(userName, context, instructions, options = {}) {
        const autonomyInstructions = this.getAutonomyInstructions(this.config.autonomyLevel);
        const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long'
        });
        
        // 日本語表示名の取得（Slack情報を優先、なければ固定マッピング）
        const displayName = this.getJapaneseDisplayName(userName, options);
        console.log(`🎯 マスタープロンプト用表示名: ${userName} -> ${displayName}`);
        
        return `あなたは${displayName}さん専用の自律的日記生成アシスタントです。

【今回のミッション】
${instructions}

【本日の日付】
${today}

【あなたの能力と権限】
- 利用可能なMCPツール: ${context.tools.length}個のツール
- 自律実行レベル: ${this.config.autonomyLevel}
- 品質目標: ${Math.round(this.config.qualityThreshold * 100)}%以上
- 最大実行時間: ${Math.round(this.config.timeoutMs / 1000)}秒

【利用可能なリソース概要】
\`\`\`json
${JSON.stringify({
    userProfile: context.availableData.userProfile,
    recentActivity: context.availableData.recentActivity,
    preferences: context.availableData.preferences,
    timeContext: context.context.timeOfDay,
    specialEvents: context.context.specialEvents,
    discoveredTools: context.tools.map(tool => ({
        name: tool.name,
        provider: tool.provider,
        description: tool.description || 'MCP tool available for autonomous execution'
    }))
}, null, 2)}
\`\`\`

【動的発見済みMCPツール】
Slack関連: ${context.tools.filter(t => t.provider === 'slack').map(t => t.name).join(', ')}
esa関連: ${context.tools.filter(t => t.provider === 'esa').map(t => t.name).join(', ')}

${autonomyInstructions}

【最終成果物の要求】
1. **タイトル**: 【代筆】${displayName}: [具体的で魅力的なタイトル]
2. **内容**: 必ず以下の3セクション構造で構成してください（**全体で500文字以上**）：
   
   ## ${today}の振り返り

   **やったこと**
   [具体的な活動内容を180-250文字で詳細に記述。今日の具体的なエピソードや会話、やりとりを含める]

   **TIL (Today I Learned)**
   [学んだことや気づきを150-200文字で詳細に記述。具体的な発見や洞察を深く掘り下げる]

   **こんな気分**
   [感情や気持ちを100-150文字で詳細に記述。具体的な感情の変化や理由を含める]
3. **品質**: 人間らしい自然な文体、機械的表現（「実施しました」「取り組みました」等）の完全排除
4. **JSON形式**: { "title": "...", "content": "...", "reasoning": "生成プロセスの説明" }

**重要**: contentには上記の3セクション構造を必ず含めてください。セクションが欠けると品質検証で失敗します。

【重要な価値観】
- 日常体験（食事、場所、イベント）を技術系より重視
- etc-spotsチャンネルの情報を特に重要視
- 人間関係や感情の表現を大切に
- 具体的な固有名詞（人名、場所名）を積極活用

【創造性・独創性の要求】
🎨 **核心原則**: 今日のリアルデータから新鮮で独創的な内容を創造すること

**創造的アプローチ**:
- 今日のSlackメッセージ・やりとりから具体的なエピソードを発見
- ${displayName}さんの視点で今日の出来事を解釈・分析
- 個人的な気づきや感情を独自の表現で描写
- 過去の記事の「文体パターン」は参考にするが、「内容」は完全に新規創造

**避けるべきこと**:
- 過去記事の内容の書き直しや言い換え
- 抽象的で一般的な表現（「充実した一日」「良い学びがあった」等）
- 既存記事から推測した活動の再現

【品質基準】
- 関心事反映度: 95%以上
- 人間らしさ: 機械的表現（「取り組みました」「実施しました」等）の完全排除
- 具体性: 抽象的でない体験描写
- 一貫性: ${userName}さんらしい文体
- 創造性: 既存日記との差別化、独自性のある表現
- 文字数: 最低500字以上（各セクションを充実させ、具体的なエピソードや詳細な感情表現を含める）

【エラー対応】
問題発生時は自分で原因分析し、最適な代替手段で高品質な結果を生成してください。

それでは、完全に自律的な日記生成を開始してください。`;
    }

    /**
     * 🔧 自律性レベル別指示文生成
     */
    getAutonomyInstructions(level) {
        const instructions = {
            high: `【完全自律モード】
以下を完全に自律的に実行してください：

1. **動的MCPツール活用による最適データ収集**
   - 発見済みSlackツール（slack_get_channel_history等）を自律実行
   - etc-spots、its-wkwk-generalチャンネルの最新情報を取得
   - esa記事検索ツール（esa_list_posts等）でユーザーの過去記事分析
   - 収集期間・件数を最適化

2. **AI主導の情報分析**
   - 取得したSlackメッセージからキーワード抽出
   - ユーザーの文体を過去記事から学習
   - 日常体験vs技術系の重要度を判断
   - 人間関係・感情・体験を重視

3. **高品質な日記生成**
   - 具体的な固有名詞（人名、場所名）を積極活用
   - 人間らしい自然な文体を選択（口語的表現推奨）
   - 機械的表現の完全排除
   - 品質チェックを自分で実行

注意: 利用可能なMCPツールを最大限活用して、実データに基づく高品質な日記を生成してください。`,

            medium: `【ガイド付き自律モード】
基本方針に従いながら、詳細は自分で判断してください：

1. **推奨データ収集**: etc-spots、its-wkwk-generalを重視しつつ最適化
2. **分析方針**: 日常体験を技術系より優先、重み付けは自己判断
3. **品質基準**: 人間らしい口語表現、機械的表現回避
4. **投稿方針**: AI代筆日記カテゴリで投稿`,

            low: `【制御付き実行モード】
以下の詳細指示に従って実行：

1. **データ収集**: etc-spots(15件), its-wkwk-general(20件), esa記事(5件)
2. **分析**: 日常体験キーワード最優先、技術系は補助的
3. **生成**: やったこと(150-200字), TIL(100-150字), こんな気分(80-120字)
4. **文体**: 口語的、親しみやすい表現`
        };
        
        return instructions[level] || instructions.medium;
    }

    /**
     * 🚀 AI自律実行エンジン（Phase 7b: AIToolExecutor統合）
     */
    async executeAIAutonomous(masterPrompt, context) {
        console.log('🤖 AI自律実行: AIToolExecutor経由でリアルデータ収集 + 生成');
        
        try {
            // Phase 7b: AI主導でMCPツール実行 + データ収集
            const dataCollectionPrompt = `
ユーザー「${context.userName}」の今日の活動データを収集し、その人らしい創造的な日記を生成してください。

【データ収集戦略】
1. **今日のリアルタイムデータ**: 
   - Slack最新メッセージ（etc-spots、its-wkwk-generalチャンネル）
   - 今日の具体的な活動、発言、やりとり

2. **文体・関心事パターン学習**:
   - esa過去記事から「書き方の特徴」を抽出（内容ではなくスタイル）
   - 関心を向ける分野や話題の傾向を把握
   - 文章の構造や表現パターンを学習

⚠️ **重要な学習方針**:
- esaツール使用時は、AI代筆記事を除外: "-title:【代筆】 -category:AI代筆日記"
- 過去記事の「内容」をコピーするのではなく、「文体」「関心事の方向性」「表現パターン」のみを学習
- 今日のリアルデータを主軸に、その人らしい視点で新しい内容を創造

【創造的生成の指示】
今日のSlackデータから得られた具体的な出来事・発言・やりとりを基に、
${context.userName}さんらしい文体と関心事の方向性で、
まったく新しい日記を創造してください。

過去の日記内容の書き直しではなく、今日のデータから新鮮で独創的な内容を生み出してください。

${masterPrompt}
            `;
            
            const result = await this.toolExecutor.executeWithAIGuidance(dataCollectionPrompt, {
                maxSteps: 3,
                userName: context.userName,
                requireJSON: true
            });
            
            // AIToolExecutorの結果をフォーマット
            console.log('🔍 AIToolExecutor結果デバッグ:', JSON.stringify(result, null, 2));
            
            if (result) {
                // AIToolExecutorが完了しているが日記生成まで到達していない場合、
                // 収集したデータを使ってここで日記生成を実行
                if (!result.content) {
                    console.log('🔄 AIToolExecutorデータ収集完了、日記生成を実行');
                    
                    // 標準的なGPT-4o-mini呼び出しで日記生成（マスタープロンプトの要素を反映）
                    const today = new Date().toLocaleDateString('ja-JP', {
                        year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long'
                    });
                    
                    const response = await this.openai.chat.completions.create({
                        model: this.config.model,
                        messages: [
                            {
                                role: 'system',
                                content: masterPrompt  // マスタープロンプトを使用（日本語名を含む）
                            },
                            {
                                role: 'user',
                                content: `【収集されたリアルデータ】
${JSON.stringify(result, null, 2)}

上記のリアルデータを基に、必ず以下のJSON形式で日記を生成してください：
{
  "title": "【代筆】[日本語名]: [具体的で魅力的なタイトル]",
  "content": "必ず「やったこと」「TIL」「こんな気分」の3セクションを含む日記本文（全体で500文字以上）"
}

【重要な文字数要求】:
- 全体で500文字以上の詳細な内容を生成してください
- やったこと: 180-250文字（具体的なエピソードや会話を含める）
- TIL: 150-200文字（詳細な発見や洞察を深く掘り下げる）
- こんな気分: 100-150文字（具体的な感情の変化や理由を含める）
- 抽象的な表現を避け、具体的で詳細な描写を心がけてください`
                            }
                        ],
                        temperature: this.config.temperature,
                        max_tokens: 2000,  // 500文字以上の生成に対応
                        response_format: { type: "json_object" }
                    });
                    
                    let aiResult;
                    try {
                        aiResult = JSON.parse(response.choices[0].message.content);
                        console.log('🔍 生成されたAI結果:', JSON.stringify(aiResult, null, 2));
                    } catch (parseError) {
                        console.log('❌ JSON解析失敗:', parseError.message);
                        console.log('📄 生の応答:', response.choices[0].message.content);
                        throw new Error(`JSON解析失敗: ${parseError.message}`);
                    }
                    
                    // 必須セクション確認
                    if (!aiResult.title || !aiResult.content) {
                        console.log('⚠️ 基本構造不完全: title=' + !!aiResult.title + ', content=' + !!aiResult.content);
                        throw new Error('基本構造不完全（タイトルまたは内容が欠如）');
                    }
                    
                    if (!aiResult.content.includes('やったこと') || 
                        !aiResult.content.includes('TIL') || 
                        !aiResult.content.includes('こんな気分')) {
                        console.log('⚠️ 必須セクション不足');
                        throw new Error('必須セクション（やったこと、TIL、こんな気分）が不足');
                    }
                    
                    return {
                        title: aiResult.title,
                        content: aiResult.content,
                        reasoning: 'AIToolExecutor収集データ + GPT-4o-mini生成',
                        metadata: {
                            model: this.config.model,
                            temperature: this.config.temperature,
                            iterationsUsed: 1,
                            toolsUsed: result.toolsUsed || 0,
                            responseTime: Date.now(),
                            dataSource: 'ai_tool_executor_hybrid'
                        }
                    };
                } else {
                    return {
                        title: result.title || `【代筆】${context.userName}: ${new Date().toLocaleDateString()}の振り返り`,
                        content: result.content,
                        reasoning: result.reasoning || 'AI主導リアルデータ収集による生成',
                        metadata: {
                            model: this.config.model,
                            temperature: this.config.temperature,
                            iterationsUsed: result.steps || 1,
                            toolsUsed: result.toolsUsed || 0,
                            responseTime: Date.now(),
                            dataSource: 'ai_tool_executor_complete'
                        }
                    };
                }
            } else {
                throw new Error('AIToolExecutor実行結果が空です');
            }


        } catch (aiError) {
            console.log(`❌ AI実行エラー: ${aiError.message}`);
            throw new Error(`AI生成失敗: ${aiError.message}`);
        }
    }

    /**
     * 🔍 結果品質検証
     */
    async validateResult(result, context) {
        const validation = {
            isValid: true,
            qualityScore: 0,
            reasons: [],
            improvements: []
        };
        
        // 基本構造チェック
        if (!result.title || !result.content) {
            validation.isValid = false;
            validation.reasons.push('基本構造不完全（タイトルまたは内容が欠如）');
            return validation;
        }
        
        // セクション構造チェック
        const requiredSections = ['やったこと', 'TIL', 'こんな気分'];
        const missingSections = requiredSections.filter(section => 
            !result.content.includes(section)
        );
        
        if (missingSections.length > 0) {
            validation.isValid = false;
            validation.reasons.push(`必須セクション欠如: ${missingSections.join(', ')}`);
        }
        
        // 文字数チェック
        const contentLength = result.content.length;
        if (contentLength < 500) {
            validation.isValid = false;
            validation.reasons.push(`文字数不足: ${contentLength}字 (最低500字必要)`);
        }
        
        // 機械的表現チェック
        const mechanicalPhrases = ['取り組みました', '実施しました', '行いました', '活発な議論を行いました'];
        const foundMechanical = mechanicalPhrases.filter(phrase => 
            result.content.includes(phrase)
        );
        
        let baseScore = 1.0;
        
        if (validation.reasons.length === 0) {
            // 機械的表現ペナルティ
            baseScore = Math.max(0.5, baseScore - (foundMechanical.length * 0.15));
            
            // 文字数ボーナス
            if (contentLength >= 700) baseScore += 0.1;
            if (contentLength >= 900) baseScore += 0.1;
            
            // セクションバランスチェック
            const sectionBalance = this.checkSectionBalance(result.content);
            baseScore += sectionBalance * 0.2;
            
            // タイトル品質チェック
            if (result.title.includes('【代筆】') && result.title.length >= 15) {
                baseScore += 0.1;
            }
        }
        
        validation.qualityScore = Math.min(1.0, baseScore);
        validation.isValid = validation.isValid && validation.qualityScore >= this.config.qualityThreshold;
        
        if (foundMechanical.length > 0) {
            validation.improvements.push(`機械的表現の除去: ${foundMechanical.join(', ')}`);
        }
        
        return validation;
    }

    /**
     * 📏 セクションバランスチェック
     */
    checkSectionBalance(content) {
        const sections = content.split(/\*\*(?:やったこと|TIL|こんな気分)\*\*/);
        if (sections.length < 4) return 0; // セクション分割失敗
        
        const sectionLengths = sections.slice(1).map(s => s.trim().length);
        const avgLength = sectionLengths.reduce((a, b) => a + b, 0) / sectionLengths.length;
        
        if (avgLength === 0) return 0;
        
        const variance = sectionLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sectionLengths.length;
        
        // 分散が小さいほど（バランスが良いほど）高得点
        return Math.max(0, 1 - (variance / (avgLength * avgLength)));
    }

    /**
     * 👤 日本語表示名取得（Phase 6互換 + Slack動的取得対応）
     */
    getJapaneseDisplayName(userName, options = {}) {
        // 1. esaユーザー情報から取得（最優先：必ず日本語名が含まれる）
        if (options.esaUser?.name) {
            console.log(`✅ esa日本語表記名使用: ${userName} -> ${options.esaUser.name}`);
            return options.esaUser.name;
        }
        
        // 2. Slackから取得した日本語表示名をチェック
        if (options.slackRealName || options.slackDisplayName) {
            const slackName = options.slackDisplayName || options.slackRealName;
            
            // 日本語文字が含まれているかチェック
            if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(slackName)) {
                console.log(`✅ Slack日本語表記名使用: ${userName} -> ${slackName}`);
                return slackName;
            }
        }
        
        // 3. フォールバック: 固定マッピング（Phase 6互換）
        const knownMappings = {
            'okamoto-takuya': '岡本拓也',
            'takuya.okamoto': '岡本拓也'
        };
        
        const japaneseDisplayName = knownMappings[userName];
        
        if (japaneseDisplayName) {
            console.log(`✅ 固定マッピング使用: ${userName} -> ${japaneseDisplayName}`);
            return japaneseDisplayName;
        }
        
        console.log(`⚠️ 日本語表記名が見つからないため、元の名前を使用: ${userName}`);
        return userName;
    }

    /**
     * 📊 Phase 7b品質フッタ生成
     */
    generateQualityFooter(validation, result, context) {
        const now = new Date();
        const timestamp = now.toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        
        let footer = '\n---\n\n';
        
        // 🤖 AI自律システム情報
        footer += `**🤖 Phase 7b AI自律システム情報**\n`;
        footer += `* **生成日時**: ${timestamp}\n`;
        footer += `* **生成方式**: ${this.config.autonomyLevel === 'high' ? '完全自律' : '半自律'}AI生成 (${this.config.model})\n`;
        footer += `* **品質スコア**: ${Math.round(validation.qualityScore * 100)}% `;
        
        // 品質レベルの判定
        if (validation.qualityScore >= 0.95) {
            footer += '⭐⭐⭐⭐⭐ (最高品質)\n';
        } else if (validation.qualityScore >= 0.85) {
            footer += '⭐⭐⭐⭐ (高品質)\n';
        } else if (validation.qualityScore >= 0.75) {
            footer += '⭐⭐⭐ (標準品質)\n';
        } else {
            footer += '⭐⭐ (改善余地あり)\n';
        }
        
        // データソース情報
        footer += `* **データソース**: `;
        const toolsUsed = result.metadata?.toolsUsed || this.lastExecutionStats?.toolsUsed || 0;
        if (toolsUsed > 0) {
            footer += `リアルタイムMCPデータ (${toolsUsed}ツール使用)\n`;
        } else {
            footer += `AI知識ベース\n`;
        }
        
        // 処理時間とパフォーマンス
        const processingTime = this.lastExecutionStats?.processingTime || 0;
        footer += `* **処理時間**: ${(processingTime / 1000).toFixed(1)}秒\n`;
        
        // AI自律性の指標
        footer += `* **自律性レベル**: ${this.config.autonomyLevel} `;
        if (this.config.autonomyLevel === 'high') {
            footer += '(人間介入なし)\n';
        } else if (this.config.autonomyLevel === 'medium') {
            footer += '(ガイド付き)\n';
        } else {
            footer += '(制御付き)\n';
        }
        
        // 改善提案（あれば）
        if (validation.improvements && validation.improvements.length > 0) {
            footer += `\n**💡 品質向上のヒント**:\n`;
            validation.improvements.forEach(improvement => {
                footer += `* ${improvement}\n`;
            });
        }
        
        footer += `\n**🚀 生成エンジン**: Phase 7b UnifiedDiaryGenerator v${this.config.version || '7b.1.0'}\n`;
        
        return footer;
    }

    /**
     * 📅 esaカテゴリ生成
     */
    generateEsaCategory() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        return `AI代筆日記/${year}/${month}/${day}`;
    }

    /**
     * 🚨 緊急フォールバック（Phase 6.6+互換）
     */
    async executeEmergencyFallback(userName, instructions, originalError, options = {}) {
        console.log('🚨 緊急フォールバック実行: Phase 6.6+システム使用');
        
        try {
            // Phase 6.6+の既存システムを呼び出し
            const LLMDiaryGeneratorPhase53Unified = require('../mcp-integration/llm-diary-generator-phase53-unified');
            const legacyGenerator = new LLMDiaryGeneratorPhase53Unified();
            
            const fallbackResult = await legacyGenerator.generateAdvancedDiary(userName, {
                instructions: instructions
            });
            
            return {
                ...fallbackResult,
                metadata: {
                    ...fallbackResult.metadata,
                    generationMethod: 'phase66_fallback',
                    fallbackUsed: true,
                    fallbackReason: originalError.message,
                    originalError: originalError.name
                }
            };
            
        } catch (fallbackError) {
            console.log('🚨 フォールバックも失敗、緊急生成実行');
            return this.generateEmergencyDiary(userName, originalError);
        }
    }

    /**
     * 🆘 最終緊急日記生成
     */
    generateEmergencyDiary(userName, error) {
        const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long'
        });
        
        const emergencyContent = this.generateEmergencyContent(userName);
        
        return {
            title: `【代筆】${userName}: ${today.split('（')[0]}の振り返り`,
            content: emergencyContent,
            category: this.generateEsaCategory(),
            metadata: {
                generationMethod: 'emergency_fallback',
                fallbackUsed: true,
                originalError: error.message,
                qualityScore: 0.6,
                warning: '緊急モードで生成されました'
            }
        };
    }

    /**
     * 📝 緊急コンテンツ生成
     */
    generateEmergencyContent(userName) {
        const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long'
        });
        
        return `## ${today}の振り返り

**やったこと**
今日も一日お疲れさまでした。システムの調子があまり良くなかったため、詳細な情報収集ができませんでしたが、いつも通りお仕事や日常の活動に取り組まれたと思います。

**TIL (Today I Learned)**
技術的なことや新しい発見があった一日だったのではないでしょうか。

**こんな気分**
お疲れさまでした。明日も良い一日になりそうですね。

---
**注意**: この日記は緊急モードで生成されました。システムの一時的な問題により、通常の品質での生成ができませんでした。`;
    }

    /**
     * 🎛️ 設定更新
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log(`🔧 UnifiedDiaryGenerator設定更新:`, newConfig);
    }

    /**
     * 📊 統計情報取得
     */
    getStats() {
        return {
            version: '7b.1.0',
            autonomyLevel: this.config.autonomyLevel,
            qualityThreshold: this.config.qualityThreshold,
            model: this.config.model,
            lastExecution: this.lastExecutionStats
        };
    }
}

/**
 * 品質検証エラークラス
 */
class QualityValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'QualityValidationError';
    }
}

module.exports = UnifiedDiaryGenerator;
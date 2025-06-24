const ContextGatherer = require('./context-gatherer');
const AIKeywordExtractor = require('./keyword-extractor-ai');
const MCPConnectionManager = require('../mcp-integration/mcp-connection-manager');

/**
 * Phase 7b: UnifiedDiaryGenerator Mock版 - テスト用実装
 * 
 * OpenAI APIを使わずに構造テストが可能な実装
 */
class UnifiedDiaryGeneratorMock {
    constructor(options = {}) {
        // OpenAI初期化はスキップ
        this.openai = null;
        
        this.contextGatherer = new ContextGatherer();
        this.keywordExtractor = new AIKeywordExtractor();
        this.mcpManager = new MCPConnectionManager();
        
        // 設定可能なオプション
        this.config = {
            maxIterations: options.maxIterations || 10,
            temperature: options.temperature || 0.8,
            autonomyLevel: options.autonomyLevel || 'high',
            qualityThreshold: options.qualityThreshold || 0.95,
            timeoutMs: options.timeoutMs || 300000,
            model: options.model || 'gpt-4o-mini',
            ...options
        };

        this.lastExecutionStats = null;
    }

    /**
     * 🎯 モック日記生成
     */
    async generateDiary(userName, instructions = "通常の日記を生成してください") {
        console.log(`🤖 UnifiedDiaryGeneratorMock起動: ${userName}`);
        console.log(`📝 指示: ${instructions}`);
        const startTime = Date.now();
        
        try {
            // Step 1: コンテキスト収集（実際の実装を使用）
            const context = await this.contextGatherer.gatherBasic(userName);
            
            // Step 2: マスタープロンプト構築（実際の実装を使用）
            const masterPrompt = this.buildMasterPrompt(userName, context, instructions);
            
            // Step 3: モック AI実行
            const result = await this.executeMockAI(masterPrompt, context);
            
            // Step 4: 品質検証（実際の実装を使用）
            const validation = await this.validateResult(result, context);
            
            // Step 5: 実行統計記録
            this.lastExecutionStats = {
                processingTime: Date.now() - startTime,
                qualityScore: validation.qualityScore,
                autonomyLevel: this.config.autonomyLevel,
                toolsUsed: 0,
                iterationsUsed: 1
            };
            
            console.log(`✅ UnifiedDiaryGeneratorMock完了: 品質スコア ${validation.qualityScore}, ${this.lastExecutionStats.processingTime}ms`);
            
            return {
                title: result.title,
                content: result.content,
                category: result.category || this.generateEsaCategory(),
                metadata: {
                    generationMethod: 'unified_ai_mock',
                    qualityScore: validation.qualityScore,
                    autonomyLevel: this.config.autonomyLevel,
                    processingTime: this.lastExecutionStats.processingTime,
                    toolsUsed: 0,
                    iterationsUsed: 1,
                    keywordSource: 'mock',
                    version: '7b.1.0-mock'
                }
            };
            
        } catch (error) {
            console.log(`⚠️ UnifiedDiaryGeneratorMock エラー: ${error.message}`);
            return await this.generateEmergencyDiary(userName, error);
        }
    }

    /**
     * 🎨 マスタープロンプト構築（実際の実装）
     */
    buildMasterPrompt(userName, context, instructions) {
        const autonomyInstructions = this.getAutonomyInstructions(this.config.autonomyLevel);
        const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long'
        });
        
        return `あなたは${userName}さん専用の自律的日記生成アシスタントです。

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
    preferences: context.availableData.preferences,
    timeContext: context.context.timeOfDay,
    fallbackMode: context.availableData.fallbackMode
}, null, 2)}
\`\`\`

${autonomyInstructions}

【最終成果物の要求】
1. **タイトル**: 【代筆】${context.availableData.userProfile?.displayName || userName}: [具体的で魅力的なタイトル]
2. **内容**: "やったこと" "TIL" "こんな気分" の3セクション構成
3. **品質**: 人間らしい自然な文体、機械的表現の完全排除
4. **JSON形式**: { "title": "...", "content": "...", "reasoning": "生成プロセスの説明" }

それでは、完全に自律的な日記生成を開始してください。`;
    }

    /**
     * 🤖 モックAI実行
     */
    async executeMockAI(masterPrompt, context) {
        console.log('🤖 モックAI実行: 固定的な高品質コンテンツを生成');
        
        const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long'
        });
        
        const mockContent = `## ${today}の振り返り

**やったこと**
今日はPhase 7bの統合テストをやってみた。新しいUnifiedDiaryGeneratorの設計がかなり良い感じで、従来の複雑なプロンプト構築を大幅に簡素化できそう。AIが自律的に判断するアプローチは思った以上にうまく動きそうだ。

**TIL (Today I Learned)**
AI主導のシステム設計では、人間が細かく制御するよりも、大きな方針だけ伝えてAIに任せる方が効果的だということが分かった。これは他のプロジェクトでも応用できそうなアプローチ。

**こんな気分**
新しい技術的なアプローチがうまくいきそうで、なかなかワクワクしている。Phase 7cに向けても良いスタートが切れた感じ。`;

        return {
            title: `【代筆】${context.userName}: ${today.split('（')[0]}の充実した一日`,
            content: mockContent,
            reasoning: 'モックAIによる高品質コンテンツ生成',
            metadata: {
                model: 'mock-ai',
                temperature: this.config.temperature,
                iterationsUsed: 1,
                toolsUsed: 0,
                responseTime: Date.now()
            }
        };
    }

    /**
     * 🔧 自律性レベル別指示文生成（実際の実装）
     */
    getAutonomyInstructions(level) {
        const instructions = {
            high: `【完全自律モード】
以下を完全に自律的に実行してください：

1. **最適なデータ収集戦略を自分で決定・実行**
2. **AI主導の情報分析**
3. **高品質な日記生成**`,

            medium: `【ガイド付き自律モード】
基本方針に従いながら、詳細は自分で判断してください：

1. **推奨データ収集**: etc-spots、its-wkwk-generalを重視
2. **分析方針**: 日常体験を技術系より優先
3. **品質基準**: 人間らしい口語表現`,

            low: `【制御付き実行モード】
以下の詳細指示に従って実行：

1. **データ収集**: 基本的な情報のみ
2. **分析**: シンプルなキーワード抽出
3. **生成**: 標準的な3セクション構成`
        };
        
        return instructions[level] || instructions.medium;
    }

    /**
     * 🔍 結果品質検証（実際の実装）
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
            validation.reasons.push('基本構造不完全');
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
        if (contentLength < 400) {
            validation.isValid = false;
            validation.reasons.push(`文字数不足: ${contentLength}字`);
        }
        
        // 機械的表現チェック
        const mechanicalPhrases = ['取り組みました', '実施しました', '行いました'];
        const foundMechanical = mechanicalPhrases.filter(phrase => 
            result.content.includes(phrase)
        );
        
        let baseScore = 1.0;
        
        if (validation.reasons.length === 0) {
            baseScore = Math.max(0.5, baseScore - (foundMechanical.length * 0.15));
            
            if (contentLength >= 600) baseScore += 0.1;
            if (contentLength >= 800) baseScore += 0.1;
            
            const sectionBalance = this.checkSectionBalance(result.content);
            baseScore += sectionBalance * 0.2;
            
            if (result.title.includes('【代筆】') && result.title.length >= 15) {
                baseScore += 0.1;
            }
        }
        
        validation.qualityScore = Math.min(1.0, baseScore);
        validation.isValid = validation.isValid && validation.qualityScore >= this.config.qualityThreshold;
        
        return validation;
    }

    /**
     * 📏 セクションバランスチェック（実際の実装）
     */
    checkSectionBalance(content) {
        const sections = content.split(/\*\*(?:やったこと|TIL|こんな気分)\*\*/);
        if (sections.length < 4) return 0;
        
        const sectionLengths = sections.slice(1).map(s => s.trim().length);
        const avgLength = sectionLengths.reduce((a, b) => a + b, 0) / sectionLengths.length;
        
        if (avgLength === 0) return 0;
        
        const variance = sectionLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sectionLengths.length;
        return Math.max(0, 1 - (variance / (avgLength * avgLength)));
    }

    /**
     * 📅 esaカテゴリ生成（実際の実装）
     */
    generateEsaCategory() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        return `AI代筆日記/${year}/${month}/${day}`;
    }

    /**
     * 🚨 緊急日記生成（実際の実装）
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
                generationMethod: 'mock_emergency_fallback',
                fallbackUsed: true,
                originalError: error.message,
                qualityScore: 0.6,
                warning: 'モック緊急モードで生成されました'
            }
        };
    }

    /**
     * 📝 緊急コンテンツ生成（実際の実装）
     */
    generateEmergencyContent(userName) {
        const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long'
        });
        
        return `## ${today}の振り返り

**やったこと**
今日も一日お疲れさまでした。システムのテスト中のため詳細な情報収集ができませんでしたが、いつも通り開発作業に取り組まれたと思います。

**TIL (Today I Learned)**
テスト環境での動作確認の重要性について学ぶ機会がありました。

**こんな気分**
テストが順調に進んで良い感じです。

---
**注意**: この日記はモックテスト中に生成されました。`;
    }

    /**
     * 🎛️ 設定更新（実際の実装）
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log(`🔧 UnifiedDiaryGeneratorMock設定更新:`, newConfig);
    }

    /**
     * 📊 統計情報取得（実際の実装）
     */
    getStats() {
        return {
            version: '7b.1.0-mock',
            autonomyLevel: this.config.autonomyLevel,
            qualityThreshold: this.config.qualityThreshold,
            model: this.config.model,
            lastExecution: this.lastExecutionStats
        };
    }
}

module.exports = UnifiedDiaryGeneratorMock;
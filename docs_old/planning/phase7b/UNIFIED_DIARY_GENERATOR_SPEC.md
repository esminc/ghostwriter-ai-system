# 🔄 UnifiedDiaryGenerator 詳細仕様書

**策定日**: 2025年6月24日  
**対象**: Phase 7b統合日記生成器  
**目標**: 自律的AI日記生成システムの核心実装  

---

## 🎯 **設計思想**

### **Core Principle: "AIに全てを任せる"**

従来のシステムでは人間が細かく制御していた処理を、AIの判断に委ねることで：
- **複雑性の根本解決**: 300行の複雑ロジック → 20行のシンプル設計
- **無限の拡張性**: 自然言語指示による機能追加
- **自律的品質管理**: AI自身による品質判断と改善

---

## 🏗️ **クラス設計**

### **1. UnifiedDiaryGenerator (メインクラス)**

```javascript
// src/ai/unified-diary-generator.js
class UnifiedDiaryGenerator {
    constructor(options = {}) {
        this.aiClient = new OpenAIClient();
        this.mcpManager = new MCPConnectionManager();
        this.contextGatherer = new ContextGatherer();
        this.autonomousExecutor = new AutonomousExecutor();
        this.errorRecovery = new ErrorRecoverySystem();
        
        // 設定可能なオプション
        this.config = {
            maxIterations: options.maxIterations || 10,
            temperature: options.temperature || 0.8,
            autonomyLevel: options.autonomyLevel || 'high', // high, medium, low
            qualityThreshold: options.qualityThreshold || 0.95,
            timeoutMs: options.timeoutMs || 300000, // 5分
            ...options
        };
    }

    /**
     * 🎯 メインエントリーポイント: 統合日記生成
     */
    async generateDiary(userName, instructions = "通常の日記を生成してください") {
        console.log(`🤖 UnifiedDiaryGenerator起動: ${userName}`);
        console.log(`📝 指示: ${instructions}`);
        
        try {
            // Step 1: コンテキスト収集
            const context = await this.contextGatherer.gatherAll(userName, {
                instructions,
                autonomyLevel: this.config.autonomyLevel
            });
            
            // Step 2: マスタープロンプト構築
            const masterPrompt = this.buildMasterPrompt(userName, context, instructions);
            
            // Step 3: AI自律実行
            const result = await this.autonomousExecutor.executeWithTools(masterPrompt, {
                tools: context.tools,
                maxIterations: this.config.maxIterations,
                temperature: this.config.temperature,
                qualityThreshold: this.config.qualityThreshold,
                timeoutMs: this.config.timeoutMs
            });
            
            // Step 4: 品質検証
            const validation = await this.validateResult(result, context);
            if (!validation.isValid) {
                throw new QualityValidationError(validation.reasons);
            }
            
            console.log(`✅ UnifiedDiaryGenerator完了: 品質スコア ${validation.qualityScore}`);
            return {
                ...result,
                metadata: {
                    generationMethod: 'unified_ai_autonomous',
                    qualityScore: validation.qualityScore,
                    autonomyLevel: this.config.autonomyLevel,
                    iterationsUsed: result.iterationsUsed,
                    processingTime: result.processingTime
                }
            };
            
        } catch (error) {
            console.log(`⚠️ UnifiedDiaryGenerator エラー: ${error.message}`);
            
            // 自動回復試行
            return await this.errorRecovery.handleError(error, {
                userName,
                instructions,
                context: await this.contextGatherer.gatherBasic(userName)
            });
        }
    }

    /**
     * 🎨 マスタープロンプト構築: AI自律性を最大化
     */
    buildMasterPrompt(userName, context, instructions) {
        const autonomyInstructions = this.getAutonomyInstructions(this.config.autonomyLevel);
        
        return `あなたは${userName}さん専用の自律的日記生成アシスタントです。

【今回のミッション】
${instructions}

【あなたの能力と権限】
- 利用可能なMCPツール: ${context.tools.length}個のツール
- 自律実行レベル: ${this.config.autonomyLevel}
- 品質目標: ${this.config.qualityThreshold * 100}%以上
- 最大実行ステップ: ${this.config.maxIterations}回

【利用可能なリソース】
\`\`\`json
${JSON.stringify(context.availableData, null, 2)}
\`\`\`

${autonomyInstructions}

【最終成果物の要求】
1. **タイトル**: 【代筆】${userName}: [具体的で魅力的なタイトル]
2. **内容**: "やったこと" "TIL" "こんな気分" の3セクション構成
3. **品質**: 人間らしい自然な文体、機械的表現の完全排除
4. **投稿**: 適切なesaカテゴリへの自動投稿完了

【処理の透明性】
すべての判断と実行過程を詳細にログ出力し、最終的に実行サマリーを提供してください。

【緊急時対応】
エラーや問題が発生した場合は、自分で最適な代替手段を判断し、可能な限り高品質な結果を生成してください。品質が目標に達しない場合は、その理由と改善提案を含めて報告してください。

それでは、自律的な日記生成を開始してください。`;
    }

    /**
     * 🔧 自律性レベル別の指示文生成
     */
    getAutonomyInstructions(level) {
        const instructions = {
            high: `【完全自律モード】
あなたは完全に自律的に実行してください：

1. **データ収集戦略の決定**
   - どのSlackチャンネルを優先すべきか自分で判断
   - esa記事の検索戦略を自分で決定
   - 収集期間・件数を最適化

2. **情報分析の実行**
   - キーワード抽出を自分で実行
   - ユーザーの文体を過去記事から自分で学習
   - 日常体験vs技術系の優先度を自分で判断

3. **コンテンツ生成の管理**
   - 最適な文章構成を自分で決定
   - 適切な文体・トーンを自分で選択
   - 品質チェックを自分で実行

4. **投稿プロセスの管理**
   - 最適なesaカテゴリを自分で判断
   - 投稿タイミングを自分で決定
   - エラー時の対処を自分で実行`,

            medium: `【ガイド付き自律モード】
基本方針に従いながら、詳細は自分で判断してください：

1. **推奨データ収集**：etc-spots、its-wkwk-generalを重視しつつ、最適なバランスを判断
2. **分析方針**：日常体験を技術系より優先、但し具体的な重み付けは自分で決定
3. **品質基準**：人間らしい口語表現、機械的表現の回避
4. **投稿方針**：AI代筆日記/YYYY/MM/DD形式でのカテゴリ投稿`,

            low: `【制御付き実行モード】
以下の詳細指示に従って実行してください：

1. **データ収集**：
   - 優先チャンネル：etc-spots (15件), its-wkwk-general (20件)
   - esa記事：72時間以内の記事を最大5件
   - 期間：過去24時間のSlackメッセージ

2. **分析要件**：
   - 日常体験キーワードを最優先抽出
   - 技術系キーワードは補助的に使用
   - ユーザー過去記事から文体パターンを3-5個抽出

3. **生成要件**：
   - セクション：やったこと（150-200字）、TIL（100-150字）、こんな気分（80-120字）
   - 文体：口語的、親しみやすい表現
   - 避けるべき表現：「取り組みました」「実施しました」等の機械的表現`
        };
        
        return instructions[level] || instructions.medium;
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
        if (contentLength < 200) {
            validation.isValid = false;
            validation.reasons.push(`文字数不足: ${contentLength}字 (最低200字必要)`);
        }
        
        // 機械的表現チェック
        const mechanicalPhrases = ['取り組みました', '実施しました', '行いました', '活発な議論を行いました'];
        const foundMechanical = mechanicalPhrases.filter(phrase => 
            result.content.includes(phrase)
        );
        
        if (foundMechanical.length > 0) {
            validation.qualityScore -= 0.2;
            validation.improvements.push(`機械的表現の除去: ${foundMechanical.join(', ')}`);
        }
        
        // 基本品質スコア計算
        let baseScore = 1.0;
        if (validation.reasons.length === 0) {
            baseScore = Math.max(0, baseScore - (foundMechanical.length * 0.1));
            
            // 文字数による調整
            if (contentLength >= 400) baseScore += 0.1;
            if (contentLength >= 600) baseScore += 0.1;
            
            // セクションバランスチェック
            const sectionBalance = this.checkSectionBalance(result.content);
            baseScore += sectionBalance * 0.2;
        }
        
        validation.qualityScore = Math.min(1.0, baseScore);
        validation.isValid = validation.isValid && validation.qualityScore >= this.config.qualityThreshold;
        
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
        const variance = sectionLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sectionLengths.length;
        
        // 分散が小さいほど（バランスが良いほど）高得点
        return Math.max(0, 1 - (variance / (avgLength * avgLength)));
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
            lastExecution: this.lastExecutionStats || null
        };
    }
}

module.exports = UnifiedDiaryGenerator;
```

---

## 🔧 **依存クラス仕様**

### **2. ContextGatherer (コンテキスト収集器)**

```javascript
// src/ai/context-gatherer.js
class ContextGatherer {
    constructor() {
        this.mcpManager = new MCPConnectionManager();
        this.userProfileCache = new Map();
    }

    async gatherAll(userName, options = {}) {
        console.log(`🔍 コンテキスト収集開始: ${userName}`);
        
        const capabilities = await this.discoverCapabilities();
        const userProfile = await this.getUserProfile(userName);
        
        return {
            userName,
            timestamp: new Date().toISOString(),
            instructions: options.instructions || "通常の日記生成",
            autonomyLevel: options.autonomyLevel || 'medium',
            
            availableData: {
                slackChannels: capabilities.slack?.channels || [],
                esaAccess: capabilities.esa?.available || false,
                userProfile: userProfile,
                recentActivity: await this.getRecentActivity(userName),
                preferences: await this.getUserPreferences(userName)
            },
            
            tools: capabilities.allTools || [],
            
            context: {
                timeOfDay: this.getTimeContext(),
                dayOfWeek: new Date().toLocaleDateString('ja-JP', { weekday: 'long' }),
                specialEvents: await this.checkSpecialEvents()
            }
        };
    }

    async gatherBasic(userName) {
        // エラー回復時の最小限コンテキスト
        return {
            userName,
            timestamp: new Date().toISOString(),
            availableData: {
                userProfile: { name: userName },
                fallbackMode: true
            },
            tools: [],
            context: { timeOfDay: this.getTimeContext() }
        };
    }

    async discoverCapabilities() {
        try {
            const connections = await this.mcpManager.getAllConnections();
            const capabilities = { allTools: [] };
            
            for (const [name, connection] of connections) {
                capabilities[name] = {
                    available: await connection.isAvailable(),
                    tools: await connection.listTools(),
                    channels: name === 'slack' ? await this.getSlackChannels(connection) : null
                };
                
                capabilities.allTools.push(...(capabilities[name].tools || []));
            }
            
            return capabilities;
        } catch (error) {
            console.log(`⚠️ 機能発見エラー: ${error.message}`);
            return { allTools: [] };
        }
    }
}
```

### **3. AutonomousExecutor (自律実行エンジン)**

```javascript
// src/ai/autonomous-executor.js
class AutonomousExecutor {
    constructor() {
        this.aiClient = new OpenAIClient();
        this.executionHistory = [];
    }

    async executeWithTools(prompt, options = {}) {
        const execution = new ExecutionContext(options);
        
        console.log(`🤖 自律実行開始: 最大${options.maxIterations}ステップ`);
        
        let step = 0;
        while (!execution.isComplete() && step < options.maxIterations) {
            console.log(`📝 ステップ ${step + 1}: AI判断実行中...`);
            
            try {
                const response = await this.aiClient.generateWithTools(prompt, {
                    tools: options.tools,
                    context: execution.getContext(),
                    temperature: options.temperature || 0.8,
                    maxTokens: 2000
                });
                
                // AI応答の解析と実行
                const actions = await this.parseAndExecuteActions(response, execution);
                
                // 品質チェック
                if (execution.hasResult()) {
                    const quality = await this.checkQuality(execution.getResult(), options.qualityThreshold);
                    if (quality.isAcceptable) {
                        console.log(`✅ 品質基準達成: ${quality.score}`);
                        break;
                    }
                }
                
                step++;
                
            } catch (stepError) {
                console.log(`❌ ステップ${step + 1}エラー: ${stepError.message}`);
                execution.recordError(stepError);
                
                if (!execution.canContinue()) {
                    break;
                }
            }
        }
        
        const result = execution.getFinalResult();
        result.iterationsUsed = step;
        result.processingTime = execution.getElapsedTime();
        
        console.log(`🏁 自律実行完了: ${step}ステップ, ${result.processingTime}ms`);
        return result;
    }
}
```

---

## 📊 **設定オプション**

### **autonomyLevel による動作制御**

| レベル | 説明 | 制御範囲 | 適用場面 |
|--------|------|----------|----------|
| **high** | 完全自律 | AIが全判断 | 本番運用、経験豊富なユーザー |
| **medium** | ガイド付き | 基本方針＋AI判断 | 標準運用、バランス重視 |
| **low** | 制御付き | 詳細指示＋確認 | デバッグ、新規ユーザー |

### **品質しきい値設定**

```javascript
const qualityThresholds = {
    production: 0.95,    // 本番環境
    staging: 0.90,       // ステージング
    development: 0.80,   // 開発環境
    experimental: 0.70   // 実験環境
};
```

---

## 🧪 **テスト戦略**

### **単体テスト**

```javascript
// tests/unit/unified-diary-generator.test.js
describe('UnifiedDiaryGenerator', () => {
    test('基本的な日記生成', async () => {
        const generator = new UnifiedDiaryGenerator({
            autonomyLevel: 'medium',
            qualityThreshold: 0.8
        });
        
        const result = await generator.generateDiary('test-user');
        
        expect(result.title).toMatch(/【代筆】test-user:/);
        expect(result.content).toContain('やったこと');
        expect(result.metadata.qualityScore).toBeGreaterThan(0.8);
    });
});
```

### **統合テスト**

```javascript
// tests/integration/phase7b-integration.test.js
describe('Phase7b Integration', () => {
    test('Phase7aとの統合', async () => {
        const generator = new UnifiedDiaryGenerator();
        const result = await generator.generateDiary('岡本');
        
        // Phase7aキーワード抽出が正しく統合されているか
        expect(result.metadata.keywordSource).toBe('ai_extraction');
    });
});
```

---

## 🎯 **Phase 7c への準備**

この UnifiedDiaryGenerator は Phase 7c での完全AI中心アーキテクチャの基盤として設計されており：

1. **AIOrchestrator への統合準備**: 自律実行能力の実証
2. **MCP動的発見の実装**: ツール自動発見機能
3. **完全自動化への道筋**: 人間介入の最小化

Phase 7b完了時点で、システムは90%の自律性を実現し、Phase 7cでの100%自律化への準備が整います。

---

**策定者**: Claude Code  
**承認**: Pending  
**実装準備**: 完了
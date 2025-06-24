# 🔄 Phase 7b: プロンプト構築簡素化 設計仕様書

**策定日**: 2025年6月24日  
**対象システム**: GhostWriter AI代筆システム  
**目標**: 複雑なプロンプト構築ロジックの大幅簡素化  

---

## 📋 **現状分析: 複雑性の問題点**

### **現在の実装 (`llm-diary-generator-phase53-unified.js`)**

**問題のあるコード構造**:
```javascript
// 🚨 問題: 300+ lines の複雑なプロンプト構築
async buildCreativePrompt(userName, contextData, today) {
    // 50+ lines: データ収集と前処理
    const esaContent = this.extractEsaArticleContent(contextData.esaData);
    const slackWords = await this.extractSlackKeywords(slackData);
    const activities = this.combineActivities(esa, slack);
    const profileInfo = this.analyzeProfile(contextData);
    
    // 100+ lines: 詳細なプロンプト構築
    const prompt = `非常に詳細で長大なプロンプト
    【利用可能な情報】 - 8項目の詳細指定
    【最重要】- 複雑な条件分岐
    【重要な制約・スタイル指示】- 7項目の詳細ルール
    【文体例】- 良い例・悪い例の明示
    【出力形式】- 厳密なJSON形式指定
    【タイトル生成ガイドライン】- 6項目の細かい指示
    【内容構成】- 3セクションの詳細要求
    `;
    
    // 50+ lines: 実行とエラーハンドリング
    const response = await this.openaiClient.chatCompletion([
        { role: 'system', content: '詳細なシステムプロンプト' },
        { role: 'user', content: prompt }
    ], { 複雑なパラメータ設定 });
    
    // 100+ lines: レスポンス解析と後処理
    const parsed = this.parseComplexResponse(response);
    return this.validateAndFormat(parsed);
}
```

### **特定された問題点**

#### **1. 過度な詳細制御**
- JavaScriptコードで細かい条件分岐
- プロンプト変更時のコード修正必要
- 300行以上の複雑なロジック

#### **2. AI自律性の制限**
- 人間が全ての詳細を指定
- AIの判断能力を活用していない
- 固定的で柔軟性に欠ける

#### **3. 保守性の問題**
- 新しい要求への対応が困難
- コード変更のリスクが高い
- テストケースの複雑化

#### **4. 分離されていない責任**
- データ収集、プロンプト構築、実行、解析が混在
- 単一責任原則に違反
- 再利用性が低い

---

## 🎯 **Phase 7b アーキテクチャ設計**

### **新しい統合AI生成システム**

#### **1. UnifiedDiaryGenerator: 統合日記生成器**

```javascript
// src/ai/unified-diary-generator.js (20 lines)
class UnifiedDiaryGenerator {
    constructor() {
        this.aiClient = new OpenAIClient();
        this.mcpManager = new MCPConnectionManager();
        this.contextGatherer = new ContextGatherer();
    }

    async generateDiary(userName, options = {}) {
        // 🎯 シンプルな統合実行
        const context = await this.contextGatherer.gatherAll(userName, options);
        
        const masterPrompt = this.buildMasterPrompt(userName, context, options);
        
        return await this.aiClient.executeWithTools(masterPrompt, {
            tools: await this.mcpManager.getAllTools(),
            maxIterations: 10,
            temperature: 0.8,
            autonomousMode: true
        });
    }

    buildMasterPrompt(userName, context, options) {
        return `あなたは${userName}さん専用の自律的日記生成アシスタントです。

【基本ミッション】
今日の日記を生成してください。必要な情報は自分で収集し、分析し、最適な内容を生成してください。

【利用可能リソース】
${JSON.stringify(context.availableData, null, 2)}

【基本要件】
- 構成: 「やったこと」「TIL」「こんな気分」
- 文体: ${userName}さんの過去記事から学習した自然な口語
- 重視: 日常体験（食事、場所、イベント） > 技術系内容
- 品質: 人間らしく、機械的表現は避ける

【自律実行指示】
1. 必要なデータをMCPツールで自分で取得してください
2. ユーザーの文体を過去記事から自分で分析してください
3. キーワード抽出も自分で実行してください
4. 品質チェックも自分で行ってください
5. 最適なカテゴリを判断してesaに自動投稿してください

【品質基準】
- 関心事反映度: 95%以上
- 文体一貫性: 過去記事との自然な連続性
- 具体性: 抽象的でない具体的な体験描写
- 透明性: 処理過程の詳細ログ出力

エラーが発生した場合は自分で対処し、可能な限り高品質な結果を生成してください。
全ての処理を透明性を保って実行し、詳細なログを出力してください。`;
    }
}
```

#### **2. ContextGatherer: コンテキスト収集器**

```javascript
// src/ai/context-gatherer.js (15 lines)
class ContextGatherer {
    constructor() {
        this.mcpManager = new MCPConnectionManager();
    }

    async gatherAll(userName, options = {}) {
        // 🎯 利用可能なデータソースの動的発見
        const capabilities = await this.mcpManager.discoverCapabilities();
        
        return {
            userName,
            timestamp: new Date().toISOString(),
            availableData: {
                slackChannels: capabilities.slack.channels,
                esaAccess: capabilities.esa.available,
                userProfile: options.profileHints || null,
                specialInstructions: options.instructions || "通常の日記生成"
            },
            tools: capabilities.allTools,
            preferences: await this.loadUserPreferences(userName)
        };
    }

    async loadUserPreferences(userName) {
        // ユーザー固有の設定を取得（将来の拡張ポイント）
        return {
            preferredStyle: 'casual',
            priorityChannels: ['etc-spots', 'its-wkwk-general'],
            excludeTopics: []
        };
    }
}
```

#### **3. 段階的移行戦略**

**Phase 7b-α: 最小限移行 (1週間)**
```javascript
// 既存システムとの並行稼働
class HybridDiaryGenerator {
    async generateDiary(userName, options = {}) {
        try {
            // 🆕 新システム試行
            return await this.unifiedGenerator.generateDiary(userName, options);
        } catch (error) {
            console.log('🔄 フォールバック: 既存システム使用');
            // 🔄 既存システムフォールバック
            return await this.legacyGenerator.generateAdvancedDiary(userName, options);
        }
    }
}
```

**Phase 7b-β: 完全移行 (1週間)**
```javascript
// 既存システム完全置換
const diaryGenerator = new UnifiedDiaryGenerator();
```

---

## 🔧 **技術実装詳細**

### **1. AI自律実行エンジン**

```javascript
// src/ai/autonomous-executor.js
class AutonomousExecutor {
    async executeWithTools(prompt, options = {}) {
        const execution = new ExecutionContext(options);
        
        let step = 0;
        while (!execution.isComplete() && step < options.maxIterations) {
            const response = await this.aiClient.generate(prompt, {
                tools: options.tools,
                context: execution.getContext(),
                messages: execution.getHistory()
            });
            
            // AI判断によるツール実行
            const actions = this.parseAIActions(response);
            for (const action of actions) {
                await execution.executeAction(action);
            }
            
            // エラー回復判断
            if (execution.hasError() && execution.canRecover()) {
                execution.attemptRecovery();
            } else if (execution.hasError()) {
                break;
            }
            
            step++;
        }
        
        return execution.getFinalResult();
    }
}
```

### **2. MCP動的ツール発見**

```javascript
// src/mcp/dynamic-discovery.js
class MCPDynamicDiscovery {
    async discoverCapabilities() {
        const connections = await this.mcpManager.getAllConnections();
        const capabilities = {};
        
        for (const [name, connection] of connections) {
            capabilities[name] = {
                tools: await connection.listTools(),
                resources: await connection.listResources(),
                status: await connection.getStatus()
            };
        }
        
        return {
            byProvider: capabilities,
            allTools: this.flattenAllTools(capabilities),
            recommendations: await this.generateToolRecommendations(capabilities)
        };
    }
}
```

### **3. エラー回復システム**

```javascript
// src/ai/error-recovery.js
class ErrorRecoverySystem {
    async handleError(error, context) {
        const recoveryStrategies = [
            () => this.tryAlternativeApproach(error, context),
            () => this.reduceComplexity(error, context),
            () => this.fallbackToBasics(error, context)
        ];
        
        for (const strategy of recoveryStrategies) {
            try {
                const result = await strategy();
                if (result.success) {
                    return result;
                }
            } catch (strategyError) {
                continue;
            }
        }
        
        throw new AllRecoveryFailedError(error);
    }
}
```

---

## 📊 **成功指標と評価基準**

### **Phase 7b 成功指標**

#### **技術的指標**
- ✅ **コード削減**: 300+ lines → 20 lines (-93%)
- ✅ **AI自律性**: 必要データの自動判断・取得
- ✅ **エラー耐性**: 自動回復率 90%以上
- ✅ **実行時間**: 現在比120%以内

#### **品質指標**
- ✅ **関心事反映度**: 95%以上維持
- ✅ **文体一貫性**: 4.5/5以上
- ✅ **ユーザー満足度**: Phase 6.6+同等以上
- ✅ **エラー率**: 2%以下

#### **保守性指標**
- ✅ **新要求対応時間**: 50%削減
- ✅ **プロンプト変更頻度**: 月1回以下
- ✅ **バグ修正時間**: 80%削減

### **品質保証プロセス**

#### **1. 段階的品質テスト**
```javascript
// tests/phase7b/quality-assurance.js
class Phase7bQualityTest {
    async runComprehensiveTest() {
        const testScenarios = [
            { user: '岡本', scenario: 'normal_day' },
            { user: '岡本', scenario: 'busy_day' },
            { user: '岡本', scenario: 'minimal_data' },
            { user: '岡本', scenario: 'error_recovery' }
        ];
        
        for (const scenario of testScenarios) {
            await this.testScenario(scenario);
        }
    }
}
```

#### **2. A/Bテスト実装**
```javascript
class Phase7bABTest {
    async compareWithPhase6() {
        const results = await Promise.all([
            this.runPhase6Test(),
            this.runPhase7bTest()
        ]);
        
        return this.analyzeComparison(results);
    }
}
```

---

## ⚠️ **リスク管理**

### **高リスク要因と対策**

#### **1. AI自律性過度依存リスク**
- **リスク**: AIが予期しない動作
- **対策**: 段階的自律化、重要処理の人間確認
- **実装**: サーキットブレーカーパターン

#### **2. 品質制御困難リスク**
- **リスク**: 細かい品質制御が困難
- **対策**: 品質チェックポイント設置、フォールバック機能
- **実装**: 品質しきい値による自動判断

#### **3. デバッグ困難リスク**
- **リスク**: AI処理のブラックボックス化
- **対策**: 詳細ログ、ステップバイステップ実行
- **実装**: 実行トレース機能

### **フォールバック戦略**

```javascript
class FallbackManager {
    async executeWithFallback(primaryMethod, context) {
        const strategies = [
            () => primaryMethod(context),
            () => this.simplifiedMethod(context),
            () => this.legacyMethod(context),
            () => this.emergencyMethod(context)
        ];
        
        for (const strategy of strategies) {
            try {
                const result = await strategy();
                if (this.validateResult(result)) {
                    return result;
                }
            } catch (error) {
                console.log(`戦略失敗: ${error.message}`);
                continue;
            }
        }
        
        throw new AllStrategiesFailedError();
    }
}
```

---

## 📅 **実装スケジュール**

### **Week 1: 設計・基盤実装**

| Day | タスク | 成果物 |
|-----|--------|---------|
| 1 | アーキテクチャ詳細設計 | 設計仕様書完成版 |
| 2 | UnifiedDiaryGenerator実装 | コア実装完了 |
| 3 | ContextGatherer実装 | コンテキスト収集完成 |

### **Week 2: 統合・テスト**

| Day | タスク | 成果物 |
|-----|--------|---------|
| 1 | 統合システム実装 | フル機能実装 |
| 2 | Phase 7a統合 | 完全統合システム |
| 3 | 品質テスト・チューニング | 品質評価レポート |
| 4 | Phase 7b完了・レビュー | 完了報告書 |

---

## 🎯 **期待される成果**

### **開発効率革命**
- プロンプト変更のみで機能拡張
- コード変更なしでの要求対応
- 自然言語による直接指示

### **品質向上**
- AI判断による最適化
- 動的な品質調整
- 文脈理解の向上

### **保守性飛躍**
- 複雑ロジック排除
- 自律的エラー回復
- シンプルなアーキテクチャ

この設計により、Phase 7bは「複雑なことは全てAIに任せる」という理想を実現し、次のPhase 7cへの完璧な基盤を提供します。

---

**策定者**: Claude Code  
**レビュー**: Pending  
**実装開始予定**: 設計承認後即座  
**完了予定**: 2週間後
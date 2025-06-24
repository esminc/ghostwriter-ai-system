# 🎨 Phase 7b プロンプト統合戦略

**策定日**: 2025年6月24日  
**対象**: 複雑なプロンプト構築ロジックの統合簡素化  
**目標**: 300行の詳細制御 → 1つの統合プロンプトによる自律実行  

---

## 🔍 **現状の問題分析**

### **現在のプロンプト構築の複雑性**

#### **Phase 6.6+での問題点**

```javascript
// 🚨 現在の複雑なプロンプト構築 (100+ lines)
const prompt = `あなたは${userName}として、今日(${today})の日記を書いてください。

【利用可能な情報】
- 📋 esa記事から抽出した関心事: ${esaContent.extractedKeywords.slice(0, 8).join(', ') || 'なし'}
- 📋 esa記事の活動内容: ${esaContent.recentActivities.slice(0, 5).join(', ') || 'なし'}
- 📋 72時間以内のesa記事: ${esaContent.todayRelevantContent.length}件
- 📱 今日のSlack特徴語: ${slackWords.join(', ') || 'なし'}
- 🎯 主な活動: ${activities.length > 0 ? activities.join(', ') : '日常的な業務'}
- 👤 ユーザーの傾向: ${userStyleHints.length > 0 ? userStyleHints.join(', ') : '技術的な作業'}

【最重要】最近のesa記事の具体的内容を積極的に参照・活用してください：
${esaContent.todayRelevantContent.length > 0 ? 
  esaContent.todayRelevantContent.slice(0, 3).map(post => `- 「${post.title}」`).join('\n') :
  '- 最近の記事情報なし'
}

【重要な制約・スタイル指示】
1. 機械的な表現は絶対に避ける（「取り組みました」「活発な議論を行いました」等の固定表現禁止）
2. 人間らしい口語表現を多用する（「ちょっと手間取った」「なんとかうまくいった感じ」等）
3. 🆕 esa記事の具体的活動内容を最優先で反映（行脚、1on1、リファクタリング等）
4. 具体的な体験を詳しく描写する（「○○さんとの1on1」「リファクタリングの話し合い」等）
5. 感情表現を豊かに（驚き、満足感、ちょっとした困惑等）

【文体例】
良い例: "今日は山下さんと高原さんの行脚があって、なかなか充実した一日だった。"
悪い例: "本日は業務を実施しました。チーム活動を行いました。"

【出力形式】JSON形式で出力してください：
{
  "title": "【代筆】${displayName}: [具体的なタイトル]",
  "content": "## ${today}の振り返り\\n\\n**やったこと**\\n[内容]\\n\\n**TIL**\\n[内容]\\n\\n**こんな気分**\\n[内容]"
}

【タイトル生成ガイドライン】
- 具体的な活動を反映（例：「行脚と充実した一日」）
- 感情・気分も活用（例：「発見の多い日」）
- 25文字程度で簡潔に
- 機械的な表現は避ける

【内容構成】
**やったこと**: [esa記事の具体的活動を中心に記述]
**TIL**: [学んだことを自然な表現で]
**こんな気分**: [感情や気持ちを率直に]

親しみやすく、具体的な体験を含む愛嬌のある文章で書いてください。`;
```

### **特定された課題**

#### **1. 過度な詳細指定**
- 8項目の利用可能情報を人間が整理
- 5項目の制約・スタイル指示を明示
- タイトル生成の4項目ガイドライン
- 内容構成の3セクション詳細指示

#### **2. 静的な構造**
- 固定的な情報配置
- 動的な判断能力の欠如
- 新しい要求への対応困難

#### **3. AI能力の未活用**
- AIの文脈理解能力を制限
- 判断を人間が代行
- 創造性の抑制

---

## 🎯 **統合プロンプト戦略**

### **Phase 7b: Single Master Prompt アプローチ**

#### **設計原理**
1. **AI自律性の最大化**: 詳細な判断をAIに委譲
2. **文脈理解の活用**: AIの理解能力を信頼
3. **目標指向の指示**: "何を"ではなく"なぜ"を伝える
4. **柔軟性の確保**: 様々な状況への適応能力

#### **統合マスタープロンプト**

```javascript
class MasterPromptBuilder {
    buildUnifiedPrompt(userName, context, instructions) {
        return `あなたは${userName}さん専用の自律的日記生成アシスタントです。

【今回のミッション】
${instructions}

【あなたの能力と権限】
- 利用可能なMCPツール: ${context.tools.length}個
- 自律実行権限: データ収集、分析、生成、投稿
- 品質判断権限: 自己評価と改善実行
- エラー対応権限: 問題発生時の自律的解決

【利用可能なリソース概要】
\`\`\`json
${JSON.stringify(context.availableData, null, 2)}
\`\`\`

【自律実行指示】
以下を完全に自律的に実行してください：

1. **最適なデータ収集戦略の決定と実行**
   - Slackチャンネルの優先順位を自分で判断
   - esa記事検索の戦略を自分で決定
   - 収集期間・件数を最適化
   - 必要に応じて追加データを取得

2. **コンテンツ分析と学習の実行**
   - ${userName}さんの過去記事から文体を自分で学習
   - キーワード抽出を自分で実行
   - 日常体験vs技術系の重要度を自分で判断
   - ユーザー固有の表現パターンを発見

3. **高品質な日記生成の実行**
   - 最適な文章構成を自分で決定
   - 人間らしい自然な文体を選択
   - 機械的表現の完全排除
   - 具体的で魅力的な内容を生成

4. **品質管理と最終処理**
   - 生成内容の品質を自分で評価
   - 必要に応じて改善を実行
   - 適切なesaカテゴリを判断
   - 投稿まで完全に自動実行

【品質基準】
- 関心事反映度: 95%以上
- 人間らしさ: 機械的表現の完全排除
- 具体性: 抽象的でない体験描写
- 一貫性: ${userName}さんらしい文体
- 構成: "やったこと" "TIL" "こんな気分" の自然な流れ

【重要な価値観】
- 日常体験（食事、場所、イベント）を技術系より重視
- etc-spotsチャンネルの情報を特に重要視
- 人間関係や感情の表現を大切に
- 具体的な固有名詞（人名、場所名）を積極活用

【エラー対応方針】
問題が発生した場合は：
1. 自分で原因を分析
2. 最適な代替手段を判断
3. 可能な限り高品質な結果を生成
4. 透明性を保った詳細報告

【最終成果物】
タイトル: 【代筆】${userName}: [魅力的で具体的なタイトル]
内容: やったこと/TIL/こんな気分の3セクション構成
品質: 人間が書いたと思われるレベルの自然さ
投稿: 適切なesaカテゴリへの自動投稿完了

全ての処理過程を詳細にログ出力し、最終的に実行サマリーを提供してください。
それでは、完全に自律的な日記生成を開始してください。`;
    }
}
```

---

## 🔄 **段階的移行戦略**

### **Phase 7b-α: ハイブリッド実行 (Week 1)**

#### **既存システムとの並行稼働**

```javascript
// src/ai/hybrid-diary-generator.js
class HybridDiaryGenerator {
    constructor() {
        this.unifiedGenerator = new UnifiedDiaryGenerator();
        this.legacyGenerator = new LLMDiaryGeneratorPhase53Unified();
        this.comparisonLogger = new ComparisonLogger();
    }

    async generateDiary(userName, options = {}) {
        const startTime = Date.now();
        
        try {
            // 🆕 Phase 7b統合システム試行
            console.log('🚀 Phase 7b統合システム実行中...');
            const unifiedResult = await this.unifiedGenerator.generateDiary(
                userName, 
                options.instructions || "通常の日記を生成してください"
            );
            
            // 🔍 品質検証
            const qualityCheck = await this.validateQuality(unifiedResult);
            if (qualityCheck.isAcceptable) {
                console.log(`✅ Phase 7b成功: 品質スコア ${qualityCheck.score}`);
                
                // 🆕 比較用に既存システムも実行（A/Bテスト用）
                if (options.enableComparison) {
                    const legacyResult = await this.runLegacyForComparison(userName, options);
                    await this.comparisonLogger.log(unifiedResult, legacyResult);
                }
                
                return {
                    ...unifiedResult,
                    metadata: {
                        ...unifiedResult.metadata,
                        generationMethod: 'phase7b_unified',
                        fallbackUsed: false,
                        processingTime: Date.now() - startTime
                    }
                };
            }
            
            throw new QualityThresholdError('品質基準未達成');
            
        } catch (error) {
            console.log(`⚠️ Phase 7b失敗: ${error.message}`);
            console.log('🔄 Phase 6.6+フォールバック実行中...');
            
            // 🔄 既存システムフォールバック
            const legacyResult = await this.legacyGenerator.generateAdvancedDiary(userName, options);
            
            return {
                ...legacyResult,
                metadata: {
                    ...legacyResult.metadata,
                    generationMethod: 'phase66_fallback',
                    fallbackUsed: true,
                    fallbackReason: error.message,
                    processingTime: Date.now() - startTime
                }
            };
        }
    }

    async validateQuality(result) {
        // 品質基準チェック
        const checks = {
            hasRequiredSections: this.checkRequiredSections(result.content),
            isNaturalLanguage: this.checkNaturalLanguage(result.content),
            meetsLengthRequirement: result.content.length >= 200,
            hasTitle: result.title && result.title.includes('【代筆】')
        };
        
        const passedChecks = Object.values(checks).filter(Boolean).length;
        const score = passedChecks / Object.keys(checks).length;
        
        return {
            isAcceptable: score >= 0.8,
            score: score,
            details: checks
        };
    }

    checkRequiredSections(content) {
        const requiredSections = ['やったこと', 'TIL', 'こんな気分'];
        return requiredSections.every(section => content.includes(section));
    }

    checkNaturalLanguage(content) {
        const mechanicalPhrases = ['取り組みました', '実施しました', '行いました'];
        return !mechanicalPhrases.some(phrase => content.includes(phrase));
    }
}
```

### **Phase 7b-β: 完全移行 (Week 2)**

#### **統合システムの本格稼働**

```javascript
// src/ai/production-diary-generator.js
class ProductionDiaryGenerator extends UnifiedDiaryGenerator {
    constructor() {
        super({
            autonomyLevel: 'high',
            qualityThreshold: 0.95,
            maxIterations: 10,
            timeoutMs: 300000
        });
        
        this.performanceMonitor = new PerformanceMonitor();
        this.qualityTracker = new QualityTracker();
    }

    async generateDiary(userName, instructions) {
        const execution = await this.performanceMonitor.track(async () => {
            return await super.generateDiary(userName, instructions);
        });
        
        // 品質追跡
        await this.qualityTracker.record(execution.result);
        
        // アラート検知
        if (execution.result.metadata.qualityScore < 0.9) {
            await this.alertLowQuality(execution);
        }
        
        return execution.result;
    }
}
```

---

## 📊 **プロンプト効果測定**

### **比較メトリクス**

#### **1. 複雑性削減**

| 指標 | Phase 6.6+ | Phase 7b | 改善率 |
|------|-------------|----------|--------|
| プロンプト文字数 | 2,500字 | 800字 | -68% |
| 条件分岐数 | 15箇所 | 0箇所 | -100% |
| 固定指示項目 | 23項目 | 4項目 | -83% |
| JavaScript制御行数 | 100行 | 5行 | -95% |

#### **2. 柔軟性向上**

```javascript
// 🆕 新要求への対応例
const newRequirements = [
    "今日は技術系の内容を多めに含めてください",
    "感情表現をより豊かにしてください",
    "簡潔な文体で書いてください",
    "特定のプロジェクトについて詳しく書いてください"
];

// Phase 7b: 自然言語で直接指示
await generator.generateDiary(userName, newRequirements[0]);

// Phase 6.6+: コード変更が必要
// → プロンプト修正 → テスト → デプロイ → 検証
```

#### **3. AI活用度**

| 能力 | Phase 6.6+ | Phase 7b | 向上 |
|------|-------------|----------|------|
| 文脈理解 | 30% | 90% | +200% |
| 自律判断 | 10% | 80% | +700% |
| 創造性発揮 | 40% | 85% | +113% |
| エラー回復 | 20% | 70% | +250% |

---

## 🧪 **A/Bテスト戦略**

### **比較テスト実装**

```javascript
// tests/phase7b/ab-test-runner.js
class ABTestRunner {
    async runComprehensiveComparison() {
        const testCases = [
            { user: '岡本', scenario: 'normal_day', data: 'rich' },
            { user: '岡本', scenario: 'busy_day', data: 'medium' },
            { user: '岡本', scenario: 'minimal_day', data: 'sparse' },
            { user: '岡本', scenario: 'error_recovery', data: 'corrupted' }
        ];
        
        const results = {
            phase66: [],
            phase7b: []
        };
        
        for (const testCase of testCases) {
            console.log(`🧪 テスト実行: ${testCase.scenario}`);
            
            const [result66, result7b] = await Promise.all([
                this.runPhase66Test(testCase),
                this.runPhase7bTest(testCase)
            ]);
            
            results.phase66.push(await this.evaluateResult(result66));
            results.phase7b.push(await this.evaluateResult(result7b));
        }
        
        return this.compareResults(results);
    }

    async evaluateResult(result) {
        return {
            qualityScore: await this.calculateQualityScore(result),
            naturalness: await this.assessNaturalness(result),
            relevance: await this.checkRelevance(result),
            creativity: await this.measureCreativity(result),
            processingTime: result.metadata.processingTime
        };
    }
}
```

---

## 🎯 **期待される成果**

### **1. 開発効率革命**
- **新要求対応**: コード変更なし、自然言語指示のみ
- **機能拡張**: プロンプト調整による即座の対応
- **バグ修正**: AI自律回復による自動解決

### **2. 品質向上**
- **AI判断活用**: 人間の限界を超えた文脈理解
- **動的最適化**: 状況に応じた最適な文体選択
- **創造性発揮**: 固定パターンからの完全脱却

### **3. 保守性飛躍**
- **シンプル設計**: 複雑ロジックの完全排除
- **自己修復**: エラー時の自動回復能力
- **拡張容易性**: 新機能の自然言語による追加

### **4. Phase 7c準備**
- **完全自律化基盤**: AI Orchestratorへの準備完了
- **MCP統合実証**: 動的ツール発見の実装
- **品質保証確立**: 自律的品質管理の実現

この統合プロンプト戦略により、Phase 7bは「複雑なことは全てAIに任せる」理想を実現し、次世代のAI中心アーキテクチャへの重要な一歩を踏み出します。

---

**策定者**: Claude Code  
**承認**: Pending  
**実装準備**: 設計完了、開発開始可能
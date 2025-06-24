# Phase 7a: 品質評価指標定義書

**作成日**: 2025年6月24日  
**バージョン**: 1.0  
**目的**: AI化キーワード抽出の品質を定量的・定性的に評価

## 1. 評価指標の概要

### 1.1 評価の目的
- Phase 6.6+と同等以上の品質確保
- AI化による新たな価値の測定
- 継続的改善のための基準確立

### 1.2 評価の原則
- **客観性**: 数値化可能な指標の使用
- **再現性**: 同一条件での評価可能性
- **実用性**: 実際の使用シーンに即した評価

## 2. 定量的評価指標

### 2.1 精度指標

#### 2.1.1 キーワード抽出精度
```
精度 = (正しく抽出されたキーワード数) / (抽出されたキーワード総数)
```

**目標値**: 98%以上  
**測定方法**: 
- 100件のテストメッセージセットを使用
- 人間の専門家による正解ラベルと比較
- 週次で自動測定

#### 2.1.2 カテゴリ分類精度
```
分類精度 = (正しく分類されたキーワード数) / (分類されたキーワード総数)
```

**目標値**: 95%以上  
**カテゴリ別目標**:
- 日常体験: 97%
- 技術: 95%
- ビジネス: 93%
- 感情: 90%

#### 2.1.3 再現率（Recall）
```
再現率 = (抽出されたキーワード数) / (抽出すべきキーワード総数)
```

**目標値**: 90%以上  
**重要性**: 重要なキーワードの見逃し防止

### 2.2 パフォーマンス指標

#### 2.2.1 レスポンスタイム
```
平均レスポンスタイム = Σ(各リクエストの処理時間) / リクエスト数
```

**目標値**: 
- 平均: 200ms以下
- 95パーセンタイル: 300ms以下
- 最大: 500ms以下

#### 2.2.2 スループット
```
スループット = 処理完了リクエスト数 / 時間
```

**目標値**: 100リクエスト/分以上

#### 2.2.3 リソース使用率
- **APIトークン消費**: 1リクエストあたり平均1,500トークン以下
- **メモリ使用**: ピーク時100MB以下
- **CPU使用率**: 平均20%以下

### 2.3 品質スコア

#### 2.3.1 総合品質スコア
```
総合スコア = (精度 × 0.4) + (再現率 × 0.3) + (速度スコア × 0.2) + (コスト効率 × 0.1)
```

**目標値**: 90点以上（100点満点）

#### 2.3.2 ユーザー関心事反映度
```
反映度 = (日記に含まれた抽出キーワード数) / (抽出キーワード総数)
```

**目標値**: 80%以上

## 3. 定性的評価指標

### 3.1 適応性評価

#### 3.1.1 新語・トレンド対応力
- **評価方法**: 新しい技術用語や流行語への対応速度
- **測定**: 月次で新語リストに対するテスト
- **目標**: 90%の新語を正しく識別

#### 3.1.2 コンテキスト理解度
- **評価方法**: 文脈に応じた適切な解釈
- **測定**: サンプル評価（月10件）
- **目標**: 4.5/5.0以上の評価

### 3.2 一貫性評価

#### 3.2.1 時間的一貫性
```
一貫性スコア = 1 - (同一入力での出力差異 / 出力総数)
```

**目標値**: 95%以上の一貫性

#### 3.2.2 ユーザー間一貫性
- **評価**: 異なるユーザーでの品質差
- **目標**: 標準偏差5%以内

### 3.3 説明可能性

#### 3.3.1 抽出理由の明確性
- **評価方法**: significance フィールドの質
- **測定**: 人間評価（5段階）
- **目標**: 平均4.0以上

## 4. 比較評価手法

### 4.1 A/Bテスト設計

```javascript
const abTestConfig = {
  testGroups: {
    control: 'Phase 6.6+ (既存システム)',
    treatment: 'Phase 7a (AIシステム)'
  },
  metrics: [
    'extraction_accuracy',
    'response_time',
    'user_satisfaction',
    'keyword_relevance'
  ],
  sampleSize: 1000,
  duration: '1週間'
};
```

### 4.2 並行実行比較

```javascript
class ParallelComparison {
  async compare(messages) {
    const [oldResult, newResult] = await Promise.all([
      this.oldExtractor.extract(messages),
      this.newExtractor.extract(messages)
    ]);
    
    return {
      similarity: this.calculateSimilarity(oldResult, newResult),
      improvements: this.identifyImprovements(oldResult, newResult),
      regressions: this.identifyRegressions(oldResult, newResult)
    };
  }
}
```

## 5. 評価実施計画

### 5.1 評価スケジュール

| フェーズ | 期間 | 評価内容 |
|---------|------|----------|
| 初期評価 | Day 3 | 基本精度、速度測定 |
| 統合評価 | Week 2 Day 1-2 | 全指標の総合評価 |
| 本番評価 | Week 2 Day 3-4 | 実環境でのパフォーマンス |

### 5.2 評価データセット

#### 5.2.1 テストデータ構成
```javascript
const testDataset = {
  categories: {
    daily_life: 100,  // 日常体験メッセージ
    technical: 100,   // 技術系メッセージ
    business: 100,    // ビジネス系メッセージ
    mixed: 100        // 混合メッセージ
  },
  total: 400,
  sources: ['実際のSlackログ（匿名化済み）', '手動作成テストケース']
};
```

#### 5.2.2 エッジケース
- 絵文字のみのメッセージ
- URLのみのメッセージ
- 極端に長い/短いメッセージ
- 多言語混在メッセージ

## 6. 評価ツール実装

### 6.1 自動評価スクリプト

```javascript
// tests/phase7a/quality-evaluator.js
class QualityEvaluator {
  constructor() {
    this.metrics = new MetricsCollector();
    this.groundTruth = new GroundTruthLoader();
  }

  async evaluateExtraction(testCase) {
    const startTime = Date.now();
    const result = await this.extractor.extract(testCase.messages);
    const endTime = Date.now();
    
    const evaluation = {
      accuracy: this.calculateAccuracy(result, testCase.expected),
      recall: this.calculateRecall(result, testCase.expected),
      responseTime: endTime - startTime,
      tokenUsage: result.metadata?.tokenUsage || 0
    };
    
    this.metrics.record(evaluation);
    return evaluation;
  }

  generateReport() {
    return {
      summary: this.metrics.getSummary(),
      details: this.metrics.getDetails(),
      recommendations: this.generateRecommendations()
    };
  }
}
```

### 6.2 視覚化ダッシュボード

```javascript
// monitoring/phase7a-dashboard.js
const dashboardConfig = {
  charts: [
    {
      type: 'line',
      metric: 'accuracy',
      timeRange: '7days'
    },
    {
      type: 'histogram',
      metric: 'responseTime',
      buckets: [0, 100, 200, 300, 500, 1000]
    },
    {
      type: 'heatmap',
      metric: 'categoryAccuracy',
      dimensions: ['category', 'timeOfDay']
    }
  ]
};
```

## 7. 品質基準と判定

### 7.1 Go/No-Go 判定基準

| 指標 | 必須基準 | 推奨基準 |
|------|----------|----------|
| 抽出精度 | 95%以上 | 98%以上 |
| レスポンスタイム | 500ms以下 | 300ms以下 |
| カテゴリ分類精度 | 90%以上 | 95%以上 |
| エラー率 | 1%以下 | 0.5%以下 |

### 7.2 段階的移行判定

```javascript
const migrationCriteria = {
  phase1: { // 10%トラフィック
    accuracy: 0.95,
    responseTime: 500,
    errorRate: 0.01
  },
  phase2: { // 50%トラフィック
    accuracy: 0.97,
    responseTime: 400,
    errorRate: 0.005
  },
  phase3: { // 100%トラフィック
    accuracy: 0.98,
    responseTime: 300,
    errorRate: 0.003
  }
};
```

## 8. 継続的改善

### 8.1 週次レビュー指標

1. **精度トレンド**: 週ごとの精度変化
2. **新規パターン発見**: AIが見つけた新しいキーワードパターン
3. **ユーザーフィードバック**: 品質に関する意見
4. **コスト効率**: APIコストの推移

### 8.2 改善アクション

```javascript
const improvementActions = {
  lowAccuracy: {
    threshold: 0.95,
    action: 'プロンプト調整、Few-shot例の追加'
  },
  highLatency: {
    threshold: 400,
    action: 'キャッシュ強化、バッチ処理最適化'
  },
  highCost: {
    threshold: 100, // ドル/月
    action: 'トークン削減、モデル選択見直し'
  }
};
```

## 9. レポートテンプレート

### 9.1 日次品質レポート

```markdown
# Phase 7a 品質レポート - [日付]

## サマリー
- 総合品質スコア: XX/100
- 処理リクエスト数: XXX件
- 平均レスポンスタイム: XXXms

## 詳細指標
### 精度
- キーワード抽出精度: XX%
- カテゴリ分類精度: XX%
- 再現率: XX%

### パフォーマンス
- P50レスポンスタイム: XXXms
- P95レスポンスタイム: XXXms
- エラー率: X.X%

## 改善点
- [具体的な改善提案]

## 次のアクション
- [実施予定の対策]
```

## 10. まとめ

この品質評価指標により：
- **客観的評価**: 数値化された明確な基準
- **継続的改善**: データに基づく最適化
- **品質保証**: Phase 6.6+と同等以上の品質維持
- **透明性**: ステークホルダーへの明確な報告

次のステップは、これらの指標を実装し、実際の評価を開始することです。
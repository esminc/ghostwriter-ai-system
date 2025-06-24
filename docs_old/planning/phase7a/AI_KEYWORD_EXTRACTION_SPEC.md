# Phase 7a: AI化キーワード抽出 詳細仕様書

**作成日**: 2025年6月24日  
**バージョン**: 1.0  
**ステータス**: 設計中

## 1. 現状分析サマリー

### 現在の実装 (Phase 6.6+)
- **ファイル**: `src/mcp-integration/slack-keyword-extractor.js`
- **行数**: 857行
- **主な複雑性**:
  - 4つの辞書（技術、ビジネス、イベント、感情）の手動管理
  - 動的特徴語抽出の複雑なパターンマッチング
  - 日常体験キーワード判定の個別メソッド群
  - カテゴリ分類の条件分岐ロジック

### 問題点
1. **保守性**: 新しいキーワードパターン追加時にコード変更が必要
2. **拡張性**: カテゴリ追加が困難（ハードコーディング）
3. **複雑性**: 多層的な条件分岐による可読性低下
4. **重複**: 類似ロジックの重複実装

## 2. AI化設計概要

### 基本方針
- JavaScript側の複雑なロジックをAIプロンプトに移行
- 辞書管理からAIの言語理解能力への転換
- 動的適応性の向上（新しいパターンの自動学習）

### アーキテクチャ変更

```
[現在のフロー]
Slackメッセージ → JSロジック（857行） → キーワード抽出結果

[Phase 7aのフロー]
Slackメッセージ → AIプロンプト（構造化出力） → キーワード抽出結果
```

## 3. AIKeywordExtractor 詳細設計

### クラス構造

```javascript
// src/ai/keyword-extractor-ai.js
class AIKeywordExtractor {
    constructor(aiClient) {
        this.aiClient = aiClient;
        this.cache = new Map(); // 短期キャッシュ
    }

    async extractKeywords(messages, options = {}) {
        const cacheKey = this.generateCacheKey(messages);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const prompt = this.buildExtractionPrompt(messages, options);
        const result = await this.aiClient.generateStructured(prompt, {
            temperature: options.temperature || 0.3,
            maxTokens: options.maxTokens || 1500,
            responseFormat: this.getResponseSchema()
        });

        this.cache.set(cacheKey, result);
        return result;
    }

    buildExtractionPrompt(messages, options) {
        const messageTexts = messages.map(m => 
            `[${m.channel_name}] ${m.text}`
        ).join('\n');

        return `あなたはSlackメッセージ分析の専門家です。
以下のメッセージから特徴的なキーワードを抽出し、分類してください。

【分析対象メッセージ】
${messageTexts}

【抽出要件】
1. カテゴリ分類
   - 日常体験: 場所、食事、イベント、旅行など（最優先）
   - 技術: プログラミング、AI、システム開発など
   - ビジネス: 会議、プロジェクト、計画など
   - 感情・状態: 気持ち、反応、進捗状況など

2. 特徴語抽出
   - ユーザー固有の表現や専門用語
   - 繰り返し使われる重要な概念
   - 時事的・トレンド的な話題

3. 優先順位
   - etc-spotsチャンネルの情報を特に重視
   - 具体的な固有名詞（場所名、製品名等）を優先
   - 抽象的・一般的な語彙は除外

【特別な考慮事項】
${options.specialConsiderations || '特になし'}

【出力形式】
必ず以下のJSON形式で出力してください：
{
  "categories": {
    "daily_life": {
      "keywords": ["キーワード1", "キーワード2"],
      "importance": "high/medium/low",
      "context": "簡潔な説明"
    },
    "technical": { ... },
    "business": { ... },
    "emotion": { ... }
  },
  "characteristic_words": [
    {
      "word": "特徴語",
      "frequency": 回数,
      "category": "カテゴリ",
      "significance": "なぜ重要か"
    }
  ],
  "top_keywords": ["最重要1", "最重要2", "最重要3"],
  "temporal_trends": {
    "emerging": ["新しく現れた話題"],
    "recurring": ["繰り返される話題"]
  },
  "activity_inference": ["推測される活動1", "推測される活動2"]
}`;
    }

    getResponseSchema() {
        return {
            type: "object",
            properties: {
                categories: {
                    type: "object",
                    properties: {
                        daily_life: { type: "object" },
                        technical: { type: "object" },
                        business: { type: "object" },
                        emotion: { type: "object" }
                    }
                },
                characteristic_words: { type: "array" },
                top_keywords: { type: "array" },
                temporal_trends: { type: "object" },
                activity_inference: { type: "array" }
            },
            required: ["categories", "characteristic_words", "top_keywords"]
        };
    }
}
```

## 4. 移行戦略

### 段階的移行アプローチ

#### Phase 1: 並行実行（Week 1）
- 既存システムと新AIシステムを並行実行
- 結果を比較・検証
- 品質メトリクスの収集

#### Phase 2: A/Bテスト（Week 2前半）
- 50%のリクエストでAIシステムを使用
- パフォーマンスと精度の本番環境検証
- フィードバックループの確立

#### Phase 3: 完全移行（Week 2後半）
- AIシステムへの完全切り替え
- 既存コードの段階的削除
- ドキュメント更新

## 5. 品質評価指標

### 定量的指標

| 指標 | 現在値 | 目標値 | 測定方法 |
|------|--------|--------|----------|
| キーワード抽出精度 | - | 98%+ | 人間評価との一致率 |
| 処理時間 | ~100ms | <300ms | 平均レスポンスタイム |
| カテゴリ分類精度 | - | 95%+ | 正解ラベルとの比較 |
| 特徴語発見率 | - | 90%+ | 新規パターン検出率 |

### 定性的指標

1. **適応性**: 新しいトレンドや用語への対応速度
2. **一貫性**: 同じ入力に対する出力の安定性
3. **説明可能性**: 抽出理由の明確性

## 6. プロンプトエンジニアリング戦略

### 基本原則

1. **明確な指示**: 曖昧さを排除した具体的な指示
2. **例示**: Few-shot learningによる品質向上
3. **制約**: 出力形式の厳密な定義
4. **コンテキスト**: チャンネル特性の考慮

### プロンプト最適化手法

```javascript
// プロンプトテンプレート管理
class PromptTemplates {
    static getExtractionPrompt(context) {
        const basePrompt = this.BASE_EXTRACTION_PROMPT;
        const contextualPrompt = this.getContextualAdditions(context);
        const examples = this.getRelevantExamples(context);
        
        return `${basePrompt}\n\n${contextualPrompt}\n\n${examples}`;
    }

    static getContextualAdditions(context) {
        if (context.includesEtcSpots) {
            return "特に日常体験や場所に関する情報を重視してください。";
        }
        if (context.isTechnicalChannel) {
            return "技術的な議論や実装詳細に注目してください。";
        }
        return "";
    }
}
```

## 7. エラーハンドリングとフォールバック

### エラーケース対応

1. **AI応答エラー**
   - リトライ機構（最大3回）
   - 簡易版プロンプトへのフォールバック
   - 最終的には基本的なキーワード抽出

2. **形式エラー**
   - JSON検証とエラー修正
   - 部分的な結果の利用

3. **タイムアウト**
   - 段階的なタイムアウト設定
   - キャッシュの積極活用

## 8. パフォーマンス最適化

### キャッシュ戦略

```javascript
class KeywordCache {
    constructor() {
        this.cache = new LRUCache({
            max: 100,
            ttl: 1000 * 60 * 15 // 15分
        });
    }

    generateKey(messages) {
        const content = messages.map(m => m.text).join('|');
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}
```

### バッチ処理

- 複数ユーザーの同時リクエストをバッチ化
- プロンプトの効率的な構築

## 9. 実装スケジュール

### Week 1: 設計とPOC

**Day 1**: 
- [x] 詳細仕様書の作成
- [ ] AIクライアントインターフェースの設計

**Day 2-3**: 
- [ ] POC実装
- [ ] 単体テストの作成
- [ ] 初期性能評価

### Week 2: 本実装と統合

**Day 1-2**:
- [ ] プロダクション実装
- [ ] エラーハンドリング実装
- [ ] パフォーマンス最適化

**Day 3-4**:
- [ ] 既存システムとの統合
- [ ] A/Bテスト実施
- [ ] 最終調整と文書化

## 10. リスクと対策

### 技術的リスク

| リスク | 影響度 | 対策 |
|--------|--------|------|
| AI精度不足 | 高 | プロンプト改善、Few-shot examples追加 |
| レスポンス遅延 | 中 | キャッシュ強化、並列処理 |
| コスト増加 | 中 | トークン数最適化、キャッシュ活用 |

### 移行リスク

- **データ不整合**: 並行実行期間での検証強化
- **ユーザー影響**: 段階的移行とロールバック準備

## 11. 次のステップ

1. この仕様書のレビューと承認
2. AIクライアントの実装開始
3. テスト環境の準備
4. POC実装の開始

---

**承認者**: _______________  
**承認日**: _______________
# Phase 7a: プロンプトエンジニアリング戦略

**作成日**: 2025年6月24日  
**バージョン**: 1.0  
**対象**: AIKeywordExtractor

## 1. プロンプト設計の基本原則

### 1.1 明確性の原則
- **具体的な指示**: 曖昧な表現を避け、明確な動作を指定
- **構造化**: セクション分けによる理解しやすさ
- **一貫性**: 用語と形式の統一

### 1.2 コンテキスト提供の原則
- **背景情報**: Slackメッセージの特性説明
- **目的明確化**: キーワード抽出の用途（日記生成）
- **優先順位**: 重要度の明示的な指定

### 1.3 出力制御の原則
- **形式指定**: JSON構造の厳密な定義
- **制約設定**: 文字数、個数の制限
- **品質基準**: 期待される出力品質の明示

## 2. プロンプトテンプレート設計

### 2.1 基本テンプレート構造

```
[役割定義]
あなたは〜の専門家です。

[タスク説明]
以下のタスクを実行してください：

[入力データ]
分析対象：

[処理要件]
1. 要件1
2. 要件2

[出力形式]
以下の形式で出力：

[例示（オプション）]
良い例：
悪い例：
```

### 2.2 キーワード抽出用マスタープロンプト

```javascript
const MASTER_EXTRACTION_PROMPT = `
あなたはSlackメッセージ分析とキーワード抽出の専門家です。
ユーザーの日常活動や関心事を正確に把握し、日記生成に役立つキーワードを抽出します。

## あなたの役割
- Slackメッセージから重要なキーワードと活動を識別
- ユーザー固有の表現や関心事を発見
- 時系列的なトレンドを把握
- 日記生成に最適な情報を構造化

## 分析対象メッセージ
{messages}

## キーワード抽出要件

### 1. カテゴリ分類
以下の4カテゴリに分類してください：

**日常体験（最優先）**
- 場所、地名、施設名
- 食事、グルメ、料理
- イベント、活動、体験
- 旅行、外出、移動

**技術関連**
- プログラミング言語、フレームワーク
- ツール、システム、サービス
- 技術的概念、手法
- 開発、実装、設計

**ビジネス・仕事**
- 会議、打ち合わせ、相談
- プロジェクト、タスク、計画
- チーム、協力、連携
- 成果、進捗、目標

**感情・状態**
- 気持ち、感想、印象
- 状況、状態、進行度
- 評価、反応、フィードバック

### 2. 特徴語抽出ルール
- 2回以上出現する特徴的な単語を優先
- 固有名詞（製品名、サービス名、地名）を重視
- ユーザー独自の表現や専門用語を識別
- 一般的すぎる語彙（する、ある、もの等）は除外

### 3. チャンネル別重み付け
- etc-spots: 日常体験情報を2倍重視
- its-tech: 技術情報を1.5倍重視
- its-training: 学習・成長情報を重視

### 4. 時系列考慮
- 直近6時間以内: 1.5倍の重み
- 本日中: 1.2倍の重み
- それ以前: 通常の重み

## 出力形式（厳密にJSON形式で）

\`\`\`json
{
  "categories": {
    "daily_life": {
      "keywords": ["最大10個のキーワード"],
      "importance": "high/medium/low",
      "context": "このカテゴリの要約（50文字以内）"
    },
    "technical": {
      "keywords": ["最大10個のキーワード"],
      "importance": "high/medium/low",
      "context": "このカテゴリの要約（50文字以内）"
    },
    "business": {
      "keywords": ["最大10個のキーワード"],
      "importance": "high/medium/low",
      "context": "このカテゴリの要約（50文字以内）"
    },
    "emotion": {
      "keywords": ["最大10個のキーワード"],
      "importance": "high/medium/low",
      "context": "このカテゴリの要約（50文字以内）"
    }
  },
  "characteristic_words": [
    {
      "word": "特徴的な単語",
      "frequency": 出現回数,
      "category": "属するカテゴリ",
      "significance": "なぜ重要か（30文字以内）"
    }
  ],
  "top_keywords": ["最重要キーワード5個（順序付き）"],
  "temporal_trends": {
    "emerging": ["新しく現れた話題3個まで"],
    "recurring": ["繰り返される話題3個まで"]
  },
  "activity_inference": [
    "推測される具体的活動1（50文字以内）",
    "推測される具体的活動2（50文字以内）",
    "推測される具体的活動3（50文字以内）"
  ]
}
\`\`\`

## 重要な注意事項
- 必ず有効なJSON形式で出力
- 各配列の要素数制限を厳守
- 日本語の自然な表現を使用
- 推測は根拠のあるものに限定
`;
```

## 3. Few-shot Learning用の例示

### 3.1 良い抽出例

```javascript
const GOOD_EXAMPLE = {
  input: `
[etc-spots] 今日は武蔵野のカフェでアフタヌーンティーしてきました！
[its-tech] Next.jsのSSR実装で苦戦中...
[etc-spots] 三鷺のたい焼き屋さん、めっちゃ美味しかった
[its-training] AIプロンプトエンジニアリングの研修参加
  `,
  output: {
    categories: {
      daily_life: {
        keywords: ["武蔵野", "カフェ", "アフタヌーンティー", "三鷺", "たい焼き"],
        importance: "high",
        context: "カフェ巡りとグルメ体験"
      },
      technical: {
        keywords: ["Next.js", "SSR", "実装"],
        importance: "medium",
        context: "フロントエンド開発作業"
      }
    },
    characteristic_words: [
      {
        word: "アフタヌーンティー",
        frequency: 1,
        category: "daily_life",
        significance: "具体的な日常体験"
      }
    ],
    top_keywords: ["アフタヌーンティー", "たい焼き", "Next.js", "武蔵野", "三鷺"]
  }
};
```

### 3.2 改善が必要な例

```javascript
const BAD_EXAMPLE = {
  input: "今日は作業して、会議もあって、いろいろやりました",
  issues: [
    "具体性の欠如",
    "一般的すぎる表現",
    "特徴的キーワードの不在"
  ],
  improvement: "具体的な作業内容、会議の種類、「いろいろ」の詳細を抽出"
};
```

## 4. コンテキスト適応型プロンプト

### 4.1 チャンネル特性による調整

```javascript
class ContextualPromptBuilder {
  static adjustForChannel(basePrompt, channelName) {
    const adjustments = {
      'etc-spots': `
特に以下の点に注目してください：
- 具体的な場所名、店名、施設名
- 食べ物、飲み物の詳細
- 体験の具体的内容
      `,
      'its-tech': `
技術的な詳細を重視：
- 使用技術、ツール、フレームワーク
- 実装方法、アーキテクチャ
- 技術的課題と解決策
      `,
      'its-training': `
学習と成長に焦点：
- 学習内容、スキル
- 研修、セミナー名
- 獲得した知識
      `
    };
    
    return basePrompt + (adjustments[channelName] || '');
  }
}
```

### 4.2 時間帯による調整

```javascript
const timeBasedAdjustment = (hour) => {
  if (hour >= 11 && hour <= 14) {
    return "ランチタイムの活動（食事、休憩）に特に注目";
  } else if (hour >= 18 && hour <= 21) {
    return "夕方〜夜の活動（夕食、アフター5）を重視";
  } else if (hour >= 9 && hour <= 11) {
    return "午前中の仕事・作業に焦点";
  }
  return "";
};
```

## 5. プロンプト最適化手法

### 5.1 Chain of Thought (CoT)

```javascript
const COT_EXTRACTION_PROMPT = `
キーワード抽出を以下のステップで行ってください：

1. まず、全メッセージを読んで全体的なテーマを把握
2. 各メッセージから重要そうな単語をリストアップ
3. 単語を4つのカテゴリに分類
4. 頻度と重要度を考慮して優先順位付け
5. 最終的なJSON形式に整理

思考過程：
{ここに思考過程を記述}

最終出力：
{JSON形式の出力}
`;
```

### 5.2 Self-Consistency

複数の異なるプロンプトで実行し、最も一貫性のある結果を採用：

```javascript
const prompts = [
  MASTER_EXTRACTION_PROMPT,
  SIMPLIFIED_EXTRACTION_PROMPT,
  DETAILED_EXTRACTION_PROMPT
];

const results = await Promise.all(
  prompts.map(p => aiClient.generate(p))
);

return selectMostConsistent(results);
```

## 6. エラー回復プロンプト

### 6.1 JSON修正プロンプト

```javascript
const JSON_FIX_PROMPT = `
以下の出力にJSON形式のエラーがあります。
修正して有効なJSONを返してください：

エラー内容: {error}
元の出力: {output}

修正後のJSON:
`;
```

### 6.2 簡易版フォールバック

```javascript
const SIMPLE_EXTRACTION_PROMPT = `
以下のメッセージから重要なキーワードを10個抽出してください。
カンマ区切りで出力：

メッセージ: {messages}

キーワード:
`;
```

## 7. パフォーマンスチューニング

### 7.1 トークン最適化

```javascript
class TokenOptimizer {
  static compressMessages(messages) {
    return messages
      .map(m => `[${m.channel_name.substring(0, 3)}] ${m.text}`)
      .filter(text => text.length > 10) // 短すぎるメッセージ除外
      .slice(0, 50); // 最大50メッセージ
  }
  
  static estimateTokens(text) {
    // 簡易的なトークン数推定（日本語1文字≒2トークン）
    return text.length * 1.5;
  }
}
```

### 7.2 レスポンス制限

```javascript
const responseConstraints = {
  maxKeywordsPerCategory: 10,
  maxCharacteristicWords: 15,
  maxActivityInferences: 5,
  maxContextLength: 50
};
```

## 8. 品質保証プロンプト

### 8.1 自己検証プロンプト

```javascript
const SELF_VALIDATION_PROMPT = `
以下の抽出結果を検証してください：

抽出結果: {result}

検証項目：
1. すべてのキーワードが元メッセージに存在するか
2. カテゴリ分類は適切か
3. 重要度の判定は妥当か
4. JSON形式は正しいか

問題がある場合は修正版を、問題ない場合は"OK"を返してください。
`;
```

## 9. 実装例

### 9.1 完全なプロンプト生成関数

```javascript
function generateExtractionPrompt(messages, options = {}) {
  let prompt = MASTER_EXTRACTION_PROMPT;
  
  // メッセージの整形
  const formattedMessages = messages
    .map(m => `[${m.channel_name}] ${m.text}`)
    .join('\n');
  
  prompt = prompt.replace('{messages}', formattedMessages);
  
  // コンテキスト調整
  if (options.primaryChannel) {
    prompt = ContextualPromptBuilder.adjustForChannel(prompt, options.primaryChannel);
  }
  
  // 時間帯調整
  if (options.currentHour) {
    prompt += '\n\n' + timeBasedAdjustment(options.currentHour);
  }
  
  // Few-shot例の追加
  if (options.includeFewShot) {
    prompt += '\n\n## 良い例:\n' + JSON.stringify(GOOD_EXAMPLE, null, 2);
  }
  
  return prompt;
}
```

## 10. 継続的改善

### 10.1 プロンプトバージョン管理

```javascript
const PROMPT_VERSIONS = {
  'v1.0': MASTER_EXTRACTION_PROMPT,
  'v1.1': MASTER_EXTRACTION_PROMPT_WITH_IMPROVEMENTS,
  'current': 'v1.1'
};
```

### 10.2 A/Bテスト設定

```javascript
const promptABTest = {
  variants: {
    'control': PROMPT_VERSIONS['v1.0'],
    'treatment': PROMPT_VERSIONS['v1.1']
  },
  metrics: ['extraction_accuracy', 'response_time', 'user_satisfaction'],
  sampleSize: 100
};
```

## 11. まとめ

このプロンプトエンジニアリング戦略により：
- **精度向上**: 構造化された指示による正確な抽出
- **一貫性**: 標準化されたプロンプトテンプレート
- **適応性**: コンテキストに応じた動的調整
- **保守性**: バージョン管理と継続的改善

次のステップは、これらのプロンプトを実際に実装し、テストすることです。
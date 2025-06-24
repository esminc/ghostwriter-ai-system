# 📝 Phase 6.5: 日記生成文体改善戦略レポート
**作成日時**: 2025/06/09 09:45
**前回継続**: Phase 6完了後の品質改善フェーズ
**現在のフォーカス**: テンプレート生成→AI自由生成への転換

## 🎯 現在の状況

### **Phase 6完了状況確認**
- ✅ SlackKeywordExtractor完全実装済み（4カテゴリ辞書）
- ✅ 関心事反映分析95%達成
- ✅ 技術的機能は完全動作
- ⚠️ **新たな品質課題発見**: 文体の機械的均質化

### **最新生成日記の分析結果**

#### **技術的改善（成功）**:
```
🎯 関心事反映分析:
* 検出された関心事: ミーティング・会議, ハッカソン・イベント, AI・機械学習, ドキュメント作成, システム開発
* 反映された関心事: ミーティング・会議, ハッカソン・イベント, AI・機械学習, ドキュメント作成
* 関心事反映度: 95% (優秀)
```

#### **文体品質の問題（課題）**:
**Before (5/29版 - 魅力的)**:
```
「やることやったことをしっかり進めた感じ」
「Figmaを使いこなせたら...楽になるんだろうなぁ」
「なんだか充実感があって、いい気分」
```

**After (6/8版 - 機械的)**:
```
「一斉会議の案内を中心に取り組みました」
「活発な議論を行いました」
「前向き・積極的な気持ちで一日を過ごすことができました」
```

→ **根本問題**: 技術精度向上により人間らしさが失われた

## 🔍 現在の実装問題分析

### **問題箇所**: `/src/mcp-integration/llm-diary-generator-phase53-unified.js`

#### **現在の文章生成方式（疑似テンプレート）**:
```javascript
// 問題のある固定パターン生成
generatePersonalizedDiaryContent(userName, contextData, today) {
    let content = `## ${today}の振り返り\n\n`;
    content += `**やったこと**\n`;
    content += `今日は${activities[0]}を中心に取り組みました。`; // 固定表現
    if (activities.length > 1) {
        content += `また、${activities[1]}にも注力し、`;    // 固定パターン
    }
    content += `Slackでは${slackData.todayMessages.length}件のメッセージで...`; // 数値埋め込み
}
```

#### **期待される改善方式（AI自由生成）**:
```javascript
// 提案する新しいアプローチ
buildCreativePrompt(userName, contextData, today) {
    const recentWords = this.extractRecentCharacteristicWords(contextData.slackData);
    const activities = contextData.slackData?.activityAnalysis?.keyActivities || [];
    
    return `
あなたは${userName}として、今日(${today})の日記を書いてください。

利用可能な情報:
- 今日話題になった特徴的な単語: ${recentWords.slice(0, 8).join(', ')}
- 主な活動: ${activities.join(', ')}
- 制約: 人間らしい口語表現使用、特徴語自然組み込み、親しみやすい文体

例文体: "今日はngrokの設定でちょっと手間取ったけど、なんとかClaudeとの連携がうまくいった感じ。"
`;
}

async generateAIDiary(userName, contextData, options) {
    const creativePrompt = this.buildCreativePrompt(userName, contextData);
    const aiGeneratedContent = await this.openaiClient.generateText({
        prompt: creativePrompt,
        temperature: 0.8,  // 創造性向上
        max_tokens: 1500
    });
    return aiGeneratedContent + this.generateCleanQualityFooter();
}
```

## 🎨 特徴語抽出強化の必要性

### **現在の課題**: 事前定義辞書の限界
```javascript
// 現在の固定辞書（SlackKeywordExtractor）
this.techKeywords = {
    programming: {
        patterns: ['javascript', 'js', 'react', 'node', 'python'...], // 固定リスト
        category: 'プログラミング',
        weight: 1.0
    }
}
```

### **提案する解決策**: 動的特徴語抽出
```javascript
// 新規実装が必要
extractRecentCharacteristicWords(messages) {
    const recentWords = new Set();
    messages.forEach(msg => {
        const words = this.simpleTokenize(msg.text || '');
        words.forEach(word => {
            if (this.looksCharacteristic(word)) { // 動的判定
                recentWords.add(word);
            }
        });
    });
    return Array.from(recentWords);
}

looksCharacteristic(word) {
    // シンプルな特徴語判定
    const characteristics = [
        /[A-Z]/.test(word),                    // 大文字含む: "API", "ngrok"
        /[a-z][A-Z]/.test(word),              // キャメルケース: "JavaScript"
        word.includes('.'),                    // ドット含む: "next.js"
        word.includes('-'),                    // ハイフン含む: "real-time"
        /^[A-Z]{2,}$/.test(word),             // 全大文字: "API", "MCP"
        word.length >= 6 && /^[a-zA-Z]+$/.test(word) // 長い英単語
    ];
    return characteristics.some(check => check);
}
```

## 🚀 Phase 6.5 実装計画

### **優先度1: 文体生成の改善**
1. **buildCreativePrompt()メソッド新規作成**
2. **generatePersonalizedDiaryContent()の簡素化**
3. **OpenAI呼び出し温度設定調整（0.8）**
4. **文体バリエーション指示の追加**

### **優先度2: 特徴語抽出強化**
1. **extractRecentCharacteristicWords()メソッド追加**
2. **SlackKeywordExtractorへの動的抽出機能統合**
3. **特徴語のプロンプト組み込み最適化**

### **優先度3: 統合テスト**
1. **ローカル環境での動作確認**
2. **生成品質の比較検証**
3. **人間らしさ指標の評価**

## 📂 関連ファイル構造

```
プロジェクトルート: /Users/takuya/Documents/AI-Work/GhostWriter/

重要ファイル:
├── src/mcp-integration/
│   ├── llm-diary-generator-phase53-unified.js    # メイン修正対象
│   ├── slack-keyword-extractor.js                # 特徴語抽出強化対象
│   └── slack-mcp-wrapper-direct.js              # 統合部分
├── docs/handovers/2025-06/
│   ├── SLACK_KEYWORD_EXTRACTION_PHASE6_COMPLETED.md  # Phase 6完了レポート
│   └── DIARY_GENERATION_IMPROVEMENT_PHASE65_STRATEGY.md  # 本レポート
└── package.json                                  # 依存関係
```

## 🎯 期待される改善効果

### **文体品質の向上**:
- 固定パターン → AIの創造的生成
- 「取り組みました」→「ちょっと手間取ったけど」
- ビジネス文書調 → 親しみやすい口語

### **特徴語活用の向上**:
- 辞書限定 → 動的発見
- 抽象的カテゴリ → 具体的技術語
- 「AI・機械学習」→「ngrok」「MCP」「Claude」

### **驚き要素の最大化**:
- 「こんな細かい単語まで覚えてる！」
- 自然な文脈での技術語使用
- 人間らしい感情表現との組み合わせ

## 🔄 次のアクション

### **Phase 6.5 実装ステップ**:
1. **SlackKeywordExtractorに動的抽出機能追加**
2. **LLMDiaryGeneratorにCreativePrompt機能追加**
3. **既存の固定パターン生成部分を削除**
4. **OpenAI呼び出しパラメータ調整**
5. **統合テスト実行**

### **実装の原則**:
- 技術的精度は維持（Phase 6成果保持）
- 人間らしさを最優先
- ジョーク要素としての「愛嬌ある不完全さ」復活
- 特徴語の驚き効果最大化

---

## 📞 継続用情報

**現在の状況**: Phase 6技術実装完了、Phase 6.5文体改善準備完了
**次回作業**: 動的特徴語抽出 + AI自由生成への転換実装
**技術レベル**: 高度キーワード抽出システム確立済み、文体生成改善待ち
**開発環境**: ローカル環境稼働中、Ngrok統合済み、即座テスト可能 🎯

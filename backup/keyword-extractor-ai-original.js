// Phase 7a: AI化キーワード抽出エンジン
// OpenAI GPT-4o-miniを使用した自然言語理解ベースのキーワード抽出

const OpenAI = require('openai');

class AIKeywordExtractor {
    constructor(openaiApiKey) {
        this.openai = new OpenAI({
            apiKey: openaiApiKey
        });
        
        // 短期キャッシュ（15分）
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15分
        
        // プロンプトテンプレート
        this.MASTER_PROMPT = this.getMasterPrompt();
    }
    
    /**
     * メッセージからキーワードを抽出
     * @param {Array} messages - Slackメッセージの配列
     * @param {Object} options - オプション設定
     * @returns {Object} 抽出されたキーワード情報
     */
    async extractKeywords(messages, options = {}) {
        try {
            // キャッシュチェック
            const cacheKey = this.generateCacheKey(messages);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('🎯 キャッシュヒット: AI抽出結果を再利用');
                return cached;
            }
            
            // プロンプト構築
            const prompt = this.buildExtractionPrompt(messages, options);
            
            // AI実行
            console.log(`🤖 AI キーワード抽出開始: ${messages.length}件のメッセージ`);
            const startTime = Date.now();
            
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'system',
                    content: 'あなたはSlackメッセージ分析の専門家です。正確なJSON形式で応答してください。'
                }, {
                    role: 'user',
                    content: prompt
                }],
                temperature: options.temperature || 0.3,
                max_tokens: options.maxTokens || 1500,
                response_format: { type: "json_object" }
            });
            
            const responseTime = Date.now() - startTime;
            console.log(`✅ AI抽出完了: ${responseTime}ms`);
            
            // レスポンス解析
            const result = this.parseAIResponse(completion.choices[0].message.content);
            
            // メタデータ追加
            result.metadata = {
                responseTime,
                tokenUsage: completion.usage.total_tokens,
                model: 'gpt-4o-mini',
                timestamp: new Date().toISOString()
            };
            
            // キャッシュ保存
            this.saveToCache(cacheKey, result);
            
            return result;
            
        } catch (error) {
            console.error('❌ AI キーワード抽出エラー:', error);
            // フォールバック処理
            return this.fallbackExtraction(messages);
        }
    }
    
    /**
     * マスタープロンプトテンプレート
     */
    getMasterPrompt() {
        return `あなたはSlackメッセージ分析とキーワード抽出の専門家です。
ユーザーの日常活動や関心事を正確に把握し、日記生成に役立つキーワードを抽出します。

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
\`\`\``;
    }
    
    /**
     * プロンプト構築
     */
    buildExtractionPrompt(messages, options) {
        // メッセージの整形
        const formattedMessages = messages
            .slice(0, 50) // 最大50メッセージ
            .map(m => `[${m.channel_name}] ${m.text}`)
            .join('\n');
        
        let prompt = this.MASTER_PROMPT.replace('{messages}', formattedMessages);
        
        // コンテキスト調整
        if (options.specialConsiderations) {
            prompt += `\n\n【特別な考慮事項】\n${options.specialConsiderations}`;
        }
        
        return prompt;
    }
    
    /**
     * AIレスポンスの解析
     */
    parseAIResponse(responseText) {
        try {
            const parsed = JSON.parse(responseText);
            
            // 構造検証
            this.validateResponse(parsed);
            
            return parsed;
        } catch (error) {
            console.error('❌ JSON解析エラー:', error);
            throw new Error('AI応答の解析に失敗しました');
        }
    }
    
    /**
     * レスポンス構造の検証
     */
    validateResponse(response) {
        const required = ['categories', 'characteristic_words', 'top_keywords'];
        for (const field of required) {
            if (!response[field]) {
                throw new Error(`必須フィールド "${field}" が見つかりません`);
            }
        }
        
        // カテゴリ検証
        const categories = ['daily_life', 'technical', 'business', 'emotion'];
        for (const cat of categories) {
            if (!response.categories[cat]) {
                throw new Error(`カテゴリ "${cat}" が見つかりません`);
            }
        }
    }
    
    /**
     * フォールバック処理（エラー時の簡易抽出）
     */
    async fallbackExtraction(messages) {
        console.log('⚠️  フォールバック処理を実行');
        
        // 単純な頻度ベースの抽出
        const wordFreq = new Map();
        const categories = {
            daily_life: { keywords: [], importance: 'medium', context: 'フォールバック抽出' },
            technical: { keywords: [], importance: 'medium', context: 'フォールバック抽出' },
            business: { keywords: [], importance: 'medium', context: 'フォールバック抽出' },
            emotion: { keywords: [], importance: 'medium', context: 'フォールバック抽出' }
        };
        
        // 基本的なキーワード抽出
        messages.forEach(msg => {
            const words = (msg.text || '').split(/[\s、。！？,.!?]+/)
                .filter(w => w.length >= 2);
            
            words.forEach(word => {
                const count = wordFreq.get(word) || 0;
                wordFreq.set(word, count + 1);
            });
        });
        
        // 上位キーワード
        const topWords = Array.from(wordFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
        
        return {
            categories,
            characteristic_words: [],
            top_keywords: topWords,
            temporal_trends: { emerging: [], recurring: [] },
            activity_inference: ['フォールバックモードでの推測'],
            metadata: {
                fallback: true,
                reason: 'AI抽出エラー'
            }
        };
    }
    
    /**
     * キャッシュキー生成
     */
    generateCacheKey(messages) {
        const content = messages
            .map(m => `${m.channel_name}:${m.text}`)
            .join('|');
        
        // 簡易ハッシュ
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return `keywords_${Math.abs(hash)}`;
    }
    
    /**
     * キャッシュから取得
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const age = Date.now() - cached.timestamp;
        if (age > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    /**
     * キャッシュに保存
     */
    saveToCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // キャッシュサイズ制限（最大100件）
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
    
    /**
     * Phase 6.6+互換性メソッド（移行期間用）
     */
    extractKeywordsForDiaryGeneration(messages) {
        console.log('🔄 Phase 6.6+互換モード: AI抽出にリダイレクト');
        return this.extractKeywords(messages, {
            specialConsiderations: '日記生成用に日常体験を特に重視してください'
        });
    }
    
    /**
     * Phase 6.6+互換性メソッド（品質分析用）
     */
    extractKeywordsForQualityAnalysis(messages) {
        console.log('🔄 Phase 6.6+互換モード: AI抽出にリダイレクト');
        return this.extractKeywords(messages, {
            specialConsiderations: '品質分析用に技術的詳細も含めてください'
        });
    }
}

module.exports = AIKeywordExtractor;
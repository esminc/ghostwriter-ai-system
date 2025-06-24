// Phase 7a: AI化キーワード抽出エンジン（最適化版）
// パフォーマンス改善とトークン削減を実施

const OpenAI = require('openai');

class AIKeywordExtractor {
    constructor(openaiApiKey) {
        this.openai = new OpenAI({
            apiKey: openaiApiKey
        });
        
        // 強化されたキャッシュ（1時間）
        this.cache = new Map();
        this.cacheTimeout = 60 * 60 * 1000; // 1時間
        
        // 最適化されたプロンプト
        this.MASTER_PROMPT = this.getOptimizedPrompt();
    }
    
    /**
     * メッセージからキーワードを抽出（最適化版）
     */
    async extractKeywords(messages, options = {}) {
        try {
            // キャッシュチェック（強化版）
            const cacheKey = this.generateCacheKey(messages);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('🎯 キャッシュヒット: 高速レスポンス');
                return { ...cached, fromCache: true };
            }
            
            // メッセージの前処理と圧縮
            const compressedMessages = this.compressMessages(messages);
            
            // 簡易チェック：メッセージが少ない場合は簡易モード
            if (messages.length <= 2) {
                return this.quickExtraction(compressedMessages);
            }
            
            // 最適化されたプロンプト構築
            const prompt = this.buildOptimizedPrompt(compressedMessages, options);
            
            console.log(`🚀 最適化AI抽出開始: ${messages.length}件 → ${compressedMessages.length}件に圧縮`);
            const startTime = Date.now();
            
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'system',
                    content: 'JSON形式で簡潔に応答。余計な説明不要。'
                }, {
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.2, // より決定論的に
                max_tokens: 800,  // トークン削減
                response_format: { type: "json_object" }
            });
            
            const responseTime = Date.now() - startTime;
            console.log(`✅ 最適化AI完了: ${responseTime}ms`);
            
            // レスポンス解析
            const result = JSON.parse(completion.choices[0].message.content);
            
            // 後処理と正規化
            const normalizedResult = this.normalizeResult(result);
            
            // メタデータ追加
            normalizedResult.metadata = {
                responseTime,
                tokenUsage: completion.usage?.total_tokens || 0,
                model: 'gpt-4o-mini-optimized',
                timestamp: new Date().toISOString(),
                messageCount: messages.length,
                compressed: true
            };
            
            // キャッシュ保存（拡張）
            this.saveToCache(cacheKey, normalizedResult);
            
            return normalizedResult;
            
        } catch (error) {
            console.error('❌ 最適化AI抽出エラー:', error);
            return this.ultraFastFallback(messages);
        }
    }
    
    /**
     * 最適化されたプロンプト（大幅に短縮）
     */
    getOptimizedPrompt() {
        return `Slackメッセージからキーワード抽出。

入力:
{messages}

出力JSON:
{
  "categories": {
    "daily_life": {"keywords": ["最大5個"], "importance": "high/medium/low"},
    "technical": {"keywords": ["最大5個"], "importance": "high/medium/low"},
    "business": {"keywords": ["最大5個"], "importance": "high/medium/low"},
    "emotion": {"keywords": ["最大3個"], "importance": "high/medium/low"}
  },
  "characteristic_words": [{"word": "特徴語", "frequency": 数, "category": "カテゴリ"}],
  "top_keywords": ["上位3個"],
  "activity_inference": ["活動1", "活動2"]
}

ルール:
- 日常体験(場所/食事/イベント)優先
- etc-spots重視
- 固有名詞重要
- 一般語除外`;
    }
    
    /**
     * メッセージの圧縮と前処理
     */
    compressMessages(messages) {
        // 重複除去とサンプリング
        const uniqueMessages = new Map();
        
        messages.forEach(msg => {
            const key = msg.text?.toLowerCase().trim();
            if (key && key.length > 5) {
                if (!uniqueMessages.has(key)) {
                    uniqueMessages.set(key, {
                        text: msg.text.substring(0, 100), // 最大100文字
                        channel: msg.channel_name.replace(/^(etc-|its-)/, ''), // プレフィックス除去
                        count: 1
                    });
                } else {
                    uniqueMessages.get(key).count++;
                }
            }
        });
        
        // 最大30メッセージに制限
        return Array.from(uniqueMessages.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 30);
    }
    
    /**
     * 最適化されたプロンプト構築
     */
    buildOptimizedPrompt(compressedMessages, options) {
        // 超簡潔なメッセージフォーマット
        const formatted = compressedMessages
            .map(m => `[${m.channel}]${m.text}${m.count > 1 ? `(${m.count}回)` : ''}`)
            .join('\n');
        
        return this.MASTER_PROMPT.replace('{messages}', formatted);
    }
    
    /**
     * 高速簡易抽出（メッセージ少数時）
     */
    async quickExtraction(messages) {
        console.log('⚡ 高速簡易モード');
        
        const keywords = new Set();
        const categories = {
            daily_life: { keywords: [], importance: 'medium' },
            technical: { keywords: [], importance: 'medium' },
            business: { keywords: [], importance: 'medium' },
            emotion: { keywords: [], importance: 'low' }
        };
        
        // 簡易パターンマッチング
        messages.forEach(msg => {
            const text = msg.text || '';
            
            // 場所・食べ物
            const placeFood = text.match(/[ァ-ヶー]+(?:カフェ|レストラン|駅|公園)|[ぁ-ん]+(?:焼き|ティー|ランチ)/g);
            if (placeFood) {
                categories.daily_life.keywords.push(...placeFood);
                categories.daily_life.importance = 'high';
            }
            
            // 技術用語
            const tech = text.match(/[A-Za-z]+\.?[A-Za-z]*|API|AI|ML/g);
            if (tech) {
                categories.technical.keywords.push(...tech.slice(0, 3));
            }
            
            keywords.add(...(placeFood || []), ...(tech || []));
        });
        
        // 重複除去
        Object.keys(categories).forEach(cat => {
            categories[cat].keywords = [...new Set(categories[cat].keywords.slice(0, 5))];
        });
        
        return {
            categories,
            characteristic_words: [],
            top_keywords: Array.from(keywords).slice(0, 3),
            activity_inference: ['日常活動'],
            metadata: {
                mode: 'quick',
                responseTime: 10
            }
        };
    }
    
    /**
     * 超高速フォールバック
     */
    ultraFastFallback(messages) {
        console.log('🚨 超高速フォールバック');
        
        const words = new Map();
        
        // 単純な頻度カウント
        messages.forEach(msg => {
            const tokens = (msg.text || '').split(/[\s、。]+/)
                .filter(w => w.length >= 2 && w.length <= 20);
            
            tokens.forEach(token => {
                words.set(token, (words.get(token) || 0) + 1);
            });
        });
        
        // 上位ワード
        const topWords = Array.from(words.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
        
        return {
            categories: {
                daily_life: { keywords: topWords.slice(0, 2), importance: 'medium' },
                technical: { keywords: [], importance: 'low' },
                business: { keywords: [], importance: 'low' },
                emotion: { keywords: [], importance: 'low' }
            },
            characteristic_words: [],
            top_keywords: topWords.slice(0, 3),
            activity_inference: ['フォールバック抽出'],
            metadata: {
                fallback: true,
                responseTime: 5
            }
        };
    }
    
    /**
     * 結果の正規化
     */
    normalizeResult(result) {
        // デフォルト構造の保証
        const normalized = {
            categories: {
                daily_life: { keywords: [], importance: 'medium' },
                technical: { keywords: [], importance: 'medium' },
                business: { keywords: [], importance: 'medium' },
                emotion: { keywords: [], importance: 'low' }
            },
            characteristic_words: [],
            top_keywords: [],
            temporal_trends: { emerging: [], recurring: [] },
            activity_inference: []
        };
        
        // 安全なマージ
        if (result.categories) {
            Object.keys(normalized.categories).forEach(cat => {
                if (result.categories[cat]) {
                    normalized.categories[cat] = {
                        keywords: (result.categories[cat].keywords || []).slice(0, 5),
                        importance: result.categories[cat].importance || 'medium',
                        context: result.categories[cat].context || ''
                    };
                }
            });
        }
        
        normalized.characteristic_words = (result.characteristic_words || []).slice(0, 10);
        normalized.top_keywords = (result.top_keywords || []).slice(0, 5);
        normalized.activity_inference = (result.activity_inference || []).slice(0, 3);
        
        return normalized;
    }
    
    /**
     * 強化されたキャッシュキー生成
     */
    generateCacheKey(messages) {
        // チャンネルとメッセージ数を含む
        const channelSummary = {};
        messages.forEach(msg => {
            channelSummary[msg.channel_name] = (channelSummary[msg.channel_name] || 0) + 1;
        });
        
        const keyParts = [
            Object.entries(channelSummary).map(([ch, cnt]) => `${ch}:${cnt}`).join(','),
            messages.slice(0, 5).map(m => m.text?.substring(0, 20)).join('|')
        ];
        
        return `ai_kw_${this.simpleHash(keyParts.join('_'))}`;
    }
    
    /**
     * シンプルなハッシュ関数
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    
    /**
     * キャッシュから取得（拡張版）
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const age = Date.now() - cached.timestamp;
        if (age > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        // キャッシュヒット統計
        cached.hitCount = (cached.hitCount || 0) + 1;
        console.log(`📊 キャッシュ統計: ${cached.hitCount}回目のヒット`);
        
        return cached.data;
    }
    
    /**
     * キャッシュに保存（拡張版）
     */
    saveToCache(key, data) {
        // サイズ制限前にLRU削除
        if (this.cache.size >= 200) {
            // 最も古いエントリを削除
            const oldestKey = Array.from(this.cache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            hitCount: 0
        });
    }
    
    /**
     * キャッシュ統計
     */
    getCacheStats() {
        const stats = {
            size: this.cache.size,
            totalHits: 0,
            avgHitRate: 0
        };
        
        this.cache.forEach(entry => {
            stats.totalHits += entry.hitCount || 0;
        });
        
        stats.avgHitRate = stats.size > 0 ? (stats.totalHits / stats.size).toFixed(2) : 0;
        
        return stats;
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
    
    /**
     * Phase 6.6+互換性メソッド（統合分析用）
     */
    async generateIntegratedAnalysis(messages) {
        console.log('🔄 Phase 6.6+互換モード: 統合分析をAI抽出にリダイレクト');
        const result = await this.extractKeywords(messages);
        
        // 旧形式の統合分析結果に変換
        return {
            keywords: result,
            channelAnalysis: new Map(),
            interestProfile: new Map(),
            temporalPatterns: { recent: [], today: [], frequent: [] },
            topInterests: result.top_keywords || [],
            summary: {
                totalKeywords: (result.top_keywords || []).length,
                dominantCategory: 'ai_analysis',
                activityLevel: 'medium',
                focusAreas: result.top_keywords?.slice(0, 3) || [],
                characteristicWords: result.characteristic_words?.slice(0, 5).map(w => w.word) || []
            }
        };
    }
    
    /**
     * Phase 6.6+互換性メソッド（プロンプト特徴語用）
     */
    async generatePromptCharacteristicWords(messages, maxWords = 8) {
        console.log('🔄 Phase 6.6+互換モード: プロンプト特徴語をAI抽出にリダイレクト');
        const result = await this.extractKeywords(messages);
        
        // 旧形式のプロンプト特徴語に変換（オブジェクト形式）
        const characteristicWords = [];
        
        // カテゴリから特徴語を抽出
        if (result.categories) {
            Object.entries(result.categories).forEach(([category, cat]) => {
                (cat.keywords || []).forEach(keyword => {
                    characteristicWords.push({
                        word: keyword,
                        frequency: 1,
                        category: category,
                        source: 'ai_extraction'
                    });
                });
            });
        }
        
        // characteristic_wordsがある場合はそれも追加
        if (result.characteristic_words) {
            result.characteristic_words.forEach(item => {
                characteristicWords.push({
                    word: item.word || item,
                    frequency: item.frequency || 1,
                    category: item.category || 'general',
                    source: 'ai_extraction'
                });
            });
        }
        
        // top_keywordsも追加
        if (result.top_keywords) {
            result.top_keywords.forEach(keyword => {
                if (!characteristicWords.some(w => w.word === keyword)) {
                    characteristicWords.push({
                        word: keyword,
                        frequency: 2, // top_keywordは頻度高め
                        category: 'top',
                        source: 'ai_extraction'
                    });
                }
            });
        }
        
        // 重複除去して上位を返す
        const uniqueWords = characteristicWords.filter((word, index, self) =>
            index === self.findIndex(w => w.word === word.word)
        );
        
        return uniqueWords.slice(0, maxWords);
    }
}

module.exports = AIKeywordExtractor;
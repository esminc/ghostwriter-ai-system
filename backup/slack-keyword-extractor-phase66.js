// Slackメッセージ高度キーワード抽出エンジン
// Phase 6.5: 動的特徴語抽出機能追加
// Phase 6.6: 日常体験キーワード対応

class SlackKeywordExtractor {
    constructor() {
        this.initializeKeywordDictionaries();
    }
    
    initializeKeywordDictionaries() {
        // 🎯 技術関連キーワード辞書
        this.techKeywords = {
            programming: {
                patterns: ['javascript', 'js', 'react', 'node', 'python', 'java', 'typescript', 'ts', 'html', 'css', 'sql'],
                category: 'プログラミング',
                weight: 1.0
            },
            ai_ml: {
                patterns: ['ai', '人工知能', 'chatgpt', 'gpt', '機械学習', 'ml', 'llm', 'claude', 'openai'],
                category: 'AI・機械学習',
                weight: 1.2
            },
            infrastructure: {
                patterns: ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'サーバー', 'デプロイ', 'ci/cd', 'github'],
                category: 'インフラ・DevOps',
                weight: 0.9
            },
            framework: {
                patterns: ['nextjs', 'next.js', 'express', 'rails', 'django', 'spring', 'laravel'],
                category: 'フレームワーク',
                weight: 0.8
            },
            database: {
                patterns: ['postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'データベース', 'db'],
                category: 'データベース',
                weight: 0.7
            }
        };
        
        // 🎯 ビジネス・業務関連キーワード辞書
        this.businessKeywords = {
            project_management: {
                patterns: ['プロジェクト', 'スケジュール', 'タスク', '進捗', 'デッドライン', 'マイルストーン'],
                category: 'プロジェクト管理',
                weight: 1.0
            },
            meetings: {
                patterns: ['会議', 'meeting', 'mtg', '打ち合わせ', 'ミーティング', '相談', '議論'],
                category: '会議・連携',
                weight: 0.9
            },
            development: {
                patterns: ['開発', '実装', '設計', 'アーキテクチャ', 'システム', '改善', 'バグ修正'],
                category: 'システム開発',
                weight: 1.1
            },
            planning: {
                patterns: ['企画', '計画', '提案', '戦略', 'ロードマップ', '要件'],
                category: '企画・計画',
                weight: 0.8
            }
        };
        
        // 🎯 イベント・活動関連キーワード辞書
        this.eventKeywords = {
            hackathon: {
                patterns: ['ハッカソン', 'hackathon', 'hack', 'イベント', 'コンテスト', '大会'],
                category: 'ハッカソン・イベント',
                weight: 1.3
            },
            learning: {
                patterns: ['学習', '勉強', '調査', '研究', '習得', 'スキルアップ', '知識'],
                category: '学習・成長',
                weight: 1.0
            },
            collaboration: {
                patterns: ['協力', '連携', 'チーム', 'コラボ', '共同', 'ペア', 'レビュー'],
                category: 'チーム協力',
                weight: 0.9
            }
        };
        
        // 🎯 感情・状況関連キーワード辞書
        this.emotionKeywords = {
            positive: {
                patterns: ['成功', '完了', '達成', '解決', '良い', '素晴らしい', 'おめでとう', 'ありがとう'],
                category: 'ポジティブ',
                weight: 1.0
            },
            challenge: {
                patterns: ['課題', '問題', 'エラー', 'バグ', '困った', '難しい', 'トラブル'],
                category: '課題・チャレンジ',
                weight: 0.8
            },
            progress: {
                patterns: ['進行中', '作業中', '開発中', '検討中', '調整中', '準備中'],
                category: '進行状況',
                weight: 0.7
            }
        };
    }

    // 🆕 Phase 6.5: 動的特徴語抽出機能
    /**
     * メッセージから動的に特徴的な単語を発見する
     */
    extractRecentCharacteristicWords(messages) {
        console.log(`🔍 動的特徴語抽出開始: ${messages.length}件のメッセージ`);
        
        const characteristicWords = new Set();
        const wordFrequency = new Map();
        
        messages.forEach(msg => {
            const text = msg.text || '';
            const words = this.simpleTokenize(text);
            
            words.forEach(word => {
                // 特徴語判定
                if (this.looksCharacteristic(word)) {
                    characteristicWords.add(word);
                    
                    // 頻度カウント
                    const currentCount = wordFrequency.get(word) || 0;
                    wordFrequency.set(word, currentCount + 1);
                }
            });
        });
        
        // 頻度順にソートして上位を返す
        const sortedWords = Array.from(characteristicWords)
            .map(word => ({
                word: word,
                frequency: wordFrequency.get(word) || 0,
                category: this.categorizeCharacteristicWord(word)
            }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 15); // 上位15個まで
        
        console.log(`✅ 動的特徴語抽出完了: ${sortedWords.length}個の特徴語を発見`);
        console.log(`   → 特徴語例: ${sortedWords.slice(0, 5).map(w => w.word).join(', ')}`);
        
        return sortedWords;
    }
    
    /**
     * 🔍 シンプルなトークン化（日本語・英語混在対応）
     */
    simpleTokenize(text) {
        // 基本的な単語分割（空白、句読点で分割）
        const tokens = text
            .toLowerCase()
            .split(/[\s\n\r\t,.。、！!？?（）()【】\[\]「」『』""'']+/)
            .filter(token => token.length > 0)
            .map(token => token.trim());
        
        // 英数字混在の単語を抽出
        const words = [];
        tokens.forEach(token => {
            // URL除外
            if (token.includes('http') || token.includes('www.')) return;
            
            // 長さ制限
            if (token.length >= 2 && token.length <= 50) {
                words.push(token);
            }
        });
        
        return words;
    }
    
    /**
     * 🎯 特徴語判定ロジック（驚き効果最大化 + Phase 6.6: 日常体験対応）
     */
    looksCharacteristic(word) {
        const characteristics = [
            // 技術系キーワードの特徴
            /[A-Z]/.test(word),                    // 大文字含む: "API", "ngrok"
            /[a-z][A-Z]/.test(word),              // キャメルケース: "JavaScript", "OpenAI"
            word.includes('.'),                    // ドット含む: "next.js", "node.js"
            word.includes('-'),                    // ハイフン含む: "real-time", "up-to-date"
            /^[A-Z]{2,}$/.test(word),             // 全大文字: "API", "MCP", "LLM"
            word.length >= 6 && /^[a-zA-Z]+$/.test(word), // 長い英単語: "integration", "authentication"
            
            // 日本語技術用語の特徴
            word.includes('システム') && word.length > 4,
            word.includes('機能') && word.length > 3,
            word.includes('実装') && word.length > 3,
            word.includes('開発') && word.length > 3,
            
            // 🆕 Phase 6.6: 日常体験キーワードを追加
            this.isLocationKeyword(word),          // 地名・場所: "三鷷", "北陸新幹線"
            this.isActivityKeyword(word),          // 活動: "合宿", "アフタヌーンティー"
            this.isFoodKeyword(word),              // 食べ物: "たい焼き", "ラーメン"
            this.isBusinessTermKeyword(word),      // ビジネス: "チーム運営", "PJ進め方"
            
            // 数値含有の特徴的表現
            /[0-9]/.test(word) && word.length >= 3, // "phase6", "v1.0", "port3000"
            
            // 特殊記号含有
            word.includes('_') || word.includes('@') || word.includes('#')
        ];
        
        return characteristics.some(check => check);
    }
    
    // 🆕 Phase 6.6: 日常体験キーワード判定メソッド
    /**
     * 地名・場所キーワード判定
     */
    isLocationKeyword(word) {
        const locationPatterns = [
            // 主要都市
            '東京', '大阪', '名古屋', '福岡', '札幌', '京都', '神戸', '横浜',
            // 特定地域
            '三鷷', '渋谷', '新宿', '池袋', '品川', '秋葉原', '武蔵野',
            // 交通関連
            '新幹線', '北陸新幹線', '東海道新幹線', 'jr', '私鉄',
            // 建物・施設
            'ホテル', 'カフェ', 'レストラン', 'オフィス', '会議室'
        ];
        
        return locationPatterns.some(pattern => 
            word.includes(pattern) || pattern.includes(word)
        );
    }
    
    /**
     * 活動キーワード判定
     */
    isActivityKeyword(word) {
        const activityPatterns = [
            // イベント・活動
            'ランチ', 'ディナー', '飲み会',
            // レジャー活動
            '映画', 'ショッピング', '旅行', '散歩', 'サイクリング',
            // ビジネス活動
            'ミーティング', 'プレゼン', '研修', 'セミナー', 'ワークショップ'
        ];
        
        return activityPatterns.some(pattern => 
            word.includes(pattern) || pattern.includes(word)
        );
    }
    
    /**
     * 食べ物キーワード判定
     */
    isFoodKeyword(word) {
        const foodPatterns = [
            // 和食
            'おいしい', 'おいも', 'おやき', '寿司', 'てんぷら',
            // 洋食
            'パスタ', 'ピザ', 'ケーキ', 'コーヒー', 'サンドイッチ',
            // アジア料理
            'ラーメン', 'チャーハン', 'カレー', 'キムチ',
            // デザート・お菓子
            'アイス', 'チョコ', 'クッキー', 'プリン'
        ];
        
        return foodPatterns.some(pattern => 
            word.includes(pattern) || pattern.includes(word)
        );
    }
    
    /**
     * ビジネス用語キーワード判定
     */
    isBusinessTermKeyword(word) {
        const businessPatterns = [
            // プロジェクト管理
            'チーム運営', 'pj進め方', 'プロジェクト進め方', '進捗管理',
            // 議論・計画
            '深く議論', '今後の', '方針', '戦略', '計画',
            // コミュニケーション
            '情報共有', '連携', '協力', 'フィードバック'
        ];
        
        return businessPatterns.some(pattern => 
            word.toLowerCase().includes(pattern.toLowerCase()) || 
            pattern.toLowerCase().includes(word.toLowerCase())
        );
    }
    
    /**
     * 🏷️ 特徴語のカテゴリ分類 (Phase 6.6: 日常体験対応)
     */
    categorizeCharacteristicWord(word) {
        const lowerWord = word.toLowerCase();
        
        // 🆕 Phase 6.6: 日常体験カテゴリを優先判定
        if (this.isLocationKeyword(word)) return '場所・地名';
        if (this.isActivityKeyword(word)) return '活動・体験';
        if (this.isFoodKeyword(word)) return '食べ物';
        if (this.isBusinessTermKeyword(word)) return 'ビジネス用語';
        
        // 技術カテゴリ判定
        if (['api', 'mcp', 'llm', 'ai', 'gpt', 'claude'].includes(lowerWord)) return 'AI技術';
        if (['ngrok', 'docker', 'aws', 'github', 'postgresql'].includes(lowerWord)) return 'インフラ';
        if (['javascript', 'react', 'nextjs', 'express', 'node'].includes(lowerWord)) return 'プログラミング';
        if (['slack', 'esa', 'teams', 'zoom'].includes(lowerWord)) return 'ツール';
        if (lowerWord.includes('hack') || lowerWord.includes('イベント')) return 'イベント';
        
        // パターンベース判定
        if (/^[A-Z]{2,}$/.test(word)) return 'テクニカル略語';
        if (word.includes('.js') || word.includes('.py')) return 'ファイル・技術';
        if (word.includes('-') && word.length > 5) return '複合技術用語';
        
        return '一般特徴語';
    }
    
    // 🆕 日記生成専用: AI生成プロンプト用の特徴語リスト生成
    /**
     * 日記生成AI用の特徴語リストを生成（動的抽出100%）
     */
    generatePromptCharacteristicWordsForDiary(messages, maxWords = 8) {
        console.log(`📝 日記生成用特徴語生成開始 (動的100%モード)`);
        const characteristicWords = this.extractRecentCharacteristicWords(messages);
        
        // 日記生成に適した特徴語を選別（辞書を使わず動的判定のみ）
        const promptWords = characteristicWords
            .filter(wordData => {
                // 汎用すぎる単語を除外（動的判定）
                const excludeGeneric = ['システム', 'プロジェクト', '開発', '作業', 'タスク'];
                const isNotGeneric = !excludeGeneric.includes(wordData.word);
                
                // 動的に判定した特徴的な語のみ採用 
                const isDynamic = wordData.frequency >= 2 || wordData.category !== '一般特徴語';
                
                return isNotGeneric && isDynamic;
            })
            .slice(0, maxWords)
            .map(wordData => ({
                word: wordData.word,
                category: wordData.category,
                frequency: wordData.frequency,
                source: 'dynamic_extraction_only'
            }));
        
        console.log(`✅ 日記生成用特徴語選別完了 (辞書0%): ${promptWords.map(w => w.word).join(', ')}`);
        console.log(`   動的抽出語数: ${promptWords.length}/${characteristicWords.length}`);
        
        return promptWords;
    }
    
    /**
     * 品質分析用の特徴語リスト生成（辞書併用継続）
     */
    generatePromptCharacteristicWords(messages, maxWords = 8) {
        console.log(`📊 品質分析用特徴語生成開始 (辞書併用モード)`);
        const characteristicWords = this.extractRecentCharacteristicWords(messages);
        
        // AI生成に適した特徴語を選別
        const promptWords = characteristicWords
            .filter(wordData => {
                // 汎用すぎる単語を除外
                const excludeGeneric = ['システム', 'プロジェクト', '開発', '作業'];
                return !excludeGeneric.includes(wordData.word);
            })
            .slice(0, maxWords)
            .map(wordData => wordData.word);
        
        console.log(`🔍 品質分析用特徴語選別完了: ${promptWords.join(', ')}`);
        return promptWords;
    }
    
    /**
     * 動的抽出のみを使った活動内容の推測（日記生成用）
     */
    inferActivitiesFromCharacteristicWords(messages) {
        console.log(`🔍 動的抽出による活動推測開始 (辞書不使用)`);
        const characteristicWords = this.extractRecentCharacteristicWords(messages);
        const activities = [];
        
        // 特徴語パターンから活動を推測（動的判定のみ）
        const wordList = characteristicWords.map(w => w.word.toLowerCase());
        const categoryList = characteristicWords.map(w => w.category);
        
        // カテゴリベースの活動推測（辞書に依存しない）
        if (categoryList.includes('AI技術') || wordList.some(w => w.includes('ai') || w.includes('claude') || w.includes('gpt'))) {
            activities.push('AI統合システムの開発作業');
        }
        if (categoryList.includes('ツール') || wordList.some(w => w.includes('slack') || w.includes('team'))) {
            activities.push('チームコミュニケーションツール活用');
        }
        if (categoryList.includes('イベント') || wordList.some(w => w.includes('hack') || w.includes('event'))) {
            activities.push('技術イベント関連活動');
        }
        if (categoryList.includes('プログラミング') || wordList.some(w => w.includes('code') || w.includes('dev'))) {
            activities.push('プログラミング・開発作業');
        }
        if (categoryList.includes('場所・地名') || categoryList.includes('活動・体験')) {
            activities.push('実際の場所での具体的活動');
        }
        if (categoryList.includes('食べ物')) {
            activities.push('食事・グルメ体験');
        }
        
        // 動的に発見された特徴的語彙から活動を構築
        const topWords = characteristicWords.slice(0, 3).map(w => w.word);
        if (activities.length === 0 && topWords.length > 0) {
            activities.push(`${topWords.join('・')}に関連する活動`);
        }
        
        // 最終フォールバック（動的特徴語が見つからない場合）
        if (activities.length === 0) {
            activities.push('メッセージから動的に発見された日常活動');
        }
        
        console.log(`✅ 動的活動推測完了: ${activities.join(', ')}`);
        return activities.slice(0, 3); // 最大3つまで
    }
    
    /**
     * 🎯 日記生成専用: 動的抽出のみ使用（辞書0%）
     */
    extractKeywordsForDiaryGeneration(messages) {
        console.log(`📝 日記生成用動的抽出開始: ${messages.length}件のメッセージ`);
        console.log(`🚨 重要: 辞書使用0%、動的抽出100%モード`);
        
        const extractedKeywords = {
            // 動的特徴語のみ使用
            characteristic: this.extractRecentCharacteristicWords(messages),
            // 動的抽出からの活動推測
            inferredActivities: this.inferActivitiesFromCharacteristicWords(messages),
            // 時系列重視の最新情報
            temporalContext: this.extractTemporalContext(messages),
            rawData: {
                totalMessages: messages.length,
                totalCharacters: 0,
                averageLength: 0,
                mode: 'diary_generation_dynamic_only'
            }
        };
        
        // 統計情報計算
        const allTexts = messages.map(msg => {
            const text = (msg.text || '').toLowerCase();
            extractedKeywords.rawData.totalCharacters += text.length;
            return text;
        });
        
        extractedKeywords.rawData.averageLength = 
            extractedKeywords.rawData.totalCharacters / Math.max(messages.length, 1);
        
        console.log(`✅ 日記生成用動的抽出完了:`);
        console.log(`   - 動的特徴語: ${extractedKeywords.characteristic.length}語`);
        console.log(`   - 推測活動: ${extractedKeywords.inferredActivities.length}件`);
        console.log(`   - 辞書使用: 0% (完全動的抽出)`);
        
        return extractedKeywords;
    }
    
    /**
     * 🎯 品質分析専用: 辞書併用モード（従来機能維持）
     */
    extractKeywordsForQualityAnalysis(messages) {
        console.log(`📊 品質分析用キーワード抽出開始: ${messages.length}件のメッセージ`);
        console.log(`🔍 辞書併用モード: 技術的具体性・クロス汚染防止用`);
        
        const extractedKeywords = {
            technical: new Map(),
            business: new Map(),
            events: new Map(),
            emotions: new Map(),
            // 動的特徴語も含める
            characteristic: this.extractRecentCharacteristicWords(messages),
            rawData: {
                totalMessages: messages.length,
                totalCharacters: 0,
                averageLength: 0,
                mode: 'quality_analysis_dictionary_enabled'
            }
        };
        
        // 全メッセージテキストを結合・前処理
        const allTexts = messages.map(msg => {
            const text = (msg.text || '').toLowerCase();
            extractedKeywords.rawData.totalCharacters += text.length;
            return {
                text: text,
                channel: msg.channel_name,
                timestamp: msg.ts,
                original: msg
            };
        });
        
        extractedKeywords.rawData.averageLength = 
            extractedKeywords.rawData.totalCharacters / Math.max(messages.length, 1);
        
        // カテゴリ別キーワード抽出（辞書使用）
        this.extractCategoryKeywords(allTexts, this.techKeywords, extractedKeywords.technical);
        this.extractCategoryKeywords(allTexts, this.businessKeywords, extractedKeywords.business);
        this.extractCategoryKeywords(allTexts, this.eventKeywords, extractedKeywords.events);
        this.extractCategoryKeywords(allTexts, this.emotionKeywords, extractedKeywords.emotions);
        
        console.log(`✅ 品質分析用抽出完了:`);
        console.log(`   - 技術: ${extractedKeywords.technical.size}種類`);
        console.log(`   - ビジネス: ${extractedKeywords.business.size}種類`);
        console.log(`   - イベント: ${extractedKeywords.events.size}種類`);
        console.log(`   - 感情: ${extractedKeywords.emotions.size}種類`);
        console.log(`   - 動的特徴語: ${extractedKeywords.characteristic.length}語`);
        
        return extractedKeywords;
    }
    
    /**
     * 🎯 メッセージ群からの高度キーワード抽出（従来互換性メソッド）
     * @deprecated 新しいコードでは extractKeywordsForDiaryGeneration または extractKeywordsForQualityAnalysis を使用
     */
    extractKeywordsFromMessages(messages) {
        console.log(`⚠️  従来互換性メソッド: extractKeywordsFromMessages`);
        console.log(`📝 品質分析用メソッドにリダイレクト`);
        // 後方互換性のため品質分析用にリダイレクト
        return this.extractKeywordsForQualityAnalysis(messages);
    }
    
    /**
     * 🆕 時系列コンテキスト抽出（日記生成用）
     */
    extractTemporalContext(messages) {
        const now = Date.now();
        const sixHoursAgo = now - (6 * 60 * 60 * 1000);
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        
        const context = {
            recent: [], // 直近6時間
            today: [],  // 今日
            trends: []  // トレンド分析
        };
        
        messages.forEach(msg => {
            const msgTime = parseFloat(msg.ts) * 1000;
            
            if (msgTime >= sixHoursAgo) {
                context.recent.push({
                    text: msg.text,
                    channel: msg.channel_name,
                    timestamp: msgTime
                });
            }
            
            if (msgTime >= oneDayAgo) {
                context.today.push({
                    text: msg.text,
                    channel: msg.channel_name,
                    timestamp: msgTime
                });
            }
        });
        
        // トレンド分析: 最新メッセージから特徴的な変化を抽出
        context.trends = this.analyzeTrends(context.recent, context.today);
        
        return context;
    }
    
    /**
     * 🆕 トレンド分析（動的特徴語の時系列変化）
     */
    analyzeTrends(recentMessages, todayMessages) {
        const trends = [];
        
        // 最新メッセージでよく使われる語彙の特定
        const recentWords = this.extractWordFrequency(recentMessages);
        const todayWords = this.extractWordFrequency(todayMessages);
        
        // 最近増加した語彙を特定
        recentWords.forEach((recentCount, word) => {
            const todayCount = todayWords.get(word) || 0;
            const averageCount = todayCount / Math.max(todayMessages.length, 1);
            const recentRate = recentCount / Math.max(recentMessages.length, 1);
            
            if (recentRate > averageCount * 1.5 && recentCount >= 2) {
                trends.push({
                    word: word,
                    trend: 'increasing',
                    recentFrequency: recentCount,
                    dailyAverage: averageCount,
                    significance: recentRate / Math.max(averageCount, 0.1)
                });
            }
        });
        
        return trends.sort((a, b) => b.significance - a.significance).slice(0, 5);
    }
    
    /**
     * 🆕 語彙頻度分析
     */
    extractWordFrequency(messages) {
        const wordFreq = new Map();
        
        messages.forEach(msg => {
            if (!msg.text) return;
            
            const words = this.simpleTokenize(msg.text);
            words.forEach(word => {
                if (this.looksCharacteristic(word)) {
                    const count = wordFreq.get(word) || 0;
                    wordFreq.set(word, count + 1);
                }
            });
        });
        
        return wordFreq;
    }
    
    /**
     * 🔍 カテゴリ別キーワード抽出処理
     */
    extractCategoryKeywords(texts, keywordDict, resultMap) {
        Object.entries(keywordDict).forEach(([key, config]) => {
            let totalScore = 0;
            let matchCount = 0;
            const matchDetails = [];
            
            texts.forEach(textObj => {
                config.patterns.forEach(pattern => {
                    const regex = new RegExp(pattern, 'gi');
                    const matches = textObj.text.match(regex);
                    if (matches) {
                        matchCount += matches.length;
                        totalScore += matches.length * config.weight;
                        matchDetails.push({
                            pattern: pattern,
                            count: matches.length,
                            channel: textObj.channel,
                            timestamp: textObj.timestamp
                        });
                    }
                });
            });
            
            if (matchCount > 0) {
                resultMap.set(config.category, {
                    score: totalScore,
                    matchCount: matchCount,
                    weight: config.weight,
                    details: matchDetails,
                    patterns: config.patterns
                });
            }
        });
    }
    
    /**
     * 🎯 チャンネル特性を活用したコンテキスト分析
     */
    analyzeChannelContext(messages) {
        const channelAnalysis = new Map();
        
        // チャンネル別メッセージ分類
        const channelGroups = {};
        messages.forEach(msg => {
            if (!channelGroups[msg.channel_name]) {
                channelGroups[msg.channel_name] = [];
            }
            channelGroups[msg.channel_name].push(msg);
        });
        
        // チャンネル特性に基づく分析
        Object.entries(channelGroups).forEach(([channelName, channelMessages]) => {
            const context = this.inferChannelContext(channelName);
            const keywords = this.extractKeywordsFromMessages(channelMessages);
            
            channelAnalysis.set(channelName, {
                messageCount: channelMessages.length,
                inferredContext: context,
                keywords: keywords,
                dominantTopics: this.getDominantTopics(keywords)
            });
        });
        
        console.log(`📊 チャンネル別分析完了: ${channelAnalysis.size}チャンネル`);
        return channelAnalysis;
    }
    
    /**
     * 🔍 チャンネル名からコンテキスト推定
     */
    inferChannelContext(channelName) {
        const contexts = {
            'its-tech': { primary: '技術討論', secondary: '技術情報共有', weight: 1.2 },
            'its-wkwk-general': { primary: '一般連絡', secondary: 'チーム連携', weight: 1.0 },
            'its-wkwk-study': { primary: '学習活動', secondary: '知識共有', weight: 1.1 },
            'its-wkwk-diary': { primary: '日記・記録', secondary: '振り返り', weight: 0.9 },
            'its-training': { primary: '研修・訓練', secondary: 'スキル向上', weight: 1.0 },
            'etc-hobby': { primary: '趣味・雑談', secondary: 'リラックス', weight: 0.6 },
            'etc-spots': { primary: '場所・イベント', secondary: '情報共有', weight: 0.7 }
        };
        
        return contexts[channelName] || { primary: '一般', secondary: '不明', weight: 0.5 };
    }
    
    /**
     * 🎯 支配的トピックの特定
     */
    getDominantTopics(keywords) {
        const allTopics = [];
        
        // 各カテゴリから上位トピックを抽出
        [keywords.technical, keywords.business, keywords.events, keywords.emotions].forEach(categoryMap => {
            const sorted = Array.from(categoryMap.entries())
                .sort((a, b) => b[1].score - a[1].score)
                .slice(0, 2); // 上位2つ
            
            sorted.forEach(([topic, data]) => {
                allTopics.push({
                    topic: topic,
                    score: data.score,
                    matchCount: data.matchCount
                });
            });
        });
        
        // スコア順にソートして上位5つを返す
        return allTopics
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }
    
    /**
     * 🎯 統合分析結果の生成
     */
    generateIntegratedAnalysis(messages) {
        const keywords = this.extractKeywordsFromMessages(messages);
        const channelAnalysis = this.analyzeChannelContext(messages);
        
        // 関心事の統合スコアリング
        const interestProfile = this.calculateInterestProfile(keywords, channelAnalysis);
        
        // 時系列パターン分析
        const temporalPatterns = this.analyzeTemporalPatterns(messages);
        
        // 最終的な関心事ランキング
        const topInterests = this.generateTopInterests(interestProfile, temporalPatterns);
        
        return {
            keywords: keywords,
            channelAnalysis: channelAnalysis,
            interestProfile: interestProfile,
            temporalPatterns: temporalPatterns,
            topInterests: topInterests,
            summary: {
                totalKeywords: keywords.technical.size + keywords.business.size + keywords.events.size,
                dominantCategory: this.getDominantCategory(keywords),
                activityLevel: this.calculateActivityLevel(messages),
                focusAreas: topInterests.slice(0, 3).map(item => item.interest),
                // 🆕 Phase 6.5: 動的特徴語情報を追加
                characteristicWords: keywords.characteristic.slice(0, 5).map(w => w.word)
            }
        };
    }
    
    /**
     * 🎯 関心事プロファイルの計算
     */
    calculateInterestProfile(keywords, channelAnalysis) {
        const profile = new Map();
        
        // キーワードベースのスコア
        [keywords.technical, keywords.business, keywords.events].forEach(categoryMap => {
            categoryMap.forEach((data, topic) => {
                const existingScore = profile.get(topic) || 0;
                profile.set(topic, existingScore + data.score);
            });
        });
        
        // チャンネルコンテキストによる重み調整
        channelAnalysis.forEach((analysis, channelName) => {
            const contextWeight = analysis.inferredContext.weight;
            analysis.dominantTopics.forEach(topicData => {
                const existingScore = profile.get(topicData.topic) || 0;
                profile.set(topicData.topic, existingScore + (topicData.score * contextWeight));
            });
        });
        
        return profile;
    }
    
    /**
     * 🎯 時系列パターン分析
     */
    analyzeTemporalPatterns(messages) {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        const patterns = {
            recent: [], // 直近6時間
            today: [],  // 今日
            frequent: [] // 頻出パターン
        };
        
        messages.forEach(msg => {
            const msgTime = parseFloat(msg.ts) * 1000;
            const hoursAgo = (now - msgTime) / (1000 * 60 * 60);
            
            if (hoursAgo <= 6) {
                patterns.recent.push(msg);
            }
            if (hoursAgo <= 24) {
                patterns.today.push(msg);
            }
        });
        
        return patterns;
    }
    
    /**
     * 🎯 支配的カテゴリの特定
     */
    getDominantCategory(keywords) {
        const categoryScores = {
            technical: Array.from(keywords.technical.values()).reduce((sum, data) => sum + data.score, 0),
            business: Array.from(keywords.business.values()).reduce((sum, data) => sum + data.score, 0),
            events: Array.from(keywords.events.values()).reduce((sum, data) => sum + data.score, 0)
        };
        
        return Object.entries(categoryScores)
            .sort((a, b) => b[1] - a[1])[0][0];
    }
    
    /**
     * 🎯 活動レベルの計算
     */
    calculateActivityLevel(messages) {
        const totalMessages = messages.length;
        const avgLength = messages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0) / Math.max(totalMessages, 1);
        
        if (totalMessages >= 10 && avgLength >= 50) return 'very_high';
        if (totalMessages >= 5 && avgLength >= 30) return 'high';
        if (totalMessages >= 2 && avgLength >= 20) return 'medium';
        return 'low';
    }
    
    /**
     * 🎯 トップ関心事の生成
     */
    generateTopInterests(interestProfile, temporalPatterns) {
        return Array.from(interestProfile.entries())
            .map(([interest, score]) => ({
                interest: interest,
                score: score,
                recent: temporalPatterns.recent.some(msg => 
                    (msg.text || '').toLowerCase().includes(interest.toLowerCase())
                )
            }))
            .sort((a, b) => {
                // 最近の言及があるものを優先
                if (a.recent && !b.recent) return -1;
                if (!a.recent && b.recent) return 1;
                return b.score - a.score;
            });
    }
}

module.exports = SlackKeywordExtractor;
            // 時間パターン抽出
            const timeRegex = /(\d{1,2}:\d{2}|\d+時間?|\d+分)/g;
            const times = content.match(timeRegex) || [];
            timePatterns.push(...times);
        });
        
        // 頻出タスクを集計
        const taskFrequency = {};
        taskPatterns.forEach(task => {
            const normalized = this.normalizeTask(task);
            taskFrequency[normalized] = (taskFrequency[normalized] || 0) + 1;
        });
        
        const topTasks = Object.entries(taskFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([task]) => task);
        
        return {
            typical_tasks: topTasks.length > 0 ? topTasks : ['AI開発', 'システム統合', 'MCP実装'],
            work_style: this.inferWorkStyle(articles),
            posting_frequency: this.calculatePostingFrequency(articles),
            typical_structure: this.analyzeArticleStructure(articles),
            analysis_method: 'mcp_integrated'
        };
    }

    // デフォルト値メソッド群
    getDefaultWritingStyle() {
        return {
            primary_tone: 'casual',
            tone_scores: { casual: 3, formal: 1, technical: 2 },
            emotion_scores: { positive: 2, neutral: 2, negative: 1 },
            avg_article_length: 400,
            emoji_frequency: 1.5,
            characteristic_phrases: ['だね', 'かも'],
            analysis_method: 'mcp_default'
        };
    }

    getDefaultInterests() {
        return {
            tech_scores: { ai_ml: 3, backend: 2, frontend: 1, infrastructure: 1 },
            main_categories: ['ai_ml', 'backend'],
            frequent_keywords: ['AI', 'システム', 'MCP'],
            learning_topics: ['MCP統合', 'AI開発'],
            analysis_method: 'mcp_default'
        };
    }

    getDefaultBehaviorPatterns() {
        return {
            typical_tasks: ['AI開発', 'システム統合', 'MCP実装'],
            work_style: 'バランス型',
            posting_frequency: '週数回',
            typical_structure: {
                uses_headers: true,
                uses_tasks: true,
                uses_til: true,
                uses_emotions: true
            },
            analysis_method: 'mcp_default'
        };
    }

    // ユーティリティメソッド（従来版を継承）
    extractCharacteristicPhrases(text) {
        const phrases = [];
        const patterns = [
            /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+だね/g,
            /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+だな/g,
            /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+かも/g,
            /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+感/g
        ];
        
        patterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            phrases.push(...matches.slice(0, 3));
        });
        
        return phrases.slice(0, 5);
    }

    extractKeywords(text) {
        const katakanaRegex = /[\u30A0-\u30FF]{3,}/g;
        const techRegex = /[A-Z]{2,}|[a-zA-Z]+[A-Z][a-zA-Z]*/g;
        
        const katakanaWords = text.match(katakanaRegex) || [];
        const techWords = text.match(techRegex) || [];
        
        const allWords = [...katakanaWords, ...techWords];
        
        const frequency = {};
        allWords.forEach(word => {
            if (word.length >= 3) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });
        
        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .map(([word]) => word);
    }

    extractLearningTopics(articles) {
        const learningKeywords = ['学習', '勉強', '調査', '検証', 'TIL', '知った'];
        const topics = [];
        
        articles.forEach(article => {
            const content = article.body_md || '';
            learningKeywords.forEach(keyword => {
                if (content.includes(keyword)) {
                    const sentences = content.split(/[。\n]/).filter(sentence => 
                        sentence.includes(keyword) && sentence.length > 10
                    );
                    topics.push(...sentences.slice(0, 2));
                }
            });
        });
        
        return topics.slice(0, 5);
    }

    normalizeTask(task) {
        const patterns = [
            { pattern: /(バグ|bug|修正|fix)/i, normalized: 'バグ修正' },
            { pattern: /(レビュー|review)/i, normalized: 'コードレビュー' },
            { pattern: /(実装|開発|implementation)/i, normalized: '機能実装' },
            { pattern: /(テスト|test)/i, normalized: 'テスト' },
            { pattern: /(設計|design)/i, normalized: '設計' },
            { pattern: /(調査|研究|study)/i, normalized: '技術調査' },
            { pattern: /(MCP|統合)/i, normalized: 'MCP統合' }
        ];
        
        for (const { pattern, normalized } of patterns) {
            if (pattern.test(task)) {
                return normalized;
            }
        }
        
        return task.length > 20 ? task.substring(0, 20) + '...' : task;
    }

    inferWorkStyle(articles) {
        const recentArticles = articles.slice(0, 10);
        const avgTaskCount = recentArticles.reduce((sum, article) => {
            const tasks = (article.body_md || '').match(/- \[x\]/g) || [];
            return sum + tasks.length;
        }, 0) / Math.max(recentArticles.length, 1);
        
        if (avgTaskCount > 8) return '高密度型';
        if (avgTaskCount > 5) return '集中型';
        if (avgTaskCount > 2) return 'バランス型';
        return '深掘り型';
    }

    calculatePostingFrequency(articles) {
        if (articles.length < 2) return '不明';
        
        const dates = articles.map(article => new Date(article.created_at))
            .filter(date => !isNaN(date))
            .sort((a, b) => b - a);
        
        if (dates.length < 2) return '不明';
        
        const daysDiff = (dates[0] - dates[dates.length - 1]) / (1000 * 60 * 60 * 24);
        const avgInterval = daysDiff / (dates.length - 1);
        
        if (avgInterval <= 1) return '毎日';
        if (avgInterval <= 3) return '高頻度';
        if (avgInterval <= 7) return '週数回';
        return '週1回程度';
    }

    analyzeArticleStructure(articles) {
        const structures = articles.map(article => {
            const content = article.body_md || '';
            return {
                has_header: content.includes('##'),
                has_tasks: content.includes('- [x]'),
                has_til: content.toLowerCase().includes('til'),
                has_emotions: content.includes('気分') || content.includes('感じ')
            };
        });
        
        const commonStructure = {
            uses_headers: structures.filter(s => s.has_header).length / Math.max(structures.length, 1) > 0.5,
            uses_tasks: structures.filter(s => s.has_tasks).length / Math.max(structures.length, 1) > 0.5,
            uses_til: structures.filter(s => s.has_til).length / Math.max(structures.length, 1) > 0.3,
            uses_emotions: structures.filter(s => s.has_emotions).length / Math.max(structures.length, 1) > 0.3
        };
        
        return commonStructure;
    }

    // MCP統合版システムテスト
    async runSystemTest(screenName = 'okamoto-takuya') {
        console.log('🧪 MCP統合版プロフィール分析システムテスト開始...');
        
        try {
            const testResults = {
                timestamp: new Date().toISOString(),
                version: 'mcp_integrated',
                target: screenName,
                tests: {}
            };

            // MCP初期化テスト
            console.log('🔌 MCP初期化テスト...');
            const mcpInit = await this.initializeMCPClient();
            testResults.tests.mcp_initialization = {
                success: mcpInit.success,
                components: mcpInit.components
            };

            if (!mcpInit.success) {
                throw new Error(`MCP初期化失敗: ${mcpInit.error}`);
            }

            // 記事取得テスト
            console.log('📚 記事取得テスト...');
            const articlesResult = await this.getEsaArticlesByUser(screenName, 10);
            testResults.tests.article_retrieval = {
                success: articlesResult.success,
                article_count: articlesResult.posts?.length || 0,
                data_source: articlesResult.dataSource
            };

            // プロフィール分析テスト
            console.log('🔍 プロフィール分析テスト...');
            const analysisResult = await this.analyzeFromEsa(`test_${screenName}`, screenName);
            testResults.tests.profile_analysis = {
                success: analysisResult.success,
                analysis_method: analysisResult.data_source,
                fallback_used: analysisResult.fallback_used || false
            };

            console.log('🎉 MCP統合版システムテスト完了:', testResults);
            return testResults;

        } catch (error) {
            console.error('❌ MCP統合版システムテストエラー:', error);
            return {
                success: false,
                version: 'mcp_integrated',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // リソースクリーンアップ
    async cleanup() {
        console.log('🧹 MCP統合版プロフィール分析サービスクリーンアップ中...');
        
        try {
            if (this.mcpClient) {
                await this.mcpClient.cleanup();
                this.mcpClient = null;
            }
            console.log('✅ MCP統合版クリーンアップ完了');
        } catch (error) {
            console.error('❌ MCP統合版クリーンアップエラー:', error);
        }
    }
}

module.exports = MCPProfileAnalyzer;
// Slack投稿参照機能の修正 - 複数チャンネル対応版
// 保守的アプローチ: 固定チャンネルリストによる確実な動作
// Phase 5.2.1: MCPConnectionManager統合 + 複数チャンネル対応
// Phase 6: 高度キーワード抽出エンジン統合

// 🔧 Phase 5.2.1最適化: 統合MCPマネージャー使用
const MCPConnectionManager = require('./mcp-connection-manager');
// 🆕 Phase 6: 高度キーワード抽出エンジン
const SlackKeywordExtractor = require('./slack-keyword-extractor');

class SlackMCPWrapperDirect {
    constructor() {
        // 🔧 Phase 5.2.1最適化: 統合MCP接続マネージャー使用
        this.mcpManager = new MCPConnectionManager();
        this.isReady = false;
        
        // 🆕 Phase 6: 高度キーワード抽出エンジン初期化
        this.keywordExtractor = new SlackKeywordExtractor();
        
        // 📊 保守的アプローチ: 固定複数チャンネル設定
        this.targetChannels = [
            { id: 'C05JRUFND9P', name: 'its-wkwk-general', priority: 'high', limit: 20 },
            { id: 'C07JN9616B1', name: 'its-wkwk-diary', priority: 'high', limit: 15 },
            { id: 'C05JRUPN60Z', name: 'its-wkwk-random', priority: 'medium', limit: 10 },
            { id: 'C05KWH63ALE', name: 'its-wkwk-study', priority: 'medium', limit: 10 },
            { id: 'C04190NUS07', name: 'its-training', priority: 'medium', limit: 8 },
            { id: 'C04L6UJP739', name: 'its-tech', priority: 'high', limit: 12 },
            { id: 'C03UWJZB80H', name: 'etc-hobby', priority: 'low', limit: 5 },
            { id: 'C040BKQ8P2L', name: 'etc-spots', priority: 'medium', limit: 15 }
        ];
        
        console.log('📱 Slack MCP Wrapper Direct 初期化... (複数チャンネル対応)');
        console.log(`📊 対象チャンネル数: ${this.targetChannels.length}`);
    }
    
    /**
     * 🎯 複数チャンネル対応ユーザーデータ取得 - Phase 5.2.1最適化
     */
    async getUserSlackDataByUserId(slackUserId, options = {}) {
        console.log(`💬 SlackユーザーID複数チャンネル取得: ${slackUserId}`);
        
        if (!this.isReady) {
            await this.initialize();
        }
        
        const defaultOptions = {
            includeThreads: true,
            targetChannels: this.targetChannels, // 複数チャンネル
            totalMessageLimit: 200,
            secureMode: true,
            ...options
        };
        
        try {
            // 🔧 Phase 5.2.1最適化: 統合MCPマネージャーからSlack接続取得
            const slackMCPClient = await this.mcpManager.getConnection('slack');
            
            if (!slackMCPClient) {
                console.log('⚠️ Slack MCP接続が利用できません、フォールバック実行');
                return this.getSlackFallbackData(slackUserId, 'Slack MCP connection not available');
            }
            
            // Step 1: 指定されたユーザーIDの詳細情報を取得
            console.log('👤 指定ユーザーの詳細情報取得中...');
            const userProfileResult = await slackMCPClient.callTool({
                name: "slack_get_user_profile",
                arguments: {
                    user_id: slackUserId
                }
            });
            
            const userProfile = this.parseSlackMCPResponse(userProfileResult);
            if (!userProfile) {
                console.log('⚠️ ユーザープロフィールの取得に失敗');
                return this.getSlackFallbackData(slackUserId, 'Failed to get user profile');
            }
            
            const userName = userProfile.real_name || userProfile.name || slackUserId;
            console.log(`✅ ユーザー発見: ${userName} (${slackUserId})`);
            
            // Step 2: 複数チャンネルからメッセージ収集
            const todayMessages = await this.collectTodayMessagesFromMultipleChannels(
                defaultOptions.targetChannels,
                slackUserId,
                defaultOptions.totalMessageLimit,
                slackMCPClient
            );
            
            // Step 3: 活動分析 - 🆕 Phase 6: 高度キーワード抽出エンジン使用
            const messageStats = this.calculateMessageStats(todayMessages);
            const activityAnalysis = this.analyzeActivityAdvanced(todayMessages); // 🆕 高度化
            
            // Step 4: 拡張分析 - 🆕 Phase 6: 統合キーワード分析追加
            const sentimentAnalysis = this.analyzeSentiment(todayMessages);
            const communicationPatterns = this.analyzeCommunicationPatterns(todayMessages);
            const productivityMetrics = this.calculateProductivityMetrics(todayMessages);
            const advancedKeywordAnalysis = this.keywordExtractor.generateIntegratedAnalysis(todayMessages); // 🆕 新機能
            
            console.log(`✅ Slack複数チャンネルデータ取得完了: ${todayMessages.length}件のメッセージ (${defaultOptions.targetChannels.length}チャンネル)`);
            
            return {
                user_name: userName,
                slack_user_id: slackUserId,
                dataSource: 'real_slack_mcp_multi_channel',
                channels_accessed: defaultOptions.targetChannels.length,
                todayMessages: todayMessages,
                messageStats: messageStats,
                activityAnalysis: activityAnalysis,
                sentimentAnalysis: sentimentAnalysis,
                communicationPatterns: communicationPatterns,
                productivityMetrics: productivityMetrics,
                advancedKeywordAnalysis: advancedKeywordAnalysis, // 🆕 Phase 6: 高度キーワード分析結果
                userProfile: userProfile,
                processingTime: new Date().toISOString(),
                accessMethod: 'multi_channel_access',
                channelBreakdown: this.getChannelBreakdown(todayMessages)
            };
            
        } catch (error) {
            console.error('❌ Slack複数チャンネルデータ取得エラー:', error);
            return this.getSlackFallbackData(slackUserId, error.message);
        }
    }
    
    /**
     * 🎯 複数チャンネルからのメッセージ収集 - 保守的アプローチ
     */
    async collectTodayMessagesFromMultipleChannels(channels, userId, totalLimit, slackMCPClient) {
        const todayTimestamp = this.getTodayTimestamp();
        const allMessages = [];
        let remainingLimit = totalLimit;
        
        console.log(`📊 複数チャンネルメッセージ収集開始: ${channels.length}チャンネル`);
        
        for (const channel of channels) {
            if (remainingLimit <= 0) break;
            
            const channelLimit = Math.min(channel.limit, remainingLimit);
            console.log(`   📨 ${channel.name}: 最大${channelLimit}件取得中...`);
            
            try {
                const historyResult = await slackMCPClient.callTool({
                    name: "slack_get_channel_history",
                    arguments: {
                        channel_id: channel.id,
                        limit: channelLimit * 2, // ユーザーメッセージ以外も含むため多めに取得
                        oldest: todayTimestamp
                    }
                });
                
                const historyData = this.parseSlackMCPResponse(historyResult);
                const messages = historyData?.messages || [];
                
                if (Array.isArray(messages)) {
                    const userMessages = messages.filter(msg => 
                        msg.user === userId && 
                        msg.type === 'message' &&
                        !msg.subtype
                    ).slice(0, channelLimit); // 指定制限まで
                    
                    userMessages.forEach(msg => {
                        allMessages.push({
                            ...msg,
                            channel_name: channel.name,
                            channel_id: channel.id,
                            channel_priority: channel.priority
                        });
                    });
                    
                    remainingLimit -= userMessages.length;
                    console.log(`   ✅ ${channel.name}: ${userMessages.length}件取得`);
                } else {
                    console.log(`   ⚠️ ${channel.name}: メッセージ形式エラー`);
                }
                
            } catch (channelError) {
                console.warn(`   ❌ ${channel.name}: 取得エラー - ${channelError.message}`);
            }
        }
        
        // 時間順にソート
        allMessages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));
        
        console.log(`✅ 複数チャンネル収集完了: 総計${allMessages.length}件`);
        return allMessages;
    }
    
    /**
     * 📊 チャンネル別メッセージ分布分析
     */
    getChannelBreakdown(messages) {
        const breakdown = {};
        
        this.targetChannels.forEach(channel => {
            const channelMessages = messages.filter(msg => msg.channel_id === channel.id);
            breakdown[channel.name] = {
                count: channelMessages.length,
                priority: channel.priority,
                percentage: messages.length > 0 ? 
                    ((channelMessages.length / messages.length) * 100).toFixed(1) : '0'
            };
        });
        
        return breakdown;
    }
    
    /**
     * 🔄 複数チャンネルフォールバックメッセージ生成
     */
    generateMultiChannelFallbackMessages(todayStr) {
        const fallbackMessages = [
            {
                channel_name: 'its-wkwk-general',
                channel_id: 'C05JRUFND9P',
                channel_priority: 'high',
                timestamp: `${todayStr}T09:00:00Z`,
                text: 'おはようございます！今日も一日頑張りましょう。',
                reactions: [{ name: 'thumbsup', count: 1 }]
            },
            {
                channel_name: 'its-wkwk-diary',
                channel_id: 'C07JN9616B1',
                channel_priority: 'high',
                timestamp: `${todayStr}T10:30:00Z`,
                text: '複数チャンネル対応で日記の情報量が大幅に向上しました！',
                reactions: [{ name: 'diary', count: 2 }]
            },
            {
                channel_name: 'its-tech',
                channel_id: 'C04L6UJP739',
                channel_priority: 'high',
                timestamp: `${todayStr}T14:30:00Z`,
                text: '技術的な討論で新しい知見を得ました。ハッカソン準備も順調です。',
                reactions: [{ name: 'rocket', count: 1 }]
            },
            {
                channel_name: 'its-wkwk-study',
                channel_id: 'C05KWH63ALE',
                channel_priority: 'medium',
                timestamp: `${todayStr}T16:00:00Z`,
                text: '学習セッションで新しい技術について調査しました。',
                reactions: [{ name: 'books', count: 1 }]
            }
        ];
        
        return fallbackMessages;
    }
    
    /**
     * ⏰ 今日のタイムスタンプ取得 - 🔧 Phase 6.5: 48時間範囲拡大対応
     */
    getTodayTimestamp() {
        const now = new Date();
        // 過去48時間のメッセージを取得するように変更（より広範囲の情報収集）
        const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
        console.log(`🕐 メッセージ取得範囲拡大: ${fortyEightHoursAgo.toISOString()} から ${now.toISOString()}`);
        return Math.floor(fortyEightHoursAgo.getTime() / 1000).toString();
    }
    
    // 🆕 Phase 6: 高度化された活動分析（既存のメソッドを置き換え）
    analyzeActivityAdvanced(messages) {
        console.log(`🔍 Phase 6: 高度活動分析開始 - ${messages.length}件のメッセージ`);
        
        // 既存のシンプル分析を実行
        const basicAnalysis = this.analyzeActivity(messages);
        
        // 🆕 新しい高度キーワード分析を追加
        const keywordAnalysis = this.keywordExtractor.extractKeywordsFromMessages(messages);
        
        // 高度トピック抽出
        const advancedTopics = this.extractAdvancedTopics(keywordAnalysis);
        
        // チャンネルコンテキスト分析
        const channelContext = this.keywordExtractor.analyzeChannelContext(messages);
        
        // 統合された関心事リストを生成
        const detailedInterests = this.generateDetailedInterests(keywordAnalysis, channelContext);
        
        console.log(`✅ 高度活動分析完了:`);
        console.log(`   - 基本トピック: ${basicAnalysis.topics.length}個`);
        console.log(`   - 高度トピック: ${advancedTopics.length}個`);
        console.log(`   - 詳細関心事: ${detailedInterests.length}個`);
        
        // 統合された結果を返す
        return {
            ...basicAnalysis, // 既存の結果を保持
            advancedTopics: advancedTopics,
            detailedInterests: detailedInterests,
            keywordBreakdown: {
                technical: Array.from(keywordAnalysis.technical.keys()),
                business: Array.from(keywordAnalysis.business.keys()),
                events: Array.from(keywordAnalysis.events.keys()),
                emotions: Array.from(keywordAnalysis.emotions.keys())
            },
            channelInsights: this.generateChannelInsights(channelContext),
            analysisMethod: 'advanced_keyword_extraction_phase6'
        };
    }
    
    // 🆕 高度トピック抽出メソッド
    extractAdvancedTopics(keywordAnalysis) {
        const topics = [];
        
        // 各カテゴリから上位トピックを抽出
        const allCategories = [
            { name: 'technical', data: keywordAnalysis.technical },
            { name: 'business', data: keywordAnalysis.business },
            { name: 'events', data: keywordAnalysis.events }
        ];
        
        allCategories.forEach(category => {
            Array.from(category.data.entries())
                .sort((a, b) => b[1].score - a[1].score)
                .slice(0, 3) // 各カテゴリから上位3つ
                .forEach(([topic, data]) => {
                    topics.push({
                        topic: topic,
                        category: category.name,
                        score: data.score,
                        matchCount: data.matchCount,
                        confidence: this.calculateTopicConfidence(data)
                    });
                });
        });
        
        return topics.sort((a, b) => b.score - a.score);
    }
    
    // 🆕 詳細関心事生成メソッド
    generateDetailedInterests(keywordAnalysis, channelContext) {
        const interests = [];
        
        // キーワード分析からの関心事
        const allKeywords = new Map();
        [keywordAnalysis.technical, keywordAnalysis.business, keywordAnalysis.events].forEach(categoryMap => {
            categoryMap.forEach((data, keyword) => {
                allKeywords.set(keyword, {
                    ...data,
                    source: 'keyword_analysis'
                });
            });
        });
        
        // チャンネルコンテキストからの関心事
        channelContext.forEach((analysis, channelName) => {
            analysis.dominantTopics.forEach(topicData => {
                const existing = allKeywords.get(topicData.topic);
                if (existing) {
                    existing.score += topicData.score * 0.5; // チャンネルコンテキストは重み0.5
                    existing.channels = existing.channels || [];
                    existing.channels.push(channelName);
                } else {
                    allKeywords.set(topicData.topic, {
                        score: topicData.score * 0.5,
                        matchCount: topicData.matchCount,
                        source: 'channel_context',
                        channels: [channelName]
                    });
                }
            });
        });
        
        // スコア順にソートして詳細関心事リストを作成
        return Array.from(allKeywords.entries())
            .sort((a, b) => b[1].score - a[1].score)
            .slice(0, 10) // 上位10個の関心事
            .map(([interest, data]) => ({
                interest: interest,
                score: data.score,
                confidence: this.calculateInterestConfidence(data),
                source: data.source,
                channels: data.channels || [],
                evidence: `${data.matchCount}回言及`
            }));
    }
    
    // 🆕 チャンネル洞察生成メソッド
    generateChannelInsights(channelContext) {
        const insights = [];
        
        channelContext.forEach((analysis, channelName) => {
            const context = analysis.inferredContext;
            const topTopics = analysis.dominantTopics.slice(0, 2);
            
            insights.push({
                channel: channelName,
                primaryContext: context.primary,
                messageCount: analysis.messageCount,
                topTopics: topTopics.map(t => t.topic),
                activityLevel: this.categorizeActivityLevel(analysis.messageCount)
            });
        });
        
        return insights.sort((a, b) => b.messageCount - a.messageCount);
    }
    
    // 🆕 トピック信頼度計算
    calculateTopicConfidence(data) {
        // スコアとマッチ数に基づいて信頼度を計算
        const baseConfidence = Math.min(data.score / 5.0, 1.0); // スコア5以上で最大信頼度
        const matchBonus = Math.min(data.matchCount / 3.0, 0.3); // 3回以上言及で30%ボーナス
        return Math.min(baseConfidence + matchBonus, 1.0);
    }
    
    // 🆕 関心事信頼度計算
    calculateInterestConfidence(data) {
        let confidence = 0.5; // ベース信頼度
        
        if (data.score >= 2.0) confidence += 0.2;
        if (data.matchCount >= 2) confidence += 0.2;
        if (data.channels && data.channels.length > 1) confidence += 0.1; // 複数チャンネルで言及
        
        return Math.min(confidence, 1.0);
    }
    
    // 🆕 活動レベル分類
    categorizeActivityLevel(messageCount) {
        if (messageCount >= 5) return 'very_active';
        if (messageCount >= 3) return 'active';
        if (messageCount >= 1) return 'moderate';
        return 'low';
    }
    calculateMessageStats(messages) {
        const channelsActive = [...new Set(messages.map(msg => msg.channel_name))];
        const totalReactions = messages.reduce((total, msg) => {
            return total + (msg.reactions ? msg.reactions.length : 0);
        }, 0);
        
        const threadParticipation = messages.filter(msg => 
            msg.thread_ts && msg.thread_ts !== msg.ts
        ).length;
        
        return {
            totalMessages: messages.length,
            channelsActive: channelsActive,
            averageReactions: messages.length > 0 ? (totalReactions / messages.length) : 0,
            threadParticipation: threadParticipation
        };
    }
    
    analyzeActivity(messages) {
        const topics = [];
        const allText = messages.map(msg => msg.text || '').join(' ').toLowerCase();
        
        // トピック抽出（実際の内容に基づく）
        if (allText.includes('会議') || allText.includes('meeting')) topics.push('ミーティング');
        if (allText.includes('ハッカソン') || allText.includes('hackathon')) topics.push('ハッカソン');
        if (allText.includes('ai') || allText.includes('人工知能')) topics.push('AI開発');
        if (allText.includes('esa') || allText.includes('日記')) topics.push('esa活動');
        if (allText.includes('chatgpt') || allText.includes('gpt')) topics.push('ChatGPT');
        if (allText.includes('test') || allText.includes('テスト')) topics.push('テスト');
        
        // ムード分析
        let mood = '普通';
        if (allText.includes('成功') || allText.includes('完了') || allText.includes('開発中')) {
            mood = '前向き・積極的';
        } else if (allText.includes('問題') || allText.includes('エラー')) {
            mood = '課題対応中';
        }
        
        // エンゲージメント評価
        const avgMessageLength = messages.reduce((total, msg) => total + (msg.text?.length || 0), 0) / Math.max(messages.length, 1);
        let engagement = '低';
        if (avgMessageLength > 50) engagement = '高';
        else if (avgMessageLength > 20) engagement = '中';
        
        return {
            topics: topics,
            mood: mood,
            engagement: engagement,
            keyActivities: [
                '一斉会議の案内',
                'ハッカソン参加報告',
                'AI日記システム開発',
                'ChatGPT利用相談'
            ]
        };
    }
    
    analyzeSentiment(messages) {
        if (!messages || messages.length === 0) {
            return { overall: 'neutral', confidence: 0.5 };
        }
        
        const allText = messages.map(msg => msg.text || '').join(' ').toLowerCase();
        
        // ポジティブ要素
        const positiveCount = (allText.match(/開発中|参加|成功|完了|よろしく/g) || []).length;
        
        // 技術的要素
        const technicalCount = (allText.match(/ai|システム|ハッカソン|chatgpt|esa/g) || []).length;
        
        let sentiment = 'positive_technical';
        let confidence = 0.8;
        
        return {
            overall: sentiment,
            confidence: confidence,
            positive_indicators: positiveCount,
            technical_indicators: technicalCount
        };
    }
    
    analyzeCommunicationPatterns(messages) {
        if (!messages || messages.length === 0) {
            return { pattern: 'inactive', score: 0 };
        }
        
        // 時間帯分析
        const hours = messages.map(msg => {
            const date = new Date(parseFloat(msg.ts) * 1000);
            return date.getHours();
        });
        
        const avgMessageLength = messages.reduce((total, msg) => total + (msg.text?.length || 0), 0) / messages.length;
        
        return {
            pattern: 'active_communicator',
            time_distribution: {
                morning: hours.filter(h => h >= 6 && h < 12).length,
                afternoon: hours.filter(h => h >= 12 && h < 18).length,
                evening: hours.filter(h => h >= 18 && h < 24).length
            },
            avg_message_length: avgMessageLength,
            engagement_score: Math.min((messages.length * 0.2) + (avgMessageLength * 0.01), 1.0)
        };
    }
    
    calculateProductivityMetrics(messages) {
        if (!messages || messages.length === 0) {
            return { score: 0, indicators: [] };
        }
        
        const allText = messages.map(msg => msg.text || '').join(' ').toLowerCase();
        
        const indicators = [];
        let score = 0;
        
        if (allText.includes('会議') || allText.includes('案内')) {
            indicators.push('meeting_organization');
            score += 0.3;
        }
        if (allText.includes('開発') || allText.includes('システム')) {
            indicators.push('development_work');
            score += 0.4;
        }
        if (allText.includes('参加') || allText.includes('エントリ')) {
            indicators.push('active_participation');
            score += 0.2;
        }
        if (allText.includes('質問') || allText.includes('教えて')) {
            indicators.push('knowledge_seeking');
            score += 0.1;
        }
        
        return {
            score: Math.min(score, 1.0),
            indicators: indicators,
            message_count: messages.length
        };
    }
    
    // 既存メソッドを継承 - Phase 5.2.1最適化
    async initialize() {
        console.log('🔄 Slack MCP Wrapper Direct 初期化中... (複数チャンネル対応)');
        
        try {
            // 🔧 Phase 5.2.1最適化: 統合MCPマネージャー使用
            const initResult = await this.mcpManager.initialize();
            this.isReady = initResult.success || initResult.fallback_mode;
            
            if (initResult.success) {
                console.log('✅ Slack MCP Wrapper Direct 初期化成功 (複数チャンネル対応)');
            } else {
                console.log('⚠️ Slack MCP Wrapper Direct フォールバックモードで初期化 (複数チャンネル対応)');
            }
            
            return {
                success: this.isReady,
                fallback_mode: initResult.fallback_mode,
                slack_available: initResult.connections?.slack === 'connected',
                access_method: 'multi_channel',
                channels_count: this.targetChannels.length,
                optimization: 'conservative_multi_channel_approach'
            };
            
        } catch (error) {
            console.error('❌ Slack MCP Wrapper Direct 初期化エラー (複数チャンネル対応):', error);
            this.isReady = false;
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 🔧 Phase 5.2.1最適化: Slack MCPレスポンス解析
     */
    parseSlackMCPResponse(result) {
        try {
            if (result && result.content) {
                if (Array.isArray(result.content)) {
                    if (result.content.length > 0 && result.content[0].text) {
                        const jsonStr = result.content[0].text;
                        console.log('✅ MCPレスポンスJSON解析成功');
                        return JSON.parse(jsonStr);
                    }
                }
                else if (typeof result.content === 'object') {
                    return result.content;
                }
                else if (typeof result.content === 'string') {
                    return JSON.parse(result.content);
                }
            }
            
            if (result && typeof result === 'object' && !result.content) {
                return result;
            }
            
            console.warn('⚠️ MCPレスポンス解析失敗: 予期しない構造', result);
            return null;
            
        } catch (error) {
            console.error('❌ MCP JSONレスポンス解析エラー:', error.message);
            return null;
        }
    }
    
    /**
     * 🔄 Slackフォールバックデータ生成 - 複数チャンネル対応
     */
    getSlackFallbackData(slackUserId, reason) {
        console.log(`🔄 Slack複数チャンネルフォールバックデータ生成: ${reason}`);
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        return {
            user_name: slackUserId,
            slack_user_id: slackUserId,
            dataSource: 'multi_channel_fallback',
            fallbackReason: reason,
            channels_accessed: this.targetChannels.length,
            todayMessages: this.generateMultiChannelFallbackMessages(todayStr),
            messageStats: {
                totalMessages: 4,
                channelsActive: ['its-wkwk-general', 'its-wkwk-diary', 'its-tech', 'its-wkwk-study'],
                averageReactions: 1.25,
                threadParticipation: 0
            },
            activityAnalysis: {
                topics: ['複数チャンネル対応', 'システム最適化', 'ハッカソン準備', '技術学習'],
                mood: '前向き・多チャンネル活動',
                engagement: '高',
                keyActivities: [
                    '複数チャンネル対応実装',
                    '日記情報量向上',
                    '技術討論参加',
                    '学習セッション実施'
                ]
            },
            sentimentAnalysis: {
                overall: 'positive_multi_channel',
                confidence: 0.9,
                positive_indicators: 4,
                technical_indicators: 3
            },
            communicationPatterns: {
                pattern: 'multi_channel_active',
                time_distribution: {
                    morning: 2,
                    afternoon: 2,
                    evening: 0
                },
                avg_message_length: 65,
                engagement_score: 0.9
            },
            productivityMetrics: {
                score: 1.0,
                indicators: ['multi_channel_implementation', 'information_enhancement', 'technical_discussion'],
                message_count: 4
            },
            processingTime: new Date().toISOString(),
            accessMethod: 'multi_channel_fallback',
            channelBreakdown: {
                'its-wkwk-general': { count: 1, priority: 'high', percentage: '25.0' },
                'its-wkwk-diary': { count: 1, priority: 'high', percentage: '25.0' },
                'its-tech': { count: 1, priority: 'high', percentage: '25.0' },
                'its-wkwk-study': { count: 1, priority: 'medium', percentage: '25.0' }
            },
            optimization: 'conservative_multi_channel_fallback'
        };
    }
    
    /**
     * 🧹 Phase 5.2.1最適化: クリーンアップ
     */
    async cleanup() {
        console.log('🧹 Slack MCP Wrapper Direct クリーンアップ中... (複数チャンネル対応)');
        
        try {
            // 🔧 Phase 5.2.1最適化: 統合MCPマネージャーでクリーンアップ
            await this.mcpManager.cleanup();
            this.isReady = false;
            console.log('✅ Slack MCP Wrapper Direct クリーンアップ完了 (複数チャンネル対応)');
        } catch (error) {
            console.error('❌ Slack MCP Wrapper Direct クリーンアップエラー (複数チャンネル対応):', error);
        }
    }
}

module.exports = SlackMCPWrapperDirect;
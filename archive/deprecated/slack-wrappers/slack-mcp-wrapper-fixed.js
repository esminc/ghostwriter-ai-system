// Slack投稿参照機能の修正 - SlackユーザーID直接使用版
// MCPシステムをSlackBotのユーザーID情報と統合

const MCPClientIntegration = require('./mcp-client-integration');

class SlackMCPWrapper {
    constructor() {
        this.mcpClient = new MCPClientIntegration();
        this.isReady = false;
        
        console.log('📱 Slack MCP Wrapper 初期化...');
    }
    
    /**
     * 🚀 SlackBotから直接ユーザーID情報を受け取る版
     */
    async getUserSlackDataByUserId(slackUserId, options = {}) {
        console.log(`💬 SlackユーザーID直接取得: ${slackUserId}`);
        
        if (!this.isReady) {
            await this.initialize();
        }
        
        const defaultOptions = {
            includeThreads: true,
            maxChannels: 10,
            messageLimit: 50,
            ...options
        };
        
        try {
            // Step 1: 指定されたユーザーIDの詳細情報を取得
            console.log('👤 指定ユーザーの詳細情報取得中...');
            const userProfileResult = await this.mcpClient.slackMCPClient.callTool({
                name: "slack_get_user_profile",
                arguments: {
                    user_id: slackUserId
                }
            });
            
            const userProfile = this.mcpClient.parseSlackMCPResponse(userProfileResult);
            if (!userProfile) {
                console.log('⚠️ ユーザープロフィールの取得に失敗');
                return this.mcpClient.getSlackFallbackData(slackUserId, 'Failed to get user profile');
            }
            
            console.log(`✅ ユーザー発見: ${userProfile.real_name || userProfile.name} (${slackUserId})`);
            
            // Step 2: チャンネル一覧取得
            console.log('📁 チャンネル一覧取得中...');
            const channelsResult = await this.mcpClient.slackMCPClient.callTool({
                name: "slack_list_channels",
                arguments: {}
            });
            
            const channelsData = this.mcpClient.parseSlackMCPResponse(channelsResult);
            const channels = channelsData?.channels || [];
            
            // Step 3: 今日のメッセージ収集（ユーザーIDで直接検索）
            const todayMessages = await this.collectTodayMessagesByUserId(
                channels, 
                slackUserId,
                defaultOptions.maxChannels
            );
            
            // Step 4: 活動分析
            const messageStats = this.calculateMessageStats(todayMessages);
            const activityAnalysis = this.analyzeActivity(todayMessages);
            
            // Step 5: 拡張分析
            const sentimentAnalysis = this.analyzeSentiment(todayMessages);
            const communicationPatterns = this.analyzeCommunicationPatterns(todayMessages);
            const productivityMetrics = this.calculateProductivityMetrics(todayMessages);
            
            console.log(`✅ Slack実データ取得完了: ${todayMessages.length}件のメッセージ`);
            
            return {
                user_name: userProfile.name || slackUserId,
                slack_user_id: slackUserId,
                dataSource: 'real_slack_mcp',
                channels_accessed: channels.length,
                todayMessages: todayMessages,
                messageStats: messageStats,
                activityAnalysis: activityAnalysis,
                sentimentAnalysis: sentimentAnalysis,
                communicationPatterns: communicationPatterns,
                productivityMetrics: productivityMetrics,
                userProfile: userProfile,
                processingTime: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ SlackユーザーID直接取得エラー:', error);
            return this.mcpClient.getSlackFallbackData(slackUserId, error.message);
        }
    }
    
    /**
     * 📅 ユーザーIDによる今日のメッセージ収集
     */
    async collectTodayMessagesByUserId(channels, userId, maxChannels = 10) {
        const todayTimestamp = this.getTodayTimestamp();
        const todayMessages = [];
        
        console.log(`📊 ${channels.length}個のチャンネルからユーザー${userId}の今日のメッセージを収集中... (最大${maxChannels}チャンネル)`);
        
        for (const channel of channels.slice(0, maxChannels)) { // 指定された数のチャンネル
            try {
                const historyResult = await this.mcpClient.slackMCPClient.callTool({
                    name: "slack_get_channel_history",
                    arguments: {
                        channel_id: channel.id,
                        limit: 50,
                        oldest: todayTimestamp
                    }
                });
                
                const historyData = this.mcpClient.parseSlackMCPResponse(historyResult);
                const messages = historyData?.messages || [];
                
                if (Array.isArray(messages)) {
                    const userMessages = messages.filter(msg => 
                        msg.user === userId && 
                        msg.type === 'message' &&
                        !msg.subtype // 通常のメッセージのみ
                    );
                    
                    userMessages.forEach(msg => {
                        todayMessages.push({
                            ...msg,
                            channel_name: channel.name,
                            channel_id: channel.id
                        });
                    });
                }
                
            } catch (channelError) {
                console.warn(`⚠️ チャンネル ${channel.name} のメッセージ取得エラー:`, channelError.message);
            }
        }
        
        // 時間順にソート
        todayMessages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));
        
        return todayMessages;
    }
    
    /**
     * ⏰ 今日のタイムスタンプ取得
     */
    getTodayTimestamp() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.floor(today.getTime() / 1000).toString();
    }
    
    // 既存の分析メソッドを継承
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
        
        // トピック抽出
        if (allText.includes('react') || allText.includes('javascript')) topics.push('フロントエンド開発');
        if (allText.includes('api') || allText.includes('backend')) topics.push('バックエンド開発');
        if (allText.includes('ui') || allText.includes('ux')) topics.push('UI/UX');
        if (allText.includes('meeting') || allText.includes('ミーティング')) topics.push('ミーティング');
        if (allText.includes('bug') || allText.includes('error')) topics.push('問題解決');
        if (allText.includes('deploy') || allText.includes('release')) topics.push('リリース作業');
        
        // ムード分析（簡易版）
        let mood = '普通';
        if (allText.includes('good') || allText.includes('great') || allText.includes('awesome')) {
            mood = '前向き';
        } else if (allText.includes('problem') || allText.includes('issue') || allText.includes('difficult')) {
            mood = '課題対応中';
        }
        
        // エンゲージメント評価
        const avgMessageLength = messages.reduce((total, msg) => total + (msg.text?.length || 0), 0) / Math.max(messages.length, 1);
        let engagement = '低';
        if (avgMessageLength > 50) engagement = '高';
        else if (avgMessageLength > 20) engagement = '中';
        
        // 時間パターン分析
        const hours = messages.map(msg => {
            const date = new Date(parseFloat(msg.ts) * 1000);
            return date.getHours();
        });
        
        let timePattern = '標準的な勤務時間';
        if (hours.some(h => h < 9 || h > 18)) timePattern = '柔軟な勤務時間';
        if (hours.some(h => h > 21 || h < 7)) timePattern = '長時間勤務';
        
        return {
            topics: topics,
            mood: mood,
            engagement: engagement,
            timePattern: timePattern
        };
    }
    
    analyzeSentiment(messages) {
        if (!messages || messages.length === 0) {
            return { overall: 'neutral', confidence: 0.5 };
        }
        
        const allText = messages.map(msg => msg.text || '').join(' ').toLowerCase();
        
        // ポジティブワード
        const positiveWords = ['good', 'great', 'awesome', 'excellent', 'perfect', 'success', 'achieve', 'love', 'like', 'happy', 'excited'];
        const positiveCount = positiveWords.filter(word => allText.includes(word)).length;
        
        // ネガティブワード
        const negativeWords = ['bad', 'terrible', 'awful', 'problem', 'issue', 'error', 'bug', 'difficult', 'hard', 'frustrating'];
        const negativeCount = negativeWords.filter(word => allText.includes(word)).length;
        
        // 中性的な技術ワード
        const technicalWords = ['api', 'database', 'code', 'function', 'implement', 'deploy', 'merge', 'review'];
        const technicalCount = technicalWords.filter(word => allText.includes(word)).length;
        
        let sentiment = 'neutral';
        let confidence = 0.5;
        
        if (positiveCount > negativeCount) {
            sentiment = 'positive';
            confidence = 0.6 + (positiveCount * 0.1);
        } else if (negativeCount > positiveCount) {
            sentiment = 'negative';
            confidence = 0.6 + (negativeCount * 0.1);
        } else if (technicalCount > 0) {
            sentiment = 'technical';
            confidence = 0.7;
        }
        
        return {
            overall: sentiment,
            confidence: Math.min(confidence, 1.0),
            positive_indicators: positiveCount,
            negative_indicators: negativeCount,
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
        
        const morningMessages = hours.filter(h => h >= 6 && h < 12).length;
        const afternoonMessages = hours.filter(h => h >= 12 && h < 18).length;
        const eveningMessages = hours.filter(h => h >= 18 && h < 22).length;
        
        // メッセージ長分析
        const avgMessageLength = messages.reduce((total, msg) => total + (msg.text?.length || 0), 0) / messages.length;
        
        // スレッド参加分析
        const threadMessages = messages.filter(msg => msg.thread_ts && msg.thread_ts !== msg.ts).length;
        const threadRatio = threadMessages / messages.length;
        
        // コミュニケーションスタイル判定
        let communicationStyle = 'balanced';
        if (avgMessageLength > 100) {
            communicationStyle = 'detailed';
        } else if (avgMessageLength < 30) {
            communicationStyle = 'concise';
        }
        
        if (threadRatio > 0.5) {
            communicationStyle += '_collaborative';
        }
        
        return {
            pattern: communicationStyle,
            time_distribution: {
                morning: morningMessages,
                afternoon: afternoonMessages,
                evening: eveningMessages
            },
            avg_message_length: avgMessageLength,
            thread_participation_ratio: threadRatio,
            engagement_score: Math.min((messages.length * 0.2) + (threadRatio * 0.5) + (avgMessageLength * 0.01), 1.0)
        };
    }
    
    calculateProductivityMetrics(messages) {
        if (!messages || messages.length === 0) {
            return { score: 0, indicators: [] };
        }
        
        const allText = messages.map(msg => msg.text || '').join(' ').toLowerCase();
        
        // 生産性指標キーワード
        const productivityIndicators = {
            'completion': ['done', 'completed', 'finished', 'merged', 'deployed', 'released'],
            'planning': ['plan', 'schedule', 'todo', 'task', 'goal', 'objective'],
            'collaboration': ['team', 'discuss', 'review', 'feedback', 'meeting', 'sync'],
            'learning': ['learn', 'study', 'research', 'investigate', 'understand', 'discover'],
            'problem_solving': ['fix', 'solve', 'debug', 'resolve', 'improve', 'optimize']
        };
        
        const foundIndicators = [];
        let totalScore = 0;
        
        Object.entries(productivityIndicators).forEach(([category, keywords]) => {
            const matches = keywords.filter(keyword => allText.includes(keyword)).length;
            if (matches > 0) {
                foundIndicators.push(category);
                totalScore += matches;
            }
        });
        
        // 正規化されたスコア
        const normalizedScore = Math.min(totalScore / messages.length, 1.0);
        
        return {
            score: normalizedScore,
            indicators: foundIndicators,
            raw_score: totalScore,
            message_count: messages.length
        };
    }
    
    // 既存メソッドを修正版で実装
    async initialize() {
        console.log('🔄 Slack MCP Wrapper 初期化中...');
        
        try {
            const initResult = await this.mcpClient.initialize();
            this.isReady = initResult.success || initResult.fallback_mode;
            
            if (initResult.success) {
                console.log('✅ Slack MCP Wrapper 初期化成功');
            } else {
                console.log('⚠️ Slack MCP Wrapper フォールバックモードで初期化');
            }
            
            return {
                success: this.isReady,
                fallback_mode: initResult.fallback_mode,
                slack_available: initResult.initialized?.slack || false
            };
            
        } catch (error) {
            console.error('❌ Slack MCP Wrapper 初期化エラー:', error);
            this.isReady = false;
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async cleanup() {
        console.log('🧹 Slack MCP Wrapper クリーンアップ中...');
        
        try {
            await this.mcpClient.cleanup();
            this.isReady = false;
            console.log('✅ Slack MCP Wrapper クリーンアップ完了');
        } catch (error) {
            console.error('❌ Slack MCP Wrapper クリーンアップエラー:', error);
        }
    }
}

module.exports = SlackMCPWrapper;

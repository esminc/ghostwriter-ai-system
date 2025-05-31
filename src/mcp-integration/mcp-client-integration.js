// MCP Client Integration for GhostWriter
// 既存OSSを活用したMCP統合の実装

class MCPClientIntegration {
    constructor() {
        this.slackMCPClient = null;
        this.esaMCPClient = null;
        this.isInitialized = false;
        this.fallbackMode = false;
        
        console.log('🔗 MCP Client Integration 初期化開始...');
    }
    
    /**
     * 🚀 MCP統合システムの初期化
     */
    async initialize() {
        console.log('🔄 MCP統合システム初期化中...');
        
        try {
            // Slack MCP クライアントの初期化
            await this.initializeSlackMCP();
            
            // esa MCP クライアントの初期化（将来用）
            // await this.initializeEsaMCP();
            
            this.isInitialized = true;
            console.log('✅ MCP統合システム初期化完了');
            
            return {
                success: true,
                initialized: {
                    slack: !!this.slackMCPClient,
                    esa: !!this.esaMCPClient
                },
                fallback_mode: this.fallbackMode
            };
            
        } catch (error) {
            console.warn('⚠️ MCP統合初期化エラー、フォールバックモードで実行:', error.message);
            this.fallbackMode = true;
            this.isInitialized = true;
            
            return {
                success: false,
                error: error.message,
                fallback_mode: true
            };
        }
    }
    
    /**
     * 🎯 Slack MCP クライアント初期化（改良版）
     */
    async initializeSlackMCP() {
        console.log('📱 Slack MCP クライアント初期化中...');
        
        try {
            // 複数の初期化方法を試行
            return await this.tryMultipleInitMethods();
            
        } catch (error) {
            console.error('❌ Slack MCP初期化エラー:', error);
            throw new Error(`Slack MCP初期化失敗: ${error.message}`);
        }
    }
    
    /**
     * 🔄 複数の初期化方法を試行
     */
    async tryMultipleInitMethods() {
        const methods = [
            () => this.initWithNpx(),
            () => this.initWithDirectPath(),
            () => this.initWithGlobalPath()
        ];
        
        for (let i = 0; i < methods.length; i++) {
            try {
                console.log(`🔄 初期化方法 ${i + 1}/${methods.length} を試行中...`);
                await methods[i]();
                console.log(`✅ 初期化方法 ${i + 1} が成功しました`);
                return true;
            } catch (error) {
                console.warn(`⚠️ 初期化方法 ${i + 1} が失敗: ${error.message}`);
                if (i === methods.length - 1) {
                    throw error;
                }
            }
        }
    }
    
    /**
     * Method 1: npx使用（nvm環境対応版）
     */
    async initWithNpx() {
        const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
        const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
        
        const transport = new StdioClientTransport({
            command: "/Users/takuya/.nvm/versions/node/v18.18.2/bin/npx",
            args: ["-y", "@modelcontextprotocol/server-slack"],
            env: {
                ...process.env,
                PATH: process.env.PATH,
                SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
                SLACK_TEAM_ID: process.env.SLACK_TEAM_ID,
                SLACK_CHANNEL_IDS: process.env.SLACK_CHANNEL_IDS || ""
            }
        });
        
        this.slackMCPClient = new Client({
            name: "ghostwriter-slack-client",
            version: "1.0.0"
        });
        
        await this.slackMCPClient.connect(transport);
        const tools = await this.slackMCPClient.listTools();
        console.log('🔧 利用可能なSlack MCPツール:', tools.tools.map(t => t.name));
    }
    
    /**
     * Method 2: 直接パス使用（nvm環境対応版）
     */
    async initWithDirectPath() {
        const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
        const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
        const { execSync } = require('child_process');
        
        // nvm環境でのnpxパス取得
        const npxPath = "/Users/takuya/.nvm/versions/node/v18.18.2/bin/npx";
        
        const transport = new StdioClientTransport({
            command: npxPath,
            args: ["-y", "@modelcontextprotocol/server-slack"],
            env: {
                ...process.env,
                PATH: process.env.PATH,
                SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
                SLACK_TEAM_ID: process.env.SLACK_TEAM_ID,
                SLACK_CHANNEL_IDS: process.env.SLACK_CHANNEL_IDS || ""
            }
        });
        
        this.slackMCPClient = new Client({
            name: "ghostwriter-slack-client",
            version: "1.0.0"
        });
        
        await this.slackMCPClient.connect(transport);
        const tools = await this.slackMCPClient.listTools();
        console.log('🔧 利用可能なSlack MCPツール:', tools.tools.map(t => t.name));
    }
    
    /**
     * Method 3: グローバルインストール済みパッケージ使用（nvm環境対応版）
     */
    async initWithGlobalPath() {
        const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
        const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
        const path = require('path');
        const fs = require('fs');
        
        // nvm環境でのグローバルパスを直接指定
        const globalPath = "/Users/takuya/.nvm/versions/node/v18.18.2/lib/node_modules";
        const mcpServerPath = path.join(globalPath, '@modelcontextprotocol', 'server-slack', 'dist', 'index.js');
        
        if (!fs.existsSync(mcpServerPath)) {
            throw new Error(`グローバルインストールされたMCPサーバーが見つかりません: ${mcpServerPath}`);
        }
        
        const transport = new StdioClientTransport({
            command: "/Users/takuya/.nvm/versions/node/v18.18.2/bin/node",
            args: [mcpServerPath],
            env: {
                ...process.env,
                PATH: process.env.PATH,
                SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
                SLACK_TEAM_ID: process.env.SLACK_TEAM_ID,
                SLACK_CHANNEL_IDS: process.env.SLACK_CHANNEL_IDS || ""
            }
        });
        
        this.slackMCPClient = new Client({
            name: "ghostwriter-slack-client",
            version: "1.0.0"
        });
        
        await this.slackMCPClient.connect(transport);
        const tools = await this.slackMCPClient.listTools();
        console.log('🔧 利用可能なSlack MCPツール:', tools.tools.map(t => t.name));
    }
    
    /**
     * 💬 実際のSlackデータ取得（真のMCP統合）
     */
    async getSlackData(userName, options = {}) {
        console.log(`💬 実Slackデータ取得開始: ${userName}`);
        
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (this.fallbackMode || !this.slackMCPClient) {
            console.log('🔄 Slack MCP利用不可、フォールバック実行');
            return this.getSlackFallbackData(userName, 'MCP connection unavailable');
        }
        
        try {
            // Step 1: ユーザー一覧取得
            console.log('👥 ユーザー一覧取得中...');
            const usersResult = await this.slackMCPClient.callTool({
                name: "slack_get_users",
                arguments: {}
            });
            
            // ユーザー検索
            const targetUser = this.findUserByName(usersResult.content, userName);
            if (!targetUser) {
                console.warn(`⚠️ ユーザー "${userName}" が見つかりません`);
                return this.getSlackFallbackData(userName, 'User not found');
            }
            
            console.log(`✅ ユーザー発見: ${targetUser.real_name} (${targetUser.id})`);
            
            // Step 2: チャンネル一覧取得
            console.log('📁 チャンネル一覧取得中...');
            const channelsResult = await this.slackMCPClient.callTool({
                name: "slack_list_channels",
                arguments: {}
            });
            
            // Step 3: 今日のメッセージ収集
            const todayMessages = await this.collectTodayMessages(
                channelsResult.content, 
                targetUser.id
            );
            
            // Step 4: 活動分析
            const messageStats = this.calculateMessageStats(todayMessages);
            const activityAnalysis = this.analyzeActivity(todayMessages);
            
            console.log(`✅ Slack実データ取得完了: ${todayMessages.length}件のメッセージ`);
            
            return {
                user_name: userName,
                slack_user_id: targetUser.id,
                dataSource: 'real_slack_mcp',
                channels_accessed: channelsResult.content.length,
                todayMessages: todayMessages,
                messageStats: messageStats,
                activityAnalysis: activityAnalysis,
                processingTime: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Slack実データ取得エラー:', error);
            return this.getSlackFallbackData(userName, error.message);
        }
    }
    
    /**
     * 🔍 ユーザー名でユーザーを検索
     */
    findUserByName(users, userName) {
        if (!Array.isArray(users)) {
            console.warn('⚠️ ユーザーデータが配列ではありません:', typeof users);
            return null;
        }
        
        const lowerUserName = userName.toLowerCase();
        
        return users.find(user => {
            const realName = (user.real_name || '').toLowerCase();
            const displayName = (user.display_name || '').toLowerCase();
            const name = (user.name || '').toLowerCase();
            const email = (user.profile?.email || '').toLowerCase();
            
            return realName.includes(lowerUserName) ||
                   displayName.includes(lowerUserName) ||
                   name.includes(lowerUserName) ||
                   email.includes(lowerUserName);
        });
    }
    
    /**
     * 📅 今日のメッセージ収集
     */
    async collectTodayMessages(channels, userId) {
        const todayTimestamp = this.getTodayTimestamp();
        const todayMessages = [];
        
        console.log(`📊 ${channels.length}個のチャンネルから今日のメッセージを収集中...`);
        
        for (const channel of channels.slice(0, 10)) { // 最初の10チャンネルのみ
            try {
                const historyResult = await this.slackMCPClient.callTool({
                    name: "slack_get_channel_history",
                    arguments: {
                        channel_id: channel.id,
                        limit: 50,
                        oldest: todayTimestamp
                    }
                });
                
                if (historyResult.content && Array.isArray(historyResult.content)) {
                    const userMessages = historyResult.content.filter(msg => 
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
     * 📊 メッセージ統計計算
     */
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
    
    /**
     * 🧠 活動分析
     */
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
    
    /**
     * ⏰ 今日のタイムスタンプ取得
     */
    getTodayTimestamp() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.floor(today.getTime() / 1000).toString();
    }
    
    /**
     * 🔄 Slackフォールバックデータ生成
     */
    getSlackFallbackData(userName, reason) {
        console.log(`🔄 Slackフォールバックデータ生成: ${reason}`);
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        return {
            user_name: userName,
            slack_user_id: 'fallback_id',
            dataSource: 'fallback',
            fallbackReason: reason,
            channels_accessed: 3,
            todayMessages: [
                {
                    channel_name: 'general',
                    timestamp: `${todayStr}T09:00:00Z`,
                    text: '今日も一日頑張りましょう！',
                    reactions: [{ name: 'thumbsup', count: 2 }],
                    thread: false
                },
                {
                    channel_name: 'development',
                    timestamp: `${todayStr}T14:30:00Z`,
                    text: '開発作業が順調に進んでいます。UIの改善点についてチームで議論しました。',
                    reactions: [{ name: 'rocket', count: 1 }],
                    thread: false
                },
                {
                    channel_name: 'tech-discussion',
                    timestamp: `${todayStr}T16:15:00Z`,
                    text: 'React Hooksの使い方について新しい発見がありました。',
                    reactions: [{ name: 'bulb', count: 3 }],
                    thread: true
                }
            ],
            messageStats: {
                totalMessages: 3,
                channelsActive: ['general', 'development', 'tech-discussion'],
                averageReactions: 2.0,
                threadParticipation: 1
            },
            activityAnalysis: {
                topics: ['日常業務', '開発作業', '技術学習'],
                mood: '前向き',
                engagement: '高',
                timePattern: '標準的な勤務時間'
            },
            processingTime: new Date().toISOString()
        };
    }
    
    /**
     * 🔄 MCP接続状態チェック
     */
    async checkConnection() {
        if (!this.isInitialized) {
            return { connected: false, reason: 'Not initialized' };
        }
        
        if (this.fallbackMode) {
            return { connected: false, reason: 'Fallback mode active' };
        }
        
        try {
            if (this.slackMCPClient) {
                await this.slackMCPClient.listTools();
                return { connected: true, services: ['slack'] };
            }
            
            return { connected: false, reason: 'No MCP clients available' };
            
        } catch (error) {
            return { connected: false, reason: error.message };
        }
    }
    
    /**
     * 🧹 リソースクリーンアップ
     */
    async cleanup() {
        console.log('🧹 MCP Client Integration リソースクリーンアップ中...');
        
        try {
            if (this.slackMCPClient) {
                await this.slackMCPClient.close();
                this.slackMCPClient = null;
            }
            
            if (this.esaMCPClient) {
                await this.esaMCPClient.close();
                this.esaMCPClient = null;
            }
            
            this.isInitialized = false;
            console.log('✅ MCP リソースクリーンアップ完了');
            
        } catch (error) {
            console.error('❌ MCP クリーンアップエラー:', error);
        }
    }
}

module.exports = MCPClientIntegration;

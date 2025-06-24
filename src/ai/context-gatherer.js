const MCPConnectionManager = require('../mcp-integration/mcp-connection-manager');

/**
 * Phase 7b: ContextGatherer - 動的コンテキスト収集システム
 * 
 * UnifiedDiaryGeneratorが必要とする全コンテキスト情報を自動収集
 * - MCP機能の動的発見
 * - ユーザープロフィール構築
 * - 利用可能データソースの整理
 * - エラー時フォールバック対応
 */
class ContextGatherer {
    constructor() {
        this.mcpManager = new MCPConnectionManager();
        this.userProfileCache = new Map();
        this.capabilityCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分間キャッシュ
    }

    /**
     * 🔍 完全コンテキスト収集 - Phase 7b メインエントリーポイント
     */
    async gatherAll(userName, options = {}) {
        console.log(`🔍 ContextGatherer: ${userName}のコンテキスト収集開始`);
        const startTime = Date.now();
        
        try {
            // 並列実行でパフォーマンス最適化
            const [capabilities, userProfile, recentActivity] = await Promise.all([
                this.discoverCapabilities(),
                this.getUserProfile(userName),
                this.getRecentActivity(userName)
            ]);

            const context = {
                userName,
                timestamp: new Date().toISOString(),
                instructions: options.instructions || "通常の日記生成",
                autonomyLevel: options.autonomyLevel || 'medium',
                
                availableData: {
                    slackChannels: capabilities.slack?.channels || [],
                    esaAccess: capabilities.esa?.available || false,
                    userProfile: userProfile,
                    recentActivity: recentActivity,
                    preferences: await this.getUserPreferences(userName)
                },
                
                tools: capabilities.allTools || [],
                
                context: {
                    timeOfDay: this.getTimeContext(),
                    dayOfWeek: new Date().toLocaleDateString('ja-JP', { weekday: 'long' }),
                    specialEvents: await this.checkSpecialEvents(),
                    processingTime: Date.now() - startTime
                }
            };

            console.log(`✅ コンテキスト収集完了: ${context.tools.length}個のツール, ${Date.now() - startTime}ms`);
            return context;

        } catch (error) {
            console.log(`⚠️ コンテキスト収集エラー: ${error.message}`);
            return await this.gatherBasic(userName);
        }
    }

    /**
     * 🚨 基本コンテキスト収集 - エラー時フォールバック
     */
    async gatherBasic(userName) {
        console.log(`🚨 基本コンテキスト収集: ${userName}`);
        
        return {
            userName,
            timestamp: new Date().toISOString(),
            instructions: "基本的な日記生成",
            autonomyLevel: 'low',
            
            availableData: {
                slackChannels: [],
                esaAccess: false,
                userProfile: { name: userName, displayName: userName },
                recentActivity: [],
                preferences: this.getDefaultPreferences(),
                fallbackMode: true
            },
            
            tools: [],
            
            context: {
                timeOfDay: this.getTimeContext(),
                dayOfWeek: new Date().toLocaleDateString('ja-JP', { weekday: 'long' }),
                specialEvents: [],
                fallbackReason: 'MCP接続エラーまたはデータ取得失敗'
            }
        };
    }

    /**
     * 🔌 MCP機能の動的発見
     */ 
    async discoverCapabilities() {
        const cacheKey = 'mcp_capabilities';
        const cached = this.capabilityCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('📋 キャッシュからMCP機能情報を取得');
            return cached.data;
        }

        try {
            console.log('🔍 MCP機能発見実行中...');
            // MCPConnectionManagerの初期化とconnections取得を修正
            await this.mcpManager.initialize();
            const connections = this.mcpManager.connections || {};
            const capabilities = { 
                allTools: [],
                providers: {}
            };
            
            for (const [providerName, connection] of Object.entries(connections)) {
                try {
                    const isAvailable = connection && (typeof connection.isConnected === 'function' ? 
                        await connection.isConnected() : connection !== null);
                    
                    if (isAvailable) {
                        let tools = [];
                        try {
                            const rawTools = (typeof connection.listTools === 'function') ? 
                                await connection.listTools() : [];
                            tools = Array.isArray(rawTools) ? rawTools : 
                                    (rawTools?.tools && Array.isArray(rawTools.tools)) ? rawTools.tools : [];
                        } catch (toolsError) {
                            console.log(`⚠️ ${providerName}ツール取得エラー: ${toolsError.message}`);
                            tools = [];
                        }
                        
                        const toolsWithProvider = tools.map(tool => ({
                            ...tool,
                            provider: providerName,
                            fullName: `${providerName}_${tool.name}`
                        }));

                        capabilities.providers[providerName] = {
                            available: true,
                            tools: toolsWithProvider,
                            connection: connection // AI自律実行用に接続オブジェクトを保存
                        };
                        
                        capabilities.allTools.push(...toolsWithProvider);
                        console.log(`✅ ${providerName}: ${tools.length}個のツール利用可能`);
                    } else {
                        capabilities.providers[providerName] = { available: false };
                        console.log(`❌ ${providerName}: 接続不可`);
                    }
                } catch (providerError) {
                    console.log(`⚠️ ${providerName}エラー: ${providerError.message}`);
                    capabilities.providers[providerName] = { 
                        available: false, 
                        error: providerError.message 
                    };
                }
            }

            // キャッシュ保存
            this.capabilityCache.set(cacheKey, {
                data: capabilities,
                timestamp: Date.now()
            });

            console.log(`🎯 MCP機能発見完了: ${capabilities.allTools.length}個のツール`);
            return capabilities;

        } catch (error) {
            console.error('❌ MCP機能発見失敗:', error);
            return { allTools: [], providers: {} };
        }
    }

    /**
     * 👤 ユーザープロフィール取得
     */
    async getUserProfile(userName) {
        const cacheKey = `profile_${userName}`;
        const cached = this.userProfileCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            // Phase 7b: 動的ツール発見でユーザー情報取得
            const capabilities = await this.discoverCapabilities();
            const slackProvider = capabilities.providers.slack;
            
            if (slackProvider?.available) {
                // 利用可能なツールからユーザー関連ツールを検索
                const userTools = slackProvider.tools.filter(tool => 
                    tool.name.includes('user') || tool.name.includes('profile') || 
                    tool.name.includes('member') || tool.name.includes('info')
                );
                
                console.log(`🔍 Slack ユーザー関連ツール発見: ${userTools.map(t => t.name).join(', ')}`);
                
                // フォールバック: 基本プロフィールを生成
                const profileData = {
                    name: userName,
                    displayName: userName,
                    source: 'fallback_generated',
                    availableTools: userTools.length,
                    discoveredTools: userTools.map(t => t.name)
                };
                
                this.userProfileCache.set(cacheKey, {
                    data: profileData,
                    timestamp: Date.now()
                });
                
                return profileData;
            }
        } catch (error) {
            console.log(`⚠️ ユーザープロフィール取得エラー: ${error.message}`);
        }

        // フォールバック: 基本プロフィール
        const basicProfile = {
            name: userName,
            displayName: userName,
            fallback: true
        };

        this.userProfileCache.set(cacheKey, {
            data: basicProfile,
            timestamp: Date.now()
        });

        return basicProfile;
    }

    /**
     * 📊 最近のアクティビティ取得
     */
    async getRecentActivity(userName) {
        try {
            // Phase 7b: 動的ツール発見でアクティビティ取得
            const capabilities = await this.discoverCapabilities();
            const activities = [];
            
            // Slack アクティビティ
            const slackProvider = capabilities.providers.slack;
            if (slackProvider?.available) {
                const messageTools = slackProvider.tools.filter(tool => 
                    tool.name.includes('message') || tool.name.includes('history') || 
                    tool.name.includes('channel') || tool.name.includes('conversation')
                );
                
                console.log(`🔍 Slack メッセージ関連ツール発見: ${messageTools.map(t => t.name).join(', ')}`);
                
                activities.push({
                    source: 'slack',
                    discoveredTools: messageTools.map(t => t.name),
                    toolCount: messageTools.length,
                    channels: ['etc-spots', 'its-wkwk-general'] // Phase 7c: AI自動発見予定
                });
            }

            // esa アクティビティ
            const esaProvider = capabilities.providers.esa;
            if (esaProvider?.available) {
                const postTools = esaProvider.tools.filter(tool => 
                    tool.name.includes('post') || tool.name.includes('list') || 
                    tool.name.includes('article') || tool.name.includes('search')
                );
                
                console.log(`🔍 esa 記事関連ツール発見: ${postTools.map(t => t.name).join(', ')}`);
                
                activities.push({
                    source: 'esa',
                    discoveredTools: postTools.map(t => t.name),
                    toolCount: postTools.length,
                    searchQuery: `user:${userName}` // Phase 7c: AI自動最適化予定
                });
            }

            return activities;

        } catch (error) {
            console.log(`⚠️ 最近のアクティビティ取得エラー: ${error.message}`);
            return [];
        }
    }

    /**
     * ⚙️ ユーザー設定取得
     */
    async getUserPreferences(userName) {
        // 将来的にはデータベースから取得
        return this.getDefaultPreferences();
    }

    /**
     * 🔧 デフォルト設定
     */
    getDefaultPreferences() {
        return {
            priorityChannels: ['etc-spots', 'its-wkwk-general'],
            dailyExperienceWeight: 0.7,  // 日常体験の重み
            technicalWeight: 0.3,        // 技術系の重み
            writeStyle: 'casual',         // カジュアルな文体
            sectionLength: {
                'やったこと': { min: 150, max: 250 },
                'TIL': { min: 100, max: 200 },
                'こんな気分': { min: 80, max: 150 }
            }
        };
    }

    /**
     * 🕐 時間コンテキスト取得
     */
    getTimeContext() {
        const hour = new Date().getHours();
        
        if (hour < 6) return 'early_morning';
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon'; 
        if (hour < 22) return 'evening';
        return 'night';
    }

    /**
     * 🎉 特別イベントチェック
     */
    async checkSpecialEvents() {
        const today = new Date();
        const events = [];
        
        // 祝日チェック（簡易版）
        const holidays = {
            '01-01': '元日',
            '12-25': 'クリスマス'
        };
        
        const dateKey = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (holidays[dateKey]) {
            events.push({ type: 'holiday', name: holidays[dateKey] });
        }
        
        // 金曜日チェック
        if (today.getDay() === 5) {
            events.push({ type: 'weekend_start', name: '週末' });
        }
        
        return events;
    }

    /**
     * 📱 Slackチャンネル一覧取得
     */
    async getSlackChannels(connection) {
        try {
            const channels = await connection.callTool({
                name: 'list_channels',
                arguments: {}
            });
            
            return channels.channels?.map(ch => ({
                id: ch.id,
                name: ch.name,
                memberCount: ch.num_members,
                isPrivate: ch.is_private
            })) || [];
        } catch (error) {
            console.log(`⚠️ Slackチャンネル取得エラー: ${error.message}`);
            return [];
        }
    }

    /**
     * 📊 収集統計取得
     */
    getGatheringStats() {
        return {
            cacheSize: this.capabilityCache.size + this.userProfileCache.size,
            lastCapabilityCheck: Array.from(this.capabilityCache.values())[0]?.timestamp || null,
            profileCacheHits: Array.from(this.userProfileCache.values()).length
        };
    }

    /**
     * 🧹 キャッシュクリア
     */
    clearCache() {
        this.capabilityCache.clear();
        this.userProfileCache.clear();
        console.log('🧹 ContextGathererキャッシュクリア完了');
    }
}

module.exports = ContextGatherer;
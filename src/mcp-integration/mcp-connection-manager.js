// Phase 5.2: MCP接続管理システム - システム最適化実装
// MCP初期化重複を解決するシングルトンマネージャー

class MCPConnectionManager {
    constructor() {
        if (MCPConnectionManager.instance) {
            // シングルトンパターン: 既存インスタンスを返す
            console.log('🔄 MCPConnectionManager: 既存インスタンスを使用');
            return MCPConnectionManager.instance;
        }
        
        // 初期化状態管理
        this.isInitialized = false;
        this.initializationPromise = null;
        this.connections = {
            slack: null,
            esa: null
        };
        this.connectionStatus = {
            slack: 'not_initialized',
            esa: 'not_initialized'
        };
        this.initializationAttempts = {
            slack: 0,
            esa: 0
        };
        this.maxRetries = 3;
        
        // インスタンスキャッシュ
        MCPConnectionManager.instance = this;
        
        console.log('🎯 Phase 5.2: MCPConnectionManager初期化 - 重複解決システム開始');
    }
    
    /**
     * 🚀 統合初期化システム（重複防止機能付き）
     */
    async initialize(forceReset = false) {
        // 🔧 Phase 5.2修正: 重複初期化防止
        if (this.isInitialized && !forceReset) {
            console.log('✅ MCPConnectionManager: 既に初期化済み - 重複初期化をスキップ');
            return {
                success: true,
                status: 'already_initialized',
                connections: this.connectionStatus
            };
        }
        
        // 初期化処理中の重複防止
        if (this.initializationPromise && !forceReset) {
            console.log('🔄 MCPConnectionManager: 初期化処理中 - 同じPromiseを返却');
            return await this.initializationPromise;
        }
        
        // 新しい初期化プロセス開始
        this.initializationPromise = this._performInitialization(forceReset);
        
        try {
            const result = await this.initializationPromise;
            this.isInitialized = result.success;
            return result;
        } catch (error) {
            this.initializationPromise = null;
            throw error;
        } finally {
            // 初期化完了後にPromiseをクリア
            this.initializationPromise = null;
        }
    }
    
    /**
     * 🔧 実際の初期化処理（プライベートメソッド）
     */
    async _performInitialization(forceReset) {
        console.log('🔄 Phase 5.2: MCP統合初期化システム開始' + (forceReset ? ' (強制リセット)' : ''));
        
        const results = {
            slack: { success: false, error: null },
            esa: { success: false, error: null }
        };
        
        // 既存の接続をクリーンアップ（強制リセット時）
        if (forceReset) {
            await this._cleanupConnections();
        }
        
        // Slack MCP初期化
        try {
            results.slack = await this._initializeSlackConnection();
        } catch (error) {
            console.warn('⚠️ Slack MCP初期化失敗:', error.message);
            results.slack = { success: false, error: error.message };
        }
        
        // esa MCP初期化
        try {
            results.esa = await this._initializeEsaConnection();
        } catch (error) {
            console.warn('⚠️ esa MCP初期化失敗:', error.message);
            results.esa = { success: false, error: error.message };
        }
        
        // 成功した接続があれば初期化成功とみなす
        const hasSuccessfulConnection = results.slack.success || results.esa.success;
        
        this.connectionStatus = {
            slack: results.slack.success ? 'connected' : 'failed',
            esa: results.esa.success ? 'connected' : 'failed'
        };
        
        console.log('✅ Phase 5.2: MCP統合初期化完了', {
            slack: this.connectionStatus.slack,
            esa: this.connectionStatus.esa,
            overall_success: hasSuccessfulConnection
        });
        
        return {
            success: hasSuccessfulConnection,
            connections: this.connectionStatus,
            details: results,
            optimization: 'singleton_pattern_applied'
        };
    }
    
    /**
     * 📱 Slack MCP接続初期化（最適化版）
     */
    async _initializeSlackConnection() {
        if (this.connections.slack && this.connectionStatus.slack === 'connected') {
            console.log('✅ Slack MCP: 既存接続を再利用');
            return { success: true, reused: true };
        }
        
        this.initializationAttempts.slack++;
        console.log(`📱 Slack MCP接続初期化中... (試行回数: ${this.initializationAttempts.slack}/${this.maxRetries})`);
        
        try {
            const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
            const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
            
            // 🔧 Phase 5.2最適化: 接続設定の統一
            const transport = new StdioClientTransport({
                command: "/Users/takuya/.nvm/versions/node/v18.18.2/bin/npx",
                args: ["-y", "@modelcontextprotocol/server-slack"],
                env: {
                    ...process.env,
                    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
                    SLACK_TEAM_ID: process.env.SLACK_TEAM_ID,
                    SLACK_CHANNEL_IDS: process.env.SLACK_CHANNEL_IDS || ""
                }
            });
            
            this.connections.slack = new Client({
                name: "ghostwriter-slack-optimized",
                version: "5.2.0"
            });
            
            await this.connections.slack.connect(transport);
            
            // 接続テスト
            const tools = await this.connections.slack.listTools();
            console.log('🔧 Slack MCPツール確認:', tools.tools.map(t => t.name));
            
            console.log('✅ Slack MCP接続初期化成功 - 接続プール追加');
            return { success: true, tools: tools.tools.length };
            
        } catch (error) {
            console.error('❌ Slack MCP初期化エラー:', error.message);
            this.connections.slack = null;
            throw new Error(`Slack MCP初期化失敗 (試行${this.initializationAttempts.slack}): ${error.message}`);
        }
    }
    
    /**
     * 📚 esa MCP接続初期化（最適化版）
     */
    async _initializeEsaConnection() {
        if (this.connections.esa && this.connectionStatus.esa === 'connected') {
            console.log('✅ esa MCP: 既存接続を再利用');
            return { success: true, reused: true };
        }
        
        this.initializationAttempts.esa++;
        console.log(`📚 esa MCP接続初期化中... (試行回数: ${this.initializationAttempts.esa}/${this.maxRetries})`);
        
        try {
            // 環境変数確認
            const esaApiKey = process.env.ESA_API_KEY || process.env.ESA_ACCESS_TOKEN;
            const esaTeamName = process.env.DEFAULT_ESA_TEAM || process.env.ESA_TEAM_NAME;
            
            if (!esaApiKey || !esaTeamName) {
                throw new Error('esa環境変数が設定されていません');
            }
            
            const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
            const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
            
            // 🔧 Phase 5.2最適化: 接続設定の統一
            const transport = new StdioClientTransport({
                command: "/Users/takuya/.nvm/versions/node/v18.18.2/bin/npx",
                args: ["-y", "esa-mcp-server@latest"],
                env: {
                    ...process.env,
                    ESA_API_KEY: esaApiKey,
                    DEFAULT_ESA_TEAM: esaTeamName
                }
            });
            
            this.connections.esa = new Client({
                name: "ghostwriter-esa-optimized",
                version: "5.2.0"
            });
            
            await this.connections.esa.connect(transport);
            
            // 接続テスト
            const tools = await this.connections.esa.listTools();
            console.log('🔧 esa MCPツール確認:', tools.tools.map(t => t.name));
            
            // 簡単な動作テスト
            await this._testEsaConnection();
            
            console.log('✅ esa MCP接続初期化成功 - 接続プール追加');
            return { success: true, tools: tools.tools.length };
            
        } catch (error) {
            console.error('❌ esa MCP初期化エラー:', error.message);
            this.connections.esa = null;
            throw new Error(`esa MCP初期化失敗 (試行${this.initializationAttempts.esa}): ${error.message}`);
        }
    }
    
    /**
     * 🧪 esa接続テスト
     */
    async _testEsaConnection() {
        if (!this.connections.esa) {
            throw new Error('esa MCP接続が利用できません');
        }
        
        try {
            await this.connections.esa.callTool({
                name: "search_esa_posts",
                arguments: {
                    query: "test",
                    perPage: 1
                }
            });
            console.log('🧪 esa MCP接続テスト成功');
        } catch (error) {
            throw new Error(`esa MCP接続テスト失敗: ${error.message}`);
        }
    }
    
    /**
     * 🔌 接続取得メソッド（最適化版）
     */
    async getConnection(service) {
        if (!this.isInitialized) {
            console.log(`🔄 ${service} MCP接続要求 - 自動初期化実行`);
            await this.initialize();
        }
        
        const connection = this.connections[service];
        const status = this.connectionStatus[service];
        
        if (!connection || status !== 'connected') {
            // 🔧 Phase 5.2修正: 失敗時の自動再接続
            if (this.initializationAttempts[service] < this.maxRetries) {
                console.log(`🔄 ${service} MCP再接続試行中...`);
                
                try {
                    if (service === 'slack') {
                        await this._initializeSlackConnection();
                    } else if (service === 'esa') {
                        await this._initializeEsaConnection();
                    }
                    
                    return this.connections[service];
                } catch (error) {
                    console.warn(`⚠️ ${service} MCP再接続失敗:`, error.message);
                    return null;
                }
            }
            
            console.warn(`⚠️ ${service} MCP接続利用不可: ${status}`);
            return null;
        }
        
        console.log(`✅ ${service} MCP接続取得成功 - 接続プール使用`);
        return connection;
    }
    
    /**
     * 📊 接続状態確認
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            connections: this.connectionStatus,
            attempts: this.initializationAttempts,
            active_connections: Object.values(this.connections).filter(conn => conn !== null).length
        };
    }
    
    /**
     * 🔄 特定接続のリセット
     */
    async resetConnection(service) {
        console.log(`🔄 ${service} MCP接続リセット中...`);
        
        try {
            // 既存接続をクローズ
            if (this.connections[service]) {
                try {
                    await this.connections[service].close();
                } catch (error) {
                    console.warn(`⚠️ ${service} 接続クローズエラー:`, error.message);
                }
                this.connections[service] = null;
            }
            
            // 状態リセット
            this.connectionStatus[service] = 'not_initialized';
            this.initializationAttempts[service] = 0;
            
            // 再初期化
            if (service === 'slack') {
                await this._initializeSlackConnection();
            } else if (service === 'esa') {
                await this._initializeEsaConnection();
            }
            
            console.log(`✅ ${service} MCP接続リセット完了`);
            return { success: true };
            
        } catch (error) {
            console.error(`❌ ${service} MCP接続リセットエラー:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 🧹 接続クリーンアップ
     */
    async _cleanupConnections() {
        console.log('🧹 既存MCP接続クリーンアップ中...');
        
        for (const [service, connection] of Object.entries(this.connections)) {
            if (connection) {
                try {
                    await connection.close();
                    console.log(`✅ ${service} MCP接続クローズ完了`);
                } catch (error) {
                    console.warn(`⚠️ ${service} MCP接続クローズエラー:`, error.message);
                }
                this.connections[service] = null;
            }
        }
        
        // 状態リセット
        this.connectionStatus = {
            slack: 'not_initialized',
            esa: 'not_initialized'
        };
        this.initializationAttempts = {
            slack: 0,
            esa: 0
        };
        this.isInitialized = false;
    }
    
    /**
     * 🧹 完全クリーンアップ（システム終了時）
     */
    async cleanup() {
        console.log('🧹 Phase 5.2: MCPConnectionManager完全クリーンアップ開始');
        
        await this._cleanupConnections();
        
        // シングルトンインスタンスクリア
        MCPConnectionManager.instance = null;
        
        console.log('✅ Phase 5.2: MCPConnectionManager完全クリーンアップ完了');
    }
    
    /**
     * 📊 システム統計情報
     */
    getStatistics() {
        return {
            total_initializations: this.initializationAttempts.slack + this.initializationAttempts.esa,
            successful_connections: Object.values(this.connectionStatus).filter(status => status === 'connected').length,
            failed_connections: Object.values(this.connectionStatus).filter(status => status === 'failed').length,
            optimization_applied: 'singleton_pattern',
            memory_efficiency: 'connection_pooling',
            duplicate_prevention: 'active'
        };
    }
}

// シングルトンインスタンス管理
MCPConnectionManager.instance = null;

/**
 * 🎯 シングルトンインスタンス取得メソッド
 */
MCPConnectionManager.getInstance = function() {
    if (!MCPConnectionManager.instance) {
        console.log('🆕 MCPConnectionManager: 新しいインスタンスを作成');
        MCPConnectionManager.instance = new MCPConnectionManager();
    } else {
        console.log('🔄 MCPConnectionManager: 既存インスタンスを返却');
    }
    return MCPConnectionManager.instance;
};

module.exports = MCPConnectionManager;
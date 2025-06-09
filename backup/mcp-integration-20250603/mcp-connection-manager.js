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
}
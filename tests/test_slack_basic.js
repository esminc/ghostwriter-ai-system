// 🔍 簡単なSlack調査テスト
// MCPマネージャーを使用してSlackの基本情報を取得

console.log('🔍 Slack基本調査開始...');

// 必要なモジュールの確認
try {
    const MCPConnectionManager = require('./src/mcp-integration/mcp-connection-manager');
    console.log('✅ MCPConnectionManager読み込み成功');
    
    async function basicSlackInvestigation() {
        const mcpManager = new MCPConnectionManager();
        
        try {
            console.log('🚀 MCP初期化中...');
            const initResult = await mcpManager.initialize();
            
            if (!initResult.success) {
                console.error('❌ MCP初期化失敗:', initResult.error);
                return;
            }
            
            console.log('✅ MCP初期化成功');
            console.log('接続状況:', initResult.connections);
            
            // Slack接続確認
            const slackConnection = await mcpManager.getConnection('slack');
            if (!slackConnection) {
                console.error('❌ Slack接続が取得できません');
                return;
            }
            
            console.log('✅ Slack接続取得成功');
            
            // etc-spotsチャンネルのメッセージを少数取得してテスト
            console.log('📨 etc-spotsテストメッセージ取得中...');
            
            const testResult = await slackConnection.callTool({
                name: "slack_get_channel_history",
                arguments: {
                    channel_id: 'C040BKQ8P2L', // etc-spots
                    limit: 5 // 少数でテスト
                }
            });
            
            console.log('🔍 テスト結果の型:', typeof testResult);
            console.log('🔍 テスト結果の構造:', Object.keys(testResult || {}));
            
            if (testResult && testResult.content) {
                console.log('✅ Slack API呼び出し成功');
                console.log('📊 レスポンス構造確認完了');
                
                // レスポンス解析のテスト
                let parsedData = null;
                if (Array.isArray(testResult.content) && testResult.content[0]) {
                    try {
                        parsedData = JSON.parse(testResult.content[0].text);
                        console.log('✅ JSON解析成功');
                        console.log('📊 メッセージ数:', parsedData.messages?.length || 0);
                        
                        if (parsedData.messages && parsedData.messages.length > 0) {
                            console.log('\n📋 取得されたメッセージの概要:');
                            parsedData.messages.slice(0, 3).forEach((msg, index) => {
                                const msgTime = new Date(parseFloat(msg.ts) * 1000);
                                const preview = (msg.text || '').substring(0, 50);
                                
                                console.log(`   ${index + 1}. ${msgTime.toISOString()}`);
                                console.log(`      ユーザー: ${msg.user || 'unknown'}`);
                                console.log(`      内容: "${preview}..."`);
                            });
                        }
                    } catch (parseError) {
                        console.error('❌ JSON解析エラー:', parseError.message);
                        console.log('生データ（最初の200文字）:', testResult.content[0].text.substring(0, 200));
                    }
                }
            } else {
                console.error('❌ Slack API呼び出し失敗');
                console.log('結果:', testResult);
            }
            
        } catch (error) {
            console.error('❌ 調査エラー:', error.message);
            console.error('エラー詳細:', error);
        } finally {
            try {
                await mcpManager.cleanup();
                console.log('✅ クリーンアップ完了');
            } catch (cleanupError) {
                console.error('❌ クリーンアップエラー:', cleanupError);
            }
        }
    }
    
    // 調査実行
    basicSlackInvestigation();
    
} catch (requireError) {
    console.error('❌ モジュール読み込みエラー:', requireError.message);
    console.error('パス確認が必要です');
}

const LLMDiaryGeneratorB = require('./src/mcp-integration/llm-diary-generator-b');

async function debugSlackMCPResponse() {
    console.log('🔧 Slack MCP レスポンス詳細調査開始...\n');
    
    const generator = new LLMDiaryGeneratorB();
    
    try {
        await generator.initialize();
        
        console.log('1️⃣ ユーザー一覧API詳細調査:');
        console.log('-'.repeat(40));
        
        // 直接MCPクライアントを使用してレスポンス構造を調査
        const mcpClient = generator.slackMCPWrapper.mcpClient;
        
        const usersResult = await mcpClient.slackMCPClient.callTool({
            name: "slack_get_users",
            arguments: {}
        });
        
        console.log('📊 ユーザー一覧レスポンス構造:');
        console.log('typeof usersResult:', typeof usersResult);
        console.log('usersResult keys:', Object.keys(usersResult || {}));
        console.log('usersResult.content type:', typeof usersResult?.content);
        console.log('usersResult.content length:', usersResult?.content?.length);
        console.log('\n📋 完全なレスポンス:');
        console.log(JSON.stringify(usersResult, null, 2));
        
        console.log('\n2️⃣ チャンネル一覧API詳細調査:');
        console.log('-'.repeat(40));
        
        const channelsResult = await mcpClient.slackMCPClient.callTool({
            name: "slack_list_channels",
            arguments: {}
        });
        
        console.log('📊 チャンネル一覧レスポンス構造:');
        console.log('typeof channelsResult:', typeof channelsResult);
        console.log('channelsResult keys:', Object.keys(channelsResult || {}));
        console.log('channelsResult.content type:', typeof channelsResult?.content);
        console.log('channelsResult.content length:', channelsResult?.content?.length);
        console.log('\n📋 完全なレスポンス:');
        console.log(JSON.stringify(channelsResult, null, 2));
        
        console.log('\n3️⃣ MCP接続状態確認:');
        console.log('-'.repeat(40));
        
        const connectionStatus = await mcpClient.checkConnection();
        console.log('📊 接続状態:');
        console.log(JSON.stringify(connectionStatus, null, 2));
        
        console.log('\n4️⃣ 環境変数確認:');
        console.log('-'.repeat(40));
        console.log('SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? 'あり' : 'なし');
        console.log('SLACK_TEAM_ID:', process.env.SLACK_TEAM_ID || 'なし');
        console.log('SLACK_CHANNEL_IDS:', process.env.SLACK_CHANNEL_IDS || 'なし');
        console.log('SLACK_MCP_ENABLED:', process.env.SLACK_MCP_ENABLED || 'なし');
        
    } catch (error) {
        console.error('❌ 調査エラー:', error);
        console.log('\nエラー詳細:');
        console.log('Message:', error.message);
        console.log('Stack:', error.stack);
    } finally {
        await generator.cleanup();
    }
}

debugSlackMCPResponse();
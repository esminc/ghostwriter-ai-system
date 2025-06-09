// 🔍 Slack API詳細調査スクリプト
// etc-spotsチャンネルから返される全メッセージの詳細確認

const SlackMCPWrapperDirect = require('./src/mcp-integration/slack-mcp-wrapper-direct');

async function investigateSlackMessages() {
    console.log('🔍 === Slack API詳細調査開始 ===\n');
    
    const slackWrapper = new SlackMCPWrapperDirect();
    
    try {
        // 初期化
        console.log('🚀 SlackMCPWrapper初期化中...');
        const initResult = await slackWrapper.initialize();
        
        if (!initResult.success) {
            console.error('❌ 初期化失敗:', initResult.error);
            return;
        }
        
        console.log('✅ 初期化成功\n');
        
        // MCP接続を取得
        const slackMCPClient = await slackWrapper.mcpManager.getConnection('slack');
        if (!slackMCPClient) {
            console.error('❌ Slack MCP接続が取得できません');
            return;
        }
        
        // etc-spotsチャンネルの詳細調査
        const channelId = 'C040BKQ8P2L'; // etc-spots
        const userId = 'U040L7EJC0Z'; // 岡本卓也
        
        console.log(`🎯 調査対象:`);
        console.log(`   - チャンネル: etc-spots (${channelId})`);
        console.log(`   - ユーザー: 岡本卓也 (${userId})`);
        console.log(`   - 調査内容: 全メッセージのタイムスタンプと内容\n`);
        
        // 現在のgetTodayTimestamp()の計算を再現
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const oldestTimestamp = Math.floor(twentyFourHoursAgo.getTime() / 1000).toString();
        
        console.log(`📊 時刻情報:`);
        console.log(`   - 現在時刻: ${now.toISOString()}`);
        console.log(`   - 24時間前: ${twentyFourHoursAgo.toISOString()}`);
        console.log(`   - oldest パラメータ: ${oldestTimestamp}`);
        console.log(`   - oldest 人間可読: ${new Date(parseInt(oldestTimestamp) * 1000).toISOString()}\n`);
        
        // 🔍 Step 1: 大量のメッセージを取得してみる
        console.log('🔍 Step 1: 大量メッセージ取得（oldest指定なし）');
        
        const historyResultNoOldest = await slackMCPClient.callTool({
            name: "slack_get_channel_history",
            arguments: {
                channel_id: channelId,
                limit: 50 // より多くのメッセージを取得
            }
        });
        
        const historyDataNoOldest = slackWrapper.parseSlackMCPResponse(historyResultNoOldest);
        const messagesNoOldest = historyDataNoOldest?.messages || [];
        
        console.log(`📋 oldest指定なしの結果: ${messagesNoOldest.length}件`);
        
        if (messagesNoOldest.length > 0) {
            console.log(`\n📊 メッセージ一覧（oldest指定なし、全ユーザー）:`);
            messagesNoOldest.slice(0, 10).forEach((msg, index) => {
                const msgTime = new Date(parseFloat(msg.ts) * 1000);
                const timeAgo = (now.getTime() - msgTime.getTime()) / (1000 * 60 * 60 * 24);
                const preview = (msg.text || '').substring(0, 80).replace(/\n/g, ' ');
                
                console.log(`   ${index + 1}. ${msgTime.toISOString()} (${timeAgo.toFixed(1)}日前)`);
                console.log(`      ユーザー: ${msg.user || 'unknown'}`);
                console.log(`      内容: "${preview}${preview.length >= 80 ? '...' : ''}"`);
                console.log('');
            });
            
            // 岡本卓也のメッセージのみフィルタリング
            const userMessagesNoOldest = messagesNoOldest.filter(msg => msg.user === userId);
            console.log(`\n👤 岡本卓也のメッセージ（oldest指定なし）: ${userMessagesNoOldest.length}件`);
            
            userMessagesNoOldest.forEach((msg, index) => {
                const msgTime = new Date(parseFloat(msg.ts) * 1000);
                const timeAgo = (now.getTime() - msgTime.getTime()) / (1000 * 60 * 60 * 24);
                const preview = (msg.text || '').substring(0, 120).replace(/\n/g, ' ');
                
                console.log(`   ${index + 1}. ${msgTime.toISOString()} (${timeAgo.toFixed(1)}日前)`);
                console.log(`      内容: "${preview}${preview.length >= 120 ? '...' : ''}"`);
                
                // 疑わしい内容をチェック
                const text = msg.text || '';
                if (text.includes('2024') || text.includes('11/01') || text.includes('110000') || text.includes('com/entry')) {
                    console.log(`      🚨 疑わしい内容発見: 2024年日付関連が含まれています`);
                }
                console.log('');
            });
        }
        
        // 🔍 Step 2: oldest指定ありで取得
        console.log(`\n🔍 Step 2: oldest指定ありメッセージ取得`);
        console.log(`   oldest: ${oldestTimestamp}`);
        
        const historyResultWithOldest = await slackMCPClient.callTool({
            name: "slack_get_channel_history",
            arguments: {
                channel_id: channelId,
                limit: 20,
                oldest: oldestTimestamp
            }
        });
        
        const historyDataWithOldest = slackWrapper.parseSlackMCPResponse(historyResultWithOldest);
        const messagesWithOldest = historyDataWithOldest?.messages || [];
        
        console.log(`📋 oldest指定ありの結果: ${messagesWithOldest.length}件`);
        
        if (messagesWithOldest.length > 0) {
            console.log(`\n📊 メッセージ一覧（oldest指定あり）:`);
            messagesWithOldest.forEach((msg, index) => {
                const msgTime = new Date(parseFloat(msg.ts) * 1000);
                const timeAgo = (now.getTime() - msgTime.getTime()) / (1000 * 60 * 60 * 24);
                const preview = (msg.text || '').substring(0, 80).replace(/\n/g, ' ');
                const isTarget = msg.user === userId;
                
                console.log(`   ${index + 1}. ${msgTime.toISOString()} (${timeAgo.toFixed(1)}日前) ${isTarget ? '👤' : ''}`);
                console.log(`      ユーザー: ${msg.user || 'unknown'}`);
                console.log(`      内容: "${preview}${preview.length >= 80 ? '...' : ''}"`);
                
                // 取得範囲チェック
                const isInRange = parseFloat(msg.ts) * 1000 >= parseInt(oldestTimestamp) * 1000;
                console.log(`      範囲内: ${isInRange ? '✅' : '❌'}`);
                console.log('');
            });
        }
        
        // 🔍 Step 3: 比較分析
        console.log(`\n🔍 Step 3: 比較分析`);
        console.log(`   oldest指定なし: ${messagesNoOldest.length}件`);
        console.log(`   oldest指定あり: ${messagesWithOldest.length}件`);
        
        const userMessagesWithOldest = messagesWithOldest.filter(msg => msg.user === userId);
        console.log(`   岡本卓也（oldest指定なし）: ${userMessagesNoOldest.length}件`);
        console.log(`   岡本卓也（oldest指定あり）: ${userMessagesWithOldest.length}件`);
        
        // 🔍 Step 4: 「2024/11/01」を含むメッセージの特定
        console.log(`\n🔍 Step 4: 疑わしい内容の特定`);
        
        const allMessages = [...messagesNoOldest];
        const suspiciousMessages = allMessages.filter(msg => {
            const text = msg.text || '';
            return text.includes('2024') || text.includes('11/01') || text.includes('110000') || text.includes('com/entry');
        });
        
        console.log(`🚨 疑わしいメッセージ: ${suspiciousMessages.length}件`);
        
        suspiciousMessages.forEach((msg, index) => {
            const msgTime = new Date(parseFloat(msg.ts) * 1000);
            const timeAgo = (now.getTime() - msgTime.getTime()) / (1000 * 60 * 60 * 24);
            
            console.log(`\n🚨 疑わしいメッセージ ${index + 1}:`);
            console.log(`   時刻: ${msgTime.toISOString()} (${timeAgo.toFixed(1)}日前)`);
            console.log(`   ユーザー: ${msg.user || 'unknown'}`);
            console.log(`   内容: "${msg.text || ''}"`);
            
            // 具体的に何が疑わしいかを特定
            const text = msg.text || '';
            const suspiciousPatterns = ['2024', '11/01', '110000', 'com/entry'];
            const foundPatterns = suspiciousPatterns.filter(pattern => text.includes(pattern));
            console.log(`   疑わしいパターン: ${foundPatterns.join(', ')}`);
        });
        
        console.log(`\n✅ 調査完了`);
        
    } catch (error) {
        console.error('❌ 調査エラー:', error);
    } finally {
        // クリーンアップ
        try {
            await slackWrapper.cleanup();
        } catch (cleanupError) {
            console.error('❌ クリーンアップエラー:', cleanupError);
        }
    }
}

// 調査実行
investigateSlackMessages().catch(console.error);

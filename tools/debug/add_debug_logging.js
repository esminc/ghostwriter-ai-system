// 🔍 リアルタイムSlack調査用の詳細ログ付きバージョン
// 既存のslack-mcp-wrapper-directに一時的にデバッグログを追加

const fs = require('fs').promises;

async function addDetailedLoggingToSlackWrapper() {
    console.log('🔍 Slack Wrapper詳細ログ追加開始...');
    
    try {
        // 元ファイルをバックアップ
        const originalPath = '/Users/takuya/Documents/AI-Work/GhostWriter/src/mcp-integration/slack-mcp-wrapper-direct.js';
        const backupPath = '/Users/takuya/Documents/AI-Work/GhostWriter/src/mcp-integration/slack-mcp-wrapper-direct.js.backup';
        
        const originalContent = await fs.readFile(originalPath, 'utf8');
        await fs.writeFile(backupPath, originalContent);
        console.log('✅ 元ファイルのバックアップ完了');
        
        // 詳細ログを追加した新しいバージョンを作成
        const modifiedContent = originalContent.replace(
            // collectTodayMessagesFromMultipleChannels メソッドの中の該当部分を置換
            /const historyResult = await slackMCPClient\.callTool\(\{[\s\S]*?\}\);/,
            `const historyResult = await slackMCPClient.callTool({
                    name: "slack_get_channel_history",
                    arguments: {
                        channel_id: channel.id,
                        limit: channelLimit * 2, // ユーザーメッセージ以外も含むため多めに取得
                        oldest: todayTimestamp
                    }
                });
                
                // 🔍 詳細調査ログ追加
                if (channel.name === 'etc-spots') {
                    console.log('🔍🔍🔍 === etc-spots詳細調査 ===');
                    console.log('🔍 API呼び出しパラメータ:');
                    console.log('   channel_id:', channel.id);
                    console.log('   limit:', channelLimit * 2);
                    console.log('   oldest:', todayTimestamp);
                    console.log('   oldest人間可読:', new Date(parseInt(todayTimestamp) * 1000).toISOString());
                    
                    console.log('🔍 APIレスポンス調査:');
                    console.log('   historyResult型:', typeof historyResult);
                    console.log('   historyResult.content存在:', !!historyResult.content);
                    
                    if (historyResult.content && historyResult.content[0]) {
                        try {
                            const rawData = JSON.parse(historyResult.content[0].text);
                            console.log('   JSON解析成功、メッセージ数:', rawData.messages?.length || 0);
                            
                            if (rawData.messages) {
                                console.log('🔍 全メッセージ詳細（etc-spots）:');
                                rawData.messages.forEach((msg, index) => {
                                    const msgTime = new Date(parseFloat(msg.ts) * 1000);
                                    const now = new Date();
                                    const hoursAgo = (now.getTime() - msgTime.getTime()) / (1000 * 60 * 60);
                                    const preview = (msg.text || '').substring(0, 80).replace(/\\n/g, ' ');
                                    
                                    console.log(\`   📨 \${index + 1}. \${msgTime.toISOString()} (\${hoursAgo.toFixed(1)}h前)\`);
                                    console.log(\`      ユーザー: \${msg.user || 'unknown'}\`);
                                    console.log(\`      タイムスタンプ: \${msg.ts}\`);
                                    console.log(\`      内容: "\${preview}\${preview.length >= 80 ? '...' : ''}"\`);
                                    
                                    // 範囲チェック
                                    const isInRange = parseFloat(msg.ts) >= parseInt(todayTimestamp);
                                    console.log(\`      範囲内: \${isInRange ? '✅' : '❌'}\`);
                                    
                                    // 疑わしい内容チェック
                                    const text = msg.text || '';
                                    if (text.includes('2024') || text.includes('11/01') || text.includes('110000') || text.includes('com/entry')) {
                                        console.log(\`      🚨 疑わしい内容: 2024年関連発見\`);
                                    }
                                    
                                    console.log('');
                                });
                            }
                        } catch (parseError) {
                            console.log('   JSON解析エラー:', parseError.message);
                        }
                    }
                    console.log('🔍🔍🔍 === etc-spots調査終了 ===\\n');
                }`
        );
        
        // 修正版を保存
        await fs.writeFile(originalPath, modifiedContent);
        console.log('✅ 詳細ログ追加版を保存完了');
        
        console.log('🎯 次の手順:');
        console.log('1. Slackサーバーを再起動: npm run slack:dev');
        console.log('2. Slackで /diary コマンドを実行');
        console.log('3. ログで詳細情報を確認');
        console.log('4. 調査完了後にバックアップから復元');
        
        return true;
        
    } catch (error) {
        console.error('❌ 詳細ログ追加エラー:', error);
        return false;
    }
}

// 実行
addDetailedLoggingToSlackWrapper().then(success => {
    if (success) {
        console.log('✅ 詳細ログ追加完了。Slackサーバーを再起動してテストしてください。');
    } else {
        console.log('❌ 詳細ログ追加に失敗しました。');
    }
});

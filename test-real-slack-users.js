const LLMDiaryGeneratorB = require('./src/mcp-integration/llm-diary-generator-b');

async function checkRealSlackUsers() {
    console.log('🔍 実Slackユーザー確認開始...\n');
    console.log('=' .repeat(60));
    
    const generator = new LLMDiaryGeneratorB();
    
    try {
        console.log('🚀 戦略B改良版システム初期化中...');
        await generator.initialize();
        
        console.log('🏢 Slackワークスペース情報取得中...');
        const workspaceInfo = await generator.slackMCPWrapper.getWorkspaceInfo();
        
        if (workspaceInfo.success) {
            console.log('✅ Slackワークスペース接続成功\n');
            console.log('📊 ワークスペース統計:');
            console.log(`   チャンネル数: ${workspaceInfo.workspace?.channel_count || 0}`);
            console.log(`   ユーザー数: ${workspaceInfo.workspace?.user_count || 0}`);
            console.log(`   取得時刻: ${new Date(workspaceInfo.timestamp).toLocaleString('ja-JP')}\n`);
            
            if (workspaceInfo.workspace?.active_users && workspaceInfo.workspace.active_users.length > 0) {
                console.log('👥 利用可能なユーザー一覧:');
                console.log('-' .repeat(40));
                
                workspaceInfo.workspace.active_users.forEach((user, index) => {
                    console.log(`${index + 1}. ユーザー名: ${user.name}`);
                    if (user.display_name) {
                        console.log(`   表示名: ${user.display_name}`);
                    }
                    if (user.real_name) {
                        console.log(`   実名: ${user.real_name}`);
                    }
                    console.log(`   ID: ${user.id}`);
                    console.log(`   管理者: ${user.is_admin ? 'はい' : 'いいえ'}`);
                    console.log('');
                });
                
                console.log('🎯 戦略B改良版100%完成テスト準備:');
                console.log('-' .repeat(40));
                console.log('以下のユーザー名のいずれかを使用してテストを実行できます:');
                
                const testableUsers = workspaceInfo.workspace.active_users.slice(0, 3);
                testableUsers.forEach((user, index) => {
                    console.log(`   ${index + 1}. "${user.name}" (${user.real_name || user.display_name || 'ID: ' + user.id})`);
                });
                
                // 最初のユーザーで自動テスト実行の提案
                const firstUser = workspaceInfo.workspace.active_users[0];
                console.log(`\n🚀 推奨次のステップ:`);
                console.log(`   node -e "const LLMDiaryGeneratorB = require('./src/mcp-integration/llm-diary-generator-b'); (async () => { const g = new LLMDiaryGeneratorB(); await g.initialize(); const r = await g.generateDiaryWithMCP('${firstUser.name}'); console.log('🎉 100%完成テスト結果:', r.metadata?.data_sources?.slack === 'real_slack_mcp' ? '✅ 成功!' : '⚠️ まだフォールバック'); await g.cleanup(); })();"`);
                
            } else {
                console.log('⚠️ アクティブなユーザーが見つかりませんでした');
                console.log('   ワークスペース設定またはAPI権限を確認してください');
            }
            
            if (workspaceInfo.workspace?.popular_channels && workspaceInfo.workspace.popular_channels.length > 0) {
                console.log('\n📱 人気チャンネル一覧:');
                console.log('-' .repeat(40));
                workspaceInfo.workspace.popular_channels.forEach((channel, index) => {
                    console.log(`   ${index + 1}. #${channel.name} (${channel.member_count}名)`);
                    if (channel.purpose) {
                        console.log(`      目的: ${channel.purpose}`);
                    }
                });
            }
            
        } else {
            console.log('❌ Slackワークスペース情報取得失敗');
            console.log('   理由:', workspaceInfo.reason || workspaceInfo.error);
            console.log('\n🔍 トラブルシューティング:');
            console.log('   1. SLACK_BOT_TOKEN の有効性確認');
            console.log('   2. SLACK_TEAM_ID の正確性確認');
            console.log('   3. Slackアプリの権限設定確認');
            console.log('   4. ワークスペースのアクセス権限確認');
        }
        
    } catch (error) {
        console.error('❌ 実ユーザー確認エラー:', error);
        console.log('\n🔧 推奨解決策:');
        console.log('   1. .env ファイルの設定確認');
        console.log('   2. Slack MCP サーバーの状態確認');
        console.log('   3. ネットワーク接続確認');
    } finally {
        await generator.cleanup();
        console.log('\n🧹 リソースクリーンアップ完了');
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 実Slackユーザー確認完了');
}

// メイン実行
if (require.main === module) {
    checkRealSlackUsers()
        .then(() => {
            console.log('\n🎊 次のステップ: 実ユーザー名で戦略B改良版100%完成テストを実行!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 スクリプト実行エラー:', error);
            process.exit(1);
        });
}

module.exports = checkRealSlackUsers;
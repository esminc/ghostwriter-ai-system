// 全ユーザー表示テスト
// ESMワークスペースの全ユーザーを表示

const LLMDiaryGeneratorB = require('./src/mcp-integration/llm-diary-generator-b');

async function testAllUsers() {
    console.log('\n👥 ESMワークスペース全ユーザー表示テスト\n');
    console.log('=' .repeat(60));
    
    const generator = new LLMDiaryGeneratorB();

    try {
        // システム初期化
        console.log('🔄 システム初期化中...');
        const initResult = await generator.initialize();
        
        if (!initResult.success) {
            throw new Error(`初期化失敗: ${initResult.error}`);
        }
        
        console.log('✅ システム初期化完了');
        
        // ワークスペース情報取得
        console.log('\n🏢 ESMワークスペース情報取得中...');
        const workspaceInfo = await generator.slackMCPWrapper.getWorkspaceInfo();
        
        if (!workspaceInfo.success) {
            throw new Error(`ワークスペース情報取得失敗: ${workspaceInfo.error}`);
        }
        
        console.log('\n📊 ワークスペース統計:');
        console.log(`   - 総ユーザー数: ${workspaceInfo.workspace.user_count}名`);
        console.log(`   - チャンネル数: ${workspaceInfo.workspace.channel_count}個`);
        console.log(`   - アクティブユーザー: ${workspaceInfo.workspace.active_users.length}名`);
        
        console.log('\n👥 全ユーザー一覧:');
        console.log('-'.repeat(60));
        
        workspaceInfo.workspace.active_users.forEach((user, index) => {
            const realName = user.real_name || user.display_name || `ID: ${user.id}`;
            const status = user.deleted ? '❌' : '✅';
            const bot = user.is_bot ? '🤖' : '👤';
            
            console.log(`   ${String(index + 1).padStart(3, ' ')}. ${bot} ${status} ${user.name.padEnd(20, ' ')} (${realName})`);
            
            // 20名ごとに区切り線
            if ((index + 1) % 20 === 0) {
                console.log('   ' + '-'.repeat(56));
            }
        });
        
        console.log('\n📋 ユーザータイプ別統計:');
        const stats = workspaceInfo.workspace.active_users.reduce((acc, user) => {
            if (user.is_bot) acc.bots++;
            else acc.humans++;
            if (user.deleted) acc.deleted++;
            else acc.active++;
            return acc;
        }, { humans: 0, bots: 0, active: 0, deleted: 0 });
        
        console.log(`   - 👤 人間ユーザー: ${stats.humans}名`);
        console.log(`   - 🤖 ボット: ${stats.bots}名`);
        console.log(`   - ✅ アクティブ: ${stats.active}名`);
        console.log(`   - ❌ 削除済み: ${stats.deleted}名`);
        
    } catch (error) {
        console.error('\n❌ テスト実行エラー:', error.message);
    } finally {
        // クリーンアップ
        try {
            await generator.cleanup();
            console.log('\n🧹 リソースクリーンアップ完了');
        } catch (cleanupError) {
            console.error('⚠️ クリーンアップエラー:', cleanupError.message);
        }
    }
}

// メイン実行
if (require.main === module) {
    testAllUsers()
        .then(() => {
            console.log('\n✅ 全ユーザー表示テスト完了');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 全ユーザー表示テスト実行エラー:', error);
            process.exit(1);
        });
}

module.exports = testAllUsers;

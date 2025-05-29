// 自動ユーザーマッピングのテスト
const AutoUserMapper = require('./src/services/auto-user-mapper');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

async function testAutoMapping() {
    console.log('🔄 自動ユーザーマッピングテスト開始...\n');
    
    const mapper = new AutoUserMapper();
    
    // テスト用のSlackユーザー情報（実際のAPIレスポンス形式）
    const testSlackUsers = [
        {
            id: 'U12345678',
            name: 'takuya.okamoto',
            real_name: '岡本拓也',
            profile: {
                email: 'takuya.okamoto@example.com',
                display_name: 'takuya'
            }
        },
        {
            id: 'U87654321',
            name: 'test.user',
            real_name: 'テストユーザー',
            profile: {
                email: 'test.user@example.com',
                display_name: 'test'
            }
        },
        {
            id: 'U99999999',
            name: 'unknown.user',
            real_name: '不明ユーザー',
            profile: {
                email: 'unknown@example.com',
                display_name: 'unknown'
            }
        }
    ];
    
    // 各テストユーザーでマッピングテスト
    for (const testUser of testSlackUsers) {
        console.log(`\n📋 テストユーザー: ${testUser.name} (${testUser.real_name})`);
        console.log(`   メール: ${testUser.profile.email}`);
        
        try {
            const result = await mapper.mapSlackToEsa(testUser);
            
            if (result.success) {
                console.log(`✅ マッピング成功:`);
                console.log(`   方法: ${result.mappingMethod}`);
                console.log(`   信頼度: ${result.confidence}`);
                console.log(`   Slack: ${result.slackUser.name}`);
                console.log(`   esa: ${result.esaUser.screen_name} (${result.esaUser.name})`);
                
                // 従来形式への変換テスト
                const legacy = mapper.toLegacyMapping(result);
                console.log(`   レガシー形式:`, legacy);
            } else {
                console.log(`❌ マッピング失敗: ${result.error}`);
            }
        } catch (error) {
            console.error(`❌ テストエラー: ${error.message}`);
        }
    }
    
    // マッピング統計情報
    console.log(`\n📊 マッピング統計:`);
    const stats = mapper.getMappingStats();
    console.log(stats);
    
    // esaメンバー情報表示
    console.log(`\n👥 esaメンバー情報取得テスト:`);
    const members = await mapper.getEsaMembers();
    if (members) {
        console.log(`✅ ${members.length}人のメンバーを取得:`);
        members.slice(0, 5).forEach(member => {
            console.log(`   - ${member.screen_name} (${member.name || 'N/A'}) ${member.email ? '[メール有]' : '[メール無]'}`);
        });
        if (members.length > 5) {
            console.log(`   ... 他${members.length - 5}人`);
        }
    } else {
        console.log(`❌ esaメンバー情報取得失敗`);
    }
    
    console.log('\n🎉 自動ユーザーマッピングテスト完了！');
}

// メイン実行
if (require.main === module) {
    testAutoMapping().catch(error => {
        console.error('❌ テスト実行エラー:', error);
        process.exit(1);
    });
}

module.exports = testAutoMapping;
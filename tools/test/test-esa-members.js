// esaメンバー情報確認テスト
const dotenv = require('dotenv');
const EsaAPI = require('./src/services/esa-api');

dotenv.config();

async function testEsaMembers() {
    console.log('🔄 esaメンバー情報テスト開始...\n');
    
    const esaAPI = new EsaAPI(process.env.ESA_TEAM_NAME, process.env.ESA_ACCESS_TOKEN);
    
    try {
        // メンバー情報取得
        const result = await esaAPI.getMembers();
        
        if (result.success) {
            console.log(`✅ メンバー情報取得成功: ${result.members.length}人\n`);
            
            console.log('👥 メンバー一覧:');
            result.members.forEach((member, index) => {
                console.log(`  ${index + 1}. ${member.screen_name}`);
                console.log(`     名前: ${member.name || 'N/A'}`);
                console.log(`     メール: ${member.email ? '***@***' : '未設定'}`);
                console.log(`     アイコン: ${member.icon ? 'あり' : 'なし'}`);
                console.log('');
            });
            
            // takuya関連のメンバーを検索
            const takuyaMembers = result.members.filter(member => 
                member.screen_name.includes('takuya') || 
                member.screen_name.includes('okamoto') ||
                (member.name && (member.name.includes('takuya') || member.name.includes('岡本')))
            );
            
            if (takuyaMembers.length > 0) {
                console.log('🔍 takuya関連メンバー:');
                takuyaMembers.forEach(member => {
                    console.log(`  - ${member.screen_name} (${member.name || 'N/A'})`);
                    console.log(`    メール: ${member.email ? 'あり' : 'なし'}`);
                });
            } else {
                console.log('🔍 takuya関連メンバーが見つかりませんでした');
            }
            
            // 自動マッピング可能性分析
            console.log('\n📊 自動マッピング可能性分析:');
            const membersWithEmail = result.members.filter(m => m.email);
            const membersWithName = result.members.filter(m => m.name);
            
            console.log(`  - メールアドレス設定済み: ${membersWithEmail.length}/${result.members.length}人`);
            console.log(`  - 実名設定済み: ${membersWithName.length}/${result.members.length}人`);
            
            if (membersWithEmail.length > 0) {
                console.log('  📧 メールアドレス自動マッピング: 可能');
            }
            if (membersWithName.length > 0) {
                console.log('  👤 実名自動マッピング: 可能');
            }
            
        } else {
            console.log('❌ メンバー情報取得失敗:', result.error);
        }
        
    } catch (error) {
        console.error('❌ テストエラー:', error.message);
        console.error('スタックトレース:', error.stack);
    }
    
    console.log('\n🎉 esaメンバー情報テスト完了！');
}

// メイン実行
if (require.main === module) {
    testEsaMembers().catch(error => {
        console.error('❌ 致命的エラー:', error);
        process.exit(1);
    });
}

module.exports = testEsaMembers;
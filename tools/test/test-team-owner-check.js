const EsaAPI = require('./src/services/esa-api');

async function checkTeamOwner() {
  console.log('🔍 チーム権限確認中...');
  
  const esaAPI = new EsaAPI(process.env.ESA_TEAM_NAME, process.env.ESA_ACCESS_TOKEN);
  
  try {
    // チーム情報取得
    const teamResult = await esaAPI.getTeamInfo();
    if (teamResult.success) {
      console.log('✅ チーム情報:', teamResult.team.name);
    }
    
    // メンバー情報取得
    const membersResult = await esaAPI.getMembers();
    if (membersResult.success) {
      console.log('👥 メンバー一覧:');
      
      membersResult.members.forEach(member => {
        const isMySelf = member.myself ? '⭐ (自分)' : '';
        const role = member.role;
        console.log(`   - ${member.name} (${member.screen_name}) - ${role} ${isMySelf}`);
      });
      
      // 自分の権限確認
      const myself = membersResult.members.find(m => m.myself);
      if (myself) {
        console.log('');
        console.log('🔑 自分の権限情報:');
        console.log(`   名前: ${myself.name}`);
        console.log(`   スクリーンネーム: ${myself.screen_name}`);
        console.log(`   ロール: ${myself.role}`);
        console.log(`   Owner権限: ${myself.role === 'owner' ? '✅ あり' : '❌ なし'}`);
        
        if (myself.role === 'owner') {
          console.log('');
          console.log('✅ created_by パラメーター使用可能');
        } else {
          console.log('');
          console.log('❌ created_by パラメーター使用不可');
          console.log('   → Ownerに権限変更を依頼するか、別の解決策が必要');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// 環境変数読み込み
require('dotenv').config();

checkTeamOwner();

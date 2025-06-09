#!/usr/bin/env node

// 新しいesa MCPサーバー（kajirita2002版）のメールアドレスマッピングテスト
// Phase 5.3: MCPサーバー変更後のメールアドレスマッピング復活テスト

require('dotenv').config();

const MigrationManager = require('../src/services/migration-manager');

async function testNewEsaMCPMapping() {
    console.log('🚀 新esa MCPサーバーのメールアドレスマッピングテスト開始');
    console.log('📋 MCPサーバー: @kajirita2002/esa-mcp-server');
    
    const migrationManager = new MigrationManager();
    
    // テスト対象のSlackユーザー情報（サンプル）
    const testUsers = [
        {
            id: 'U040L7EJC0Z',
            name: 'takuya.okamoto',
            profile: {
                email: 'takuya.okamoto@esm.co.jp',
                real_name: '岡本卓也'
            }
        },
        {
            id: 'U0407J0AEHY', 
            name: 'seiya.uesaka',
            profile: {
                email: 'seiya.uesaka@esm.co.jp',
                real_name: '上坂誠也'
            }
        },
        {
            id: 'U040L6UP62D',
            name: 'rkino',
            profile: {
                email: 'rkino@esm.co.jp',
                real_name: 'rkino'
            }
        }
    ];
    
    console.log('\n📊 テスト実行結果:');
    console.log('='.repeat(80));
    
    for (const user of testUsers) {
        console.log(`\n🔄 テストユーザー: ${user.name} (${user.profile.email})`);
        
        try {
            const result = await migrationManager.mapUser(user);
            
            if (result.success) {
                console.log(`✅ マッピング成功:`);
                console.log(`   方法: ${result.mappingMethod}`);
                console.log(`   信頼度: ${result.confidence}`);
                console.log(`   esa用户: ${result.esaUser?.screen_name}`);
                console.log(`   処理時間: ${result.processingTime}ms`);
                
                if (result.mappingMethod === 'auto_email') {
                    console.log(`🎉 メールアドレスマッピング復活成功！`);
                }
            } else {
                console.log(`❌ マッピング失敗: ${result.error}`);
            }
            
        } catch (error) {
            console.log(`💥 テストエラー: ${error.message}`);
        }
        
        // API制限を考慮して待機
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📈 esa メンバー情報取得テスト:');
    console.log('-'.repeat(50));
    
    try {
        const members = await migrationManager.getEsaMembers();
        
        if (members && members.length > 0) {
            console.log(`✅ メンバー情報取得成功: ${members.length}人`);
            
            const emailMembers = members.filter(m => m.email);
            console.log(`📧 メールアドレス付きメンバー: ${emailMembers.length}人`);
            
            if (emailMembers.length > 0) {
                console.log('🎉 メールアドレス取得機能が正常に動作しています！');
                console.log('サンプル:', emailMembers.slice(0, 3).map(m => 
                    `${m.screen_name} (${m.email})`
                ).join(', '));
            } else {
                console.log('⚠️ メールアドレスが取得できていません');
            }
        } else {
            console.log('❌ メンバー情報取得失敗');
        }
        
    } catch (error) {
        console.log(`💥 メンバー情報取得エラー: ${error.message}`);
    }
    
    console.log('\n🎯 テスト完了');
    console.log('='.repeat(80));
}

// テスト実行
if (require.main === module) {
    testNewEsaMCPMapping()
        .then(() => {
            console.log('\n✅ 全テスト完了');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 テスト実行エラー:', error);
            process.exit(1);
        });
}

module.exports = testNewEsaMCPMapping;

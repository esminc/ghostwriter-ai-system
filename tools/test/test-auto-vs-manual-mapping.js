// 自動マッピング vs 手動マッピング 比較テスト
const dotenv = require('dotenv');
const AutoUserMapper = require('../../src/services/auto-user-mapper');

// 環境変数の読み込み
dotenv.config();

async function testAutoVsManualMapping() {
    console.log('🔄 自動マッピング vs 手動マッピング比較テスト開始...\n');
    
    const mapper = new AutoUserMapper();
    
    // 現在の手動マッピング設定
    const manualMappings = {
        slack_to_esa: {
            "takuya.okamoto": "okamoto-takuya",
            "takuya_okamoto": "okamoto-takuya", 
            "takuya-okamoto": "okamoto-takuya"
        }
    };
    
    try {
        // 1. 手動マッピングとの比較実行
        console.log('📊 手動マッピング設定との比較...');
        const comparisonResult = await mapper.compareWithManualMapping(manualMappings);
        
        // 2. 比較結果の詳細分析
        console.log('\n🔍 詳細分析:');
        comparisonResult.comparisons.forEach((comp, index) => {
            console.log(`\n${index + 1}. ${comp.slackName}`);
            console.log(`   📝 手動設定: ${comp.manualEsaName}`);
            
            if (comp.autoSuccess) {
                console.log(`   🤖 自動結果: ${comp.autoEsaName}`);
                console.log(`   📈 方法: ${comp.autoMethod}`);
                console.log(`   🎯 信頼度: ${(comp.autoConfidence * 100).toFixed(1)}%`);
                console.log(`   ✅ 一致: ${comp.match ? 'はい' : 'いいえ'}`);
            } else {
                console.log(`   ❌ 自動結果: マッピング失敗`);
            }
        });
        
        // 3. 総合評価
        console.log('\n📊 総合評価:');
        const stats = comparisonResult.stats;
        
        console.log(`   🧮 総テスト数: ${stats.total}`);
        console.log(`   ✅ 自動マッピング成功率: ${(stats.successRate * 100).toFixed(1)}%`);
        console.log(`   🎯 手動マッピング一致率: ${(stats.matchRate * 100).toFixed(1)}%`);
        
        // 4. 推奨事項
        console.log('\n💡 推奨事項:');
        
        if (stats.matchRate >= 0.8) {
            console.log('   🎉 自動マッピング導入を強く推奨');
            console.log('   📈 80%以上の精度で手動マッピングを代替可能');
        } else if (stats.matchRate >= 0.6) {
            console.log('   ✅ 自動マッピング導入を推奨');
            console.log('   ⚠️ 一部のケースで手動調整が必要');
        } else {
            console.log('   ⚠️ 自動マッピングアルゴリズムの改善が必要');
            console.log('   🔧 追加の調整・改良を実施後に再評価');
        }
        
        // 5. 追加テストケース
        console.log('\n🧪 追加テストケース:');
        
        const additionalTests = [
            {
                id: 'U12345678',
                name: 'john.doe',
                profile: { email: 'john.doe@example.com' },
                real_name: 'John Doe'
            },
            {
                id: 'U87654321', 
                name: 'test_user',
                profile: { email: 'test.user@example.com' },
                real_name: 'Test User'
            }
        ];
        
        for (const testUser of additionalTests) {
            console.log(`\n🔍 テスト: ${testUser.name}`);
            const result = await mapper.testMapping(testUser);
            
            if (result.success) {
                console.log(`   ✅ 成功: ${result.esaUser.screen_name} (${result.mappingMethod})`);
                console.log(`   🎯 信頼度: ${(result.confidence * 100).toFixed(1)}%`);
            } else {
                console.log(`   ❌ 失敗: ${result.error}`);
            }
        }
        
        // 6. パフォーマンス統計
        console.log('\n⚡ パフォーマンス統計:');
        const mappingStats = mapper.getMappingStats();
        console.log(`   💾 キャッシュサイズ: ${mappingStats.cacheSize}`);
        console.log(`   🕐 最終更新: ${mappingStats.lastEsaMembersUpdate ? new Date(mappingStats.lastEsaMembersUpdate).toLocaleString() : 'N/A'}`);
        console.log(`   👥 esaメンバー数: ${mappingStats.esaMembersCount}`);
        
    } catch (error) {
        console.error('❌ テスト実行エラー:', error.message);
        console.error('🔍 詳細:', error.stack);
    }
    
    console.log('\n🎉 比較テスト完了！');
}

// メイン実行
if (require.main === module) {
    testAutoVsManualMapping().catch(error => {
        console.error('❌ 致命的エラー:', error);
        process.exit(1);
    });
}

module.exports = testAutoVsManualMapping;
#!/usr/bin/env node

// esa API接続テスト用スクリプト
const dotenv = require('dotenv');
const EsaAPI = require('../../src/services/esa-api');

// 環境変数の読み込み
dotenv.config();

async function testEsaConnection() {
    console.log('🔄 esa API接続テスト開始...\n');
    
    // EsaAPIインスタンス作成
    const esaAPI = new EsaAPI(process.env.ESA_TEAM_NAME, process.env.ESA_ACCESS_TOKEN);
    
    try {
        // 1. 基本接続テスト
        console.log('📡 Step 1: 基本接続テスト');
        const connectionResult = await esaAPI.testConnection();
        
        if (!connectionResult.success) {
            console.log('❌ 接続テスト失敗:', connectionResult.error);
            return;
        }
        
        console.log('✅ 接続テスト成功\n');
        
        // 2. 検索機能テスト
        console.log('🔍 Step 2: 検索機能テスト');
        
        // 全記事検索
        console.log('🔎 全記事検索テスト...');
        const allPostsResult = await esaAPI.searchPosts('', { per_page: 5 });
        
        if (allPostsResult.success) {
            console.log(`✅ 全記事検索成功: ${allPostsResult.total_count}件中${allPostsResult.posts.length}件表示`);
            allPostsResult.posts.forEach(post => {
                console.log(`  - #${post.number}: ${post.name} (作成者: ${post.created_by.screen_name})`);
            });
        } else {
            console.log('❌ 全記事検索失敗:', allPostsResult.error);
        }
        
        console.log();
        
        // 3. ユーザー検索テスト
        console.log('👤 Step 3: ユーザー検索テスト');
        
        // メンバー一覧から最初のユーザーをテスト対象にする
        if (connectionResult.members && connectionResult.members.length > 0) {
            const testUser = connectionResult.members[0].screen_name;
            console.log(`🔎 テスト対象ユーザー: ${testUser}`);
            
            const userPostsResult = await esaAPI.getUserDiaryPosts(testUser, 10);
            
            if (userPostsResult.success) {
                console.log(`✅ ${testUser}の記事検索成功: ${userPostsResult.total_found}件`);
                if (userPostsResult.posts.length > 0) {
                    console.log('📝 取得した記事:');
                    userPostsResult.posts.slice(0, 3).forEach(post => {
                        console.log(`  - #${post.number}: ${post.name}`);
                        console.log(`    カテゴリ: ${post.category || 'なし'}`);
                        console.log(`    更新日: ${post.updated_at}`);
                    });
                } else {
                    console.log('📝 該当する記事が見つかりませんでした');
                }
            } else {
                console.log(`❌ ${testUser}の記事検索失敗:`, userPostsResult.error);
            }
        }
        
        console.log();
        
        // 4. takuya.okamotoユーザーの検索テスト
        console.log('👤 Step 4: takuya.okamotoユーザーの検索テスト');
        
        const takuyaPostsResult = await esaAPI.getUserDiaryPosts('takuya.okamoto', 10);
        
        if (takuyaPostsResult.success) {
            console.log(`✅ takuya.okamotoの記事検索成功: ${takuyaPostsResult.total_found}件`);
            if (takuyaPostsResult.posts.length > 0) {
                console.log('📝 取得した記事:');
                takuyaPostsResult.posts.slice(0, 5).forEach(post => {
                    console.log(`  - #${post.number}: ${post.name}`);
                    console.log(`    カテゴリ: ${post.category || 'なし'}`);
                    console.log(`    作成者: ${post.created_by.screen_name}`);
                    console.log(`    更新者: ${post.updated_by.screen_name}`);
                    console.log(`    更新日: ${post.updated_at}`);
                    console.log();
                });
            } else {
                console.log('📝 該当する記事が見つかりませんでした');
                console.log('🔍 詳細検索を試行中...');
                
                // 詳細検索パターンを個別にテスト
                const detailedSearchPatterns = [
                    'user:takuya.okamoto',
                    'updated_by:takuya.okamoto', 
                    'created_by:takuya.okamoto',
                    'takuya.okamoto',
                    'takuya',
                    'okamoto'
                ];
                
                for (const pattern of detailedSearchPatterns) {
                    console.log(`🔎 検索パターン "${pattern}" をテスト...`);
                    const result = await esaAPI.searchPosts(pattern, { per_page: 3 });
                    if (result.success && result.posts.length > 0) {
                        console.log(`  ✅ ${result.posts.length}件見つかりました`);
                        result.posts.forEach(post => {
                            console.log(`    - #${post.number}: ${post.name} (${post.created_by.screen_name})`);
                        });
                    } else {
                        console.log(`  ❌ 見つかりませんでした`);
                    }
                }
            }
        } else {
            console.log(`❌ takuya.okamotoの記事検索失敗:`, takuyaPostsResult.error);
        }
        
        console.log('\n🎉 テスト完了!');
        
    } catch (error) {
        console.error('❌ テスト中にエラーが発生:', error);
        console.error('スタックトレース:', error.stack);
    }
}

// メイン実行
if (require.main === module) {
    testEsaConnection().then(() => {
        console.log('🏁 テストスクリプト終了');
        process.exit(0);
    }).catch(error => {
        console.error('❌ 致命的エラー:', error);
        process.exit(1);
    });
}

module.exports = { testEsaConnection };

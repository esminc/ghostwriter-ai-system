#!/usr/bin/env node

// 簡単なesa API接続テスト
const dotenv = require('dotenv');
const axios = require('axios');

// 環境変数の読み込み
dotenv.config();

async function quickTest() {
    console.log('🔄 クイック接続テスト開始...');
    
    const teamName = process.env.ESA_TEAM_NAME;
    const accessToken = process.env.ESA_ACCESS_TOKEN;
    
    console.log(`📡 チーム: ${teamName}`);
    console.log(`🔑 トークン: ${accessToken ? '設定済み' : '未設定'}`);
    
    if (!accessToken) {
        console.log('❌ アクセストークンが設定されていません');
        return;
    }
    
    try {
        // チーム情報取得テスト
        const teamUrl = `https://api.esa.io/v1/teams/${teamName}`;
        console.log(`🔍 リクエスト: ${teamUrl}`);
        
        const response = await axios.get(teamUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ チーム情報取得成功:');
        console.log(`   名前: ${response.data.name}`);
        console.log(`   説明: ${response.data.description || 'なし'}`);
        console.log(`   メンバー数: ${response.data.members_count}人`);
        
        // メンバー一覧取得テスト
        console.log('\n👥 メンバー一覧取得テスト...');
        const membersUrl = `https://api.esa.io/v1/teams/${teamName}/members`;
        
        const membersResponse = await axios.get(membersUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ メンバー一覧取得成功:');
        membersResponse.data.members.forEach(member => {
            console.log(`   - ${member.screen_name} (${member.name})`);
        });
        
        // 記事検索テスト
        console.log('\n🔍 記事検索テスト...');
        const searchUrl = `https://api.esa.io/v1/teams/${teamName}/posts`;
        
        const searchResponse = await axios.get(searchUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            params: {
                q: '',
                per_page: 5
            }
        });
        
        console.log('✅ 記事検索成功:');
        console.log(`   総記事数: ${searchResponse.data.total_count}件`);
        searchResponse.data.posts.forEach(post => {
            console.log(`   - #${post.number}: ${post.name}`);
            console.log(`     作成者: ${post.created_by.screen_name}`);
            console.log(`     カテゴリ: ${post.category || 'なし'}`);
        });
        
        // takuya.okamoto ユーザーの記事検索
        console.log('\n👤 takuya.okamotoユーザーの記事検索...');
        
        const userSearchPatterns = [
            'user:takuya.okamoto',
            'updated_by:takuya.okamoto',
            'created_by:takuya.okamoto',
            'takuya.okamoto',
            'takuya'
        ];
        
        for (const pattern of userSearchPatterns) {
            console.log(`🔎 検索パターン: "${pattern}"`);
            
            const userSearchResponse = await axios.get(searchUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    q: pattern,
                    per_page: 3
                }
            });
            
            if (userSearchResponse.data.posts.length > 0) {
                console.log(`   ✅ ${userSearchResponse.data.posts.length}件見つかりました:`);
                userSearchResponse.data.posts.forEach(post => {
                    console.log(`     - #${post.number}: ${post.name}`);
                    console.log(`       作成者: ${post.created_by.screen_name}`);
                    console.log(`       更新者: ${post.updated_by.screen_name}`);
                });
                break;
            } else {
                console.log(`   ❌ 見つかりませんでした`);
            }
        }
        
        console.log('\n🎉 テスト完了!');
        
    } catch (error) {
        console.error('❌ エラー発生:', error.response?.data || error.message);
        if (error.response) {
            console.error('   ステータス:', error.response.status);
            console.error('   URL:', error.config?.url);
        }
    }
}

quickTest().catch(console.error);

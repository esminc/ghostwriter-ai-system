#!/usr/bin/env node

// Slack API権限テスト
require('dotenv').config();
const { WebClient } = require('@slack/web-api');

async function testSlackPermissions() {
    console.log('🔍 Slack API権限テスト開始...\n');
    
    const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    
    try {
        // Bot情報取得
        console.log('🤖 Bot情報確認...');
        const authTest = await slack.auth.test();
        console.log(`✅ Bot User ID: ${authTest.user_id}`);
        console.log(`✅ Team: ${authTest.team}`);
        console.log(`✅ User: ${authTest.user}`);
        
        // 権限テスト: あなたのユーザー情報取得
        console.log('\n👤 ユーザー情報取得テスト...');
        const userInfo = await slack.users.info({ 
            user: 'U040L7EJC0Z' // あなたのSlack ID
        });
        
        console.log('📋 取得できた情報:');
        console.log(`   - ID: ${userInfo.user.id}`);
        console.log(`   - Name: ${userInfo.user.name}`);
        console.log(`   - Real Name: ${userInfo.user.real_name}`);
        console.log(`   - Display Name: ${userInfo.user.display_name}`);
        console.log(`   - Email: ${userInfo.user.profile.email || 'undefined'}`);
        console.log(`   - Email (direct): ${userInfo.user.email || 'undefined'}`);
        
        // 権限判定
        if (userInfo.user.profile.email) {
            console.log('\n✅ users:read.email権限は正常に動作しています！');
            console.log(`📧 取得したEmail: ${userInfo.user.profile.email}`);
        } else {
            console.log('\n❌ users:read.email権限が不足しています');
            console.log('🔧 解決方法:');
            console.log('   1. Slack App管理画面でusers:read.email権限を追加');
            console.log('   2. ワークスペースに再インストール');
            console.log('   3. 新しいBot Tokenを.envに設定');
        }
        
    } catch (error) {
        console.error('❌ Slack API エラー:', error.message);
        
        if (error.data?.error === 'missing_scope') {
            console.log('\n🔧 権限不足エラーです');
            console.log('必要な権限を追加してワークスペースに再インストールしてください');
        }
    }
}

testSlackPermissions().catch(console.error);

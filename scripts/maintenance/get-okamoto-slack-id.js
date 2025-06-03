#!/usr/bin/env node

// SlackユーザーID確認用スクリプト
// okamoto.takuyaの実際のSlackユーザーIDを取得

require('dotenv').config();

async function getOkamotoTakuyaSlackID() {
    console.log('🔍 okamoto.takuyaの実際のSlackユーザーID確認中...');
    console.log('');
    
    try {
        // Slack Web APIを直接使用してユーザー情報を取得
        const { WebClient } = require('@slack/web-api');
        const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
        
        console.log('👥 Slack Web API経由でユーザー一覧取得中...');
        
        // ユーザー一覧をページネーションで全取得
        let allUsers = [];
        let cursor = undefined;
        
        do {
            const result = await slack.users.list({
                limit: 200,
                cursor: cursor
            });
            
            allUsers = allUsers.concat(result.members);
            cursor = result.response_metadata?.next_cursor;
            
            console.log(`   取得済みユーザー数: ${allUsers.length}`);
            
        } while (cursor);
        
        console.log(`✅ 全ユーザー取得完了: ${allUsers.length}名`);
        console.log('');
        
        // okamoto/takuya関連の検索
        console.log('🔍 okamoto関連ユーザー検索:');
        const okamotoUsers = allUsers.filter(user => {
            const name = (user.name || '').toLowerCase();
            const realName = (user.real_name || '').toLowerCase();
            const displayName = (user.profile?.display_name || '').toLowerCase();
            const email = (user.profile?.email || '').toLowerCase();
            
            return (name.includes('okamoto') || 
                    realName.includes('okamoto') || 
                    displayName.includes('okamoto') || 
                    email.includes('okamoto')) && 
                   !user.deleted && !user.is_bot;
        });
        
        okamotoUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (ID: ${user.id})`);
            console.log(`   実名: ${user.real_name}`);
            console.log(`   表示名: ${user.profile?.display_name}`);
            console.log(`   メール: ${user.profile?.email}`);
            console.log(`   削除済み: ${user.deleted}`);
            console.log('');
        });
        
        console.log('🔍 takuya関連ユーザー検索:');
        const takuyaUsers = allUsers.filter(user => {
            const name = (user.name || '').toLowerCase();
            const realName = (user.real_name || '').toLowerCase();
            const displayName = (user.profile?.display_name || '').toLowerCase();
            const email = (user.profile?.email || '').toLowerCase();
            
            return (name.includes('takuya') || 
                    realName.includes('takuya') || 
                    displayName.includes('takuya') || 
                    email.includes('takuya')) && 
                   !user.deleted && !user.is_bot;
        });
        
        takuyaUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (ID: ${user.id})`);
            console.log(`   実名: ${user.real_name}`);
            console.log(`   表示名: ${user.profile?.display_name}`);
            console.log(`   メール: ${user.profile?.email}`);
            console.log(`   削除済み: ${user.deleted}`);
            console.log('');
        });
        
        // 完全なメールアドレス検索
        console.log('🎯 完全メールアドレス検索: takuya.okamoto@esm.co.jp');
        const exactUser = allUsers.find(user => 
            user.profile?.email === 'takuya.okamoto@esm.co.jp'
        );
        
        if (exactUser) {
            console.log(`✅ 発見！ユーザーID: ${exactUser.id}`);
            console.log(`   ユーザー名: ${exactUser.name}`);
            console.log(`   実名: ${exactUser.real_name}`);
            console.log(`   表示名: ${exactUser.profile?.display_name}`);
            console.log(`   メール: ${exactUser.profile?.email}`);
            console.log(`   削除済み: ${exactUser.deleted}`);
            console.log(`   Bot: ${exactUser.is_bot}`);
            console.log('');
            console.log('🎉 このユーザーIDを使用してマッピングを修正できます！');
            
            return exactUser;
        } else {
            console.log('❌ 完全一致するメールアドレスが見つかりません');
            
            // 類似メールアドレス検索
            console.log('');
            console.log('🔍 類似メールアドレス検索:');
            const similarEmails = allUsers
                .filter(user => user.profile?.email?.includes('okamoto') && !user.deleted)
                .map(user => ({
                    id: user.id,
                    name: user.name,
                    email: user.profile.email,
                    real_name: user.real_name
                }));
            
            if (similarEmails.length > 0) {
                console.log('類似メールアドレス:');
                similarEmails.forEach(user => {
                    console.log(`   ${user.email} (${user.name} - ${user.real_name})`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Slack API エラー:', error.message);
        
        if (error.message.includes('missing_scope')) {
            console.log('');
            console.log('🔧 解決方法:');
            console.log('   Slack Botに users:read および users:read.email スコープが必要です');
            console.log('   Slack App設定でスコープを追加してください');
        }
    }
}

// メイン実行
if (require.main === module) {
    getOkamotoTakuyaSlackID()
        .then(() => {
            console.log('✅ SlackユーザーID確認完了');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ 実行エラー:', error);
            process.exit(1);
        });
}

module.exports = getOkamotoTakuyaSlackID;

#!/usr/bin/env node

// Slack API権限とBot設定確認
require('dotenv').config();

const SlackMCPWrapperDirect = require('./src/mcp-integration/slack-mcp-wrapper-direct.js');

async function checkSlackPermissions() {
    console.log('🔍 Slack API権限・Bot設定確認');
    console.log('===============================================');
    
    const slackWrapper = new SlackMCPWrapperDirect();
    
    try {
        await slackWrapper.initialize();
        
        console.log('📊 環境変数確認:');
        console.log(`SLACK_BOT_TOKEN: ${process.env.SLACK_BOT_TOKEN ? process.env.SLACK_BOT_TOKEN.substring(0, 20) + '...' : '未設定'}`);
        console.log(`SLACK_TEAM_ID: ${process.env.SLACK_TEAM_ID || '未設定'}`);
        console.log(`SLACK_CHANNEL_IDS: ${process.env.SLACK_CHANNEL_IDS || '未設定'}`);
        
        // Step 1: Bot情報確認
        console.log('\n🤖 Bot情報確認:');
        try {
            const usersResult = await slackWrapper.mcpClient.slackMCPClient.callTool({
                name: "slack_get_users",
                arguments: {}
            });
            
            const usersData = slackWrapper.mcpClient.parseSlackMCPResponse(usersResult);
            const users = usersData?.members || [];
            
            console.log(`✅ ユーザー一覧取得: ${users.length}件`);
            
            // Bot自身の情報を検索
            const botUsers = users.filter(user => user.is_bot);
            console.log(`🤖 Bot数: ${botUsers.length}件`);
            
            if (botUsers.length > 0) {
                console.log('Bot一覧:');
                botUsers.slice(0, 5).forEach(bot => {
                    console.log(`  - ${bot.name} (${bot.id})`);
                });
            }
            
            // 指定ユーザーの確認
            const targetUser = users.find(user => user.id === 'U040L7EJC0Z');
            if (targetUser) {
                console.log(`✅ 対象ユーザー確認: ${targetUser.real_name || targetUser.name} (${targetUser.id})`);
            } else {
                console.log('❌ 対象ユーザーが見つかりません');
            }
            
        } catch (error) {
            console.log(`❌ ユーザー一覧取得エラー: ${error.message}`);
        }
        
        // Step 2: 直接的なAPI権限テスト
        console.log('\n🔧 直接API権限テスト:');
        
        const permissionTests = [
            {
                name: 'チャンネル一覧',
                tool: 'slack_list_channels',
                args: {}
            },
            {
                name: 'ユーザープロフィール',
                tool: 'slack_get_user_profile',
                args: { user_id: 'U040L7EJC0Z' }
            }
        ];
        
        for (const test of permissionTests) {
            try {
                console.log(`  🔍 ${test.name}:`, );
                const result = await slackWrapper.mcpClient.slackMCPClient.callTool({
                    name: test.tool,
                    arguments: test.args
                });
                
                const data = slackWrapper.mcpClient.parseSlackMCPResponse(result);
                
                if (test.tool === 'slack_list_channels') {
                    const channels = data?.channels || [];
                    console.log(`✅ 成功 - ${channels.length}件のチャンネル`);
                    
                    if (channels.length > 0) {
                        console.log('     チャンネル例:');
                        channels.slice(0, 3).forEach(ch => {
                            console.log(`       - #${ch.name} (${ch.id})`);
                        });
                    }
                } else if (test.tool === 'slack_get_user_profile') {
                    console.log(`✅ 成功 - ユーザー: ${data?.real_name || data?.name || 'unknown'}`);
                }
                
            } catch (error) {
                console.log(`❌ 失敗: ${error.message}`);
            }
        }
        
        // Step 3: 環境変数に基づく推奨設定
        console.log('\n📋 推奨される対応:');
        console.log('1. Slack App設定でBot Token Scopesを確認');
        console.log('   必要な権限:');
        console.log('   - channels:history (パブリックチャンネルの履歴読み取り)');
        console.log('   - channels:read (チャンネル情報読み取り)');
        console.log('   - users:read (ユーザー情報読み取り)');
        console.log('   - users:read.email (ユーザーメール読み取り)');
        console.log('');
        console.log('2. Slack App を ESM Workspace に再インストール');
        console.log('3. 新しいBot User OAuth Tokenで環境変数を更新');
        
        await slackWrapper.cleanup();
        
    } catch (error) {
        console.error('❌ 権限確認エラー:', error);
    }
}

checkSlackPermissions();

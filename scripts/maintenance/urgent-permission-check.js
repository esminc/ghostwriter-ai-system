#!/usr/bin/env node

// 緊急権限確認 - チャンネル一覧取得問題の解決
require('dotenv').config();

async function urgentPermissionCheck() {
    console.log('🚨 緊急権限確認 - チャンネル一覧取得問題');
    console.log('=======================================\n');
    
    const token = process.env.SLACK_BOT_TOKEN;
    const teamId = process.env.SLACK_TEAM_ID;
    
    if (!token) {
        console.log('❌ SLACK_BOT_TOKEN が設定されていません');
        return;
    }
    
    console.log('📋 **現在の設定**:');
    console.log(`🔑 BOT TOKEN: ${token.substring(0, 15)}...`);
    console.log(`🏢 TEAM ID: ${teamId}`);
    console.log('');
    
    // Slack Web API直接テスト
    const https = require('https');
    
    function slackAPICall(method, data = {}) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(data);
            
            const options = {
                hostname: 'slack.com',
                port: 443,
                path: `/api/${method}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(responseData));
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
    
    try {
        // 1. 認証テスト
        console.log('🔐 **認証テスト**');
        const authResult = await slackAPICall('auth.test');
        if (authResult.ok) {
            console.log(`✅ 認証成功: ${authResult.user} @ ${authResult.team}`);
            console.log(`   ユーザーID: ${authResult.user_id}`);
            console.log(`   チームID: ${authResult.team_id}`);
        } else {
            console.log(`❌ 認証失敗: ${authResult.error}`);
            return;
        }
        
        console.log('');
        
        // 2. チャンネル一覧テスト
        console.log('📁 **チャンネル一覧テスト**');
        const channelsResult = await slackAPICall('conversations.list', {
            types: 'public_channel',
            limit: 100
        });
        
        if (channelsResult.ok) {
            console.log(`✅ channels:read権限: OK`);
            console.log(`📊 取得チャンネル数: ${channelsResult.channels?.length || 0}個`);
            
            if (channelsResult.channels && channelsResult.channels.length > 0) {
                console.log('\n📋 **チャンネル一覧（最初の10個）**:');
                channelsResult.channels.slice(0, 10).forEach((channel, index) => {
                    const mark = channel.id === 'C05JRUFND9P' ? '🎯' : '  ';
                    console.log(`   ${mark} ${index + 1}. #${channel.name} (${channel.id})`);
                });
                
                // #its-wkwk-general を探す
                const targetChannel = channelsResult.channels.find(ch => ch.id === 'C05JRUFND9P');
                if (targetChannel) {
                    console.log(`\n🎯 #its-wkwk-general 発見！`);
                    console.log(`   名前: ${targetChannel.name}`);
                    console.log(`   ID: ${targetChannel.id}`);
                    console.log(`   メンバー数: ${targetChannel.num_members || 'N/A'}`);
                } else {
                    console.log(`\n❌ #its-wkwk-general (C05JRUFND9P) が見つかりません`);
                    console.log('💡 BOTがチャンネルに招待されていない可能性があります');
                }
            } else {
                console.log('\n❌ チャンネルが0個です');
                console.log('🔧 可能な原因:');
                console.log('   1. channels:read権限が不足');
                console.log('   2. BOTがワークスペースにインストールされていない');
                console.log('   3. BOTがチャンネルに招待されていない');
            }
        } else {
            console.log(`❌ channels:read権限エラー: ${channelsResult.error}`);
        }
        
        console.log('');
        
        // 3. 権限スコープ確認
        console.log('🔍 **権限スコープ確認**');
        const scopesResult = await slackAPICall('auth.test');
        if (scopesResult.ok && scopesResult.response_metadata) {
            console.log('権限情報が利用可能です');
        }
        
        // 4. 具体的なアクション提案
        console.log('\n🎯 **具体的な解決アクション**:');
        console.log('');
        console.log('1. Slack App設定ページにアクセス:');
        console.log('   https://api.slack.com/apps');
        console.log('');
        console.log('2. GhostWriterアプリを選択');
        console.log('');
        console.log('3. OAuth & Permissions > Bot Token Scopesで以下を確認:');
        console.log('   ✅ channels:read');
        console.log('   ✅ channels:history');
        console.log('   ✅ users:read');
        console.log('   ✅ chat:write');
        console.log('');
        console.log('4. 権限を追加したら「Reinstall to Workspace」');
        console.log('');
        console.log('5. BOTを#its-wkwk-generalに招待:');
        console.log('   /invite @GhostWriter');
        
    } catch (error) {
        console.error('❌ 権限確認エラー:', error.message);
        console.log('\n🔧 トークンまたはネットワーク問題の可能性があります');
    }
}

urgentPermissionCheck()
    .then(() => {
        console.log('\n🎯 緊急権限確認完了');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ 確認中にエラー:', error);
        process.exit(1);
    });

#!/usr/bin/env node

// チャンネル一覧確認とメッセージ検索
require('dotenv').config();

const SlackMCPWrapperDirect = require('./src/mcp-integration/slack-mcp-wrapper-direct.js');

async function investigateChannels(userId) {
    console.log('🔍 チャンネル調査・メッセージ検索');
    console.log('===============================================');
    
    const slackWrapper = new SlackMCPWrapperDirect();
    
    try {
        await slackWrapper.initialize();
        
        // Step 1: 利用可能なチャンネル一覧を取得
        console.log('\n📁 利用可能なチャンネル一覧取得中...');
        
        const channelsResult = await slackWrapper.mcpClient.slackMCPClient.callTool({
            name: "slack_list_channels",
            arguments: {}
        });
        
        const channelsData = slackWrapper.mcpClient.parseSlackMCPResponse(channelsResult);
        const channels = channelsData?.channels || [];
        
        console.log(`✅ 取得できたチャンネル数: ${channels.length}件`);
        
        if (channels.length > 0) {
            console.log('\n📋 チャンネル一覧:');
            channels.forEach((channel, index) => {
                console.log(`${index + 1}. ${channel.name} (${channel.id})`);
                console.log(`   メンバー数: ${channel.num_members || 'N/A'}`);
                console.log(`   トピック: ${channel.topic?.value || 'なし'}`);
                console.log(`   種類: ${channel.is_private ? 'プライベート' : 'パブリック'}`);
                console.log();
            });
        }
        
        // Step 2: 各チャンネルでメッセージ検索（最新10件のみ）
        console.log('\n🔍 各チャンネルのメッセージ確認（最新10件）:');
        
        for (const [index, channel] of channels.slice(0, 10).entries()) {
            console.log(`\n${index + 1}. #${channel.name} (${channel.id}):`);
            
            try {
                const historyResult = await slackWrapper.mcpClient.slackMCPClient.callTool({
                    name: "slack_get_channel_history",
                    arguments: {
                        channel_id: channel.id,
                        limit: 10
                    }
                });
                
                const historyData = slackWrapper.mcpClient.parseSlackMCPResponse(historyResult);
                const messages = historyData?.messages || [];
                
                console.log(`   📊 メッセージ数: ${messages.length}件`);
                
                // ユーザー指定のメッセージを検索
                const userMessages = messages.filter(msg => 
                    msg.user === userId && 
                    msg.type === 'message' &&
                    !msg.subtype
                );
                
                console.log(`   👤 ${userId}のメッセージ: ${userMessages.length}件`);
                
                if (userMessages.length > 0) {
                    console.log('   🎯 岡本さんのメッセージ発見！');
                    userMessages.forEach((msg, msgIndex) => {
                        const msgDate = new Date(parseFloat(msg.ts) * 1000);
                        const text = msg.text ? msg.text.substring(0, 80) : '[添付ファイルまたはその他]';
                        console.log(`     ${msgIndex + 1}. [${msgDate.toLocaleString('ja-JP')}] ${text}...`);
                    });
                }
                
                // 最新のメッセージも表示（ユーザー問わず）
                if (messages.length > 0 && userMessages.length === 0) {
                    const latestMsg = messages[0];
                    const msgDate = new Date(parseFloat(latestMsg.ts) * 1000);
                    console.log(`   💬 最新メッセージ: [${msgDate.toLocaleString('ja-JP')}] ${latestMsg.user || 'unknown'}`);
                }
                
            } catch (error) {
                console.log(`   ❌ エラー: ${error.message}`);
            }
        }
        
        await slackWrapper.cleanup();
        
    } catch (error) {
        console.error('❌ チャンネル調査エラー:', error);
    }
}

// ユーザーIDを取得
const userId = process.argv[2] || 'U040L7EJC0Z';
investigateChannels(userId);

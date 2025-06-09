#!/usr/bin/env node

// 正しいワークスペースでユーザーIDを検索
require('dotenv').config();

async function findCorrectUserId() {
    console.log('🔍 正しいワークスペースでのユーザーID検索...\n');
    
    const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
    const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
    
    const transport = new StdioClientTransport({
        command: "/Users/takuya/.nvm/versions/node/v18.18.2/bin/npx",
        args: ["-y", "@modelcontextprotocol/server-slack"],
        env: {
            ...process.env,
            PATH: process.env.PATH,
            SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
            SLACK_TEAM_ID: "T03UB90V6DU", // 正しいTeam ID使用
            SLACK_CHANNEL_IDS: process.env.SLACK_CHANNEL_IDS || ""
        }
    });
    
    const client = new Client({
        name: "find-user-id",
        version: "1.0.0"
    });
    
    try {
        await client.connect(transport);
        console.log('✅ 正しいワークスペースに接続');
        
        // ユーザー一覧取得
        const usersResult = await client.callTool({
            name: "slack_get_users",
            arguments: {}
        });
        
        const usersData = JSON.parse(usersResult.content[0].text);
        console.log(`📊 ワークスペース T03UB90V6DU のユーザー数: ${usersData.members.length}人\n`);
        
        // takuya.okamoto関連のユーザーを検索
        console.log('🔍 takuya.okamoto または okamoto-takuya を検索中...');
        
        const possibleUsers = usersData.members.filter(user => {
            const name = (user.name || '').toLowerCase();
            const realName = (user.real_name || '').toLowerCase();
            const email = (user.profile?.email || '').toLowerCase();
            
            return name.includes('takuya') || 
                   name.includes('okamoto') ||
                   realName.includes('takuya') || 
                   realName.includes('okamoto') ||
                   email.includes('takuya.okamoto') ||
                   email.includes('okamoto');
        });
        
        if (possibleUsers.length > 0) {
            console.log('🎯 候補ユーザー発見:');
            possibleUsers.forEach(user => {
                console.log(`📋 ユーザー詳細:`);
                console.log(`  ID: ${user.id}`);
                console.log(`  名前: ${user.name}`);
                console.log(`  実名: ${user.real_name || 'N/A'}`);
                console.log(`  Email: ${user.profile?.email || 'N/A'}`);
                console.log(`  表示名: ${user.profile?.display_name || 'N/A'}`);
                console.log(`---`);
            });
        } else {
            console.log('⚠️ takuya.okamoto関連のユーザーが見つかりません');
            console.log('\n📋 全ユーザーリスト（最初の10人）:');
            usersData.members.slice(0, 10).forEach(user => {
                console.log(`  ${user.id}: ${user.name} (${user.real_name || 'No real name'}) - ${user.profile?.email || 'No email'}`);
            });
        }
        
        // チャンネル一覧も再確認
        console.log('\n📁 チャンネル一覧再確認...');
        const channelsResult = await client.callTool({
            name: "slack_list_channels",
            arguments: {}
        });
        
        const channelsData = JSON.parse(channelsResult.content[0].text);
        console.log(`📊 利用可能チャンネル数: ${channelsData.channels.length}個`);
        
        if (channelsData.channels.length > 0) {
            console.log('✅ チャンネル一覧（最初の5個）:');
            channelsData.channels.slice(0, 5).forEach(channel => {
                console.log(`  ${channel.id}: #${channel.name}`);
            });
        }
        
        await client.close();
        
    } catch (error) {
        console.error('❌ エラー:', error.message);
    }
}

findCorrectUserId();

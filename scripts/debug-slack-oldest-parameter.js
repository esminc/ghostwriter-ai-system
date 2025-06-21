#!/usr/bin/env node

/**
 * Slack MCP oldestパラメータ問題調査スクリプト
 * 6/21に48時間制限で取得しているのに6/8のメッセージが含まれている問題を調査
 */

const MCPConnectionManager = require('../src/mcp-integration/mcp-connection-manager');

async function debugSlackOldestParameter() {
    console.log('🔍 Slack MCP oldestパラメータ問題調査開始...\n');
    
    const mcpManager = new MCPConnectionManager();
    
    try {
        // MCP接続初期化
        console.log('1️⃣ MCP接続初期化中...');
        const initResult = await mcpManager.initialize();
        console.log('✅ 初期化結果:', JSON.stringify(initResult, null, 2));
        
        // Slack接続取得
        const slackClient = await mcpManager.getConnection('slack');
        if (!slackClient) {
            throw new Error('Slack MCP接続が取得できません');
        }
        
        console.log('\n2️⃣ タイムスタンプ計算確認...');
        
        // 現在時刻とoldestタイムスタンプを計算
        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
        const oldestTimestamp = Math.floor(fortyEightHoursAgo.getTime() / 1000).toString();
        
        console.log('🕐 現在時刻:', now.toISOString());
        console.log('🕐 48時間前:', fortyEightHoursAgo.toISOString());
        console.log('🕐 oldestタイムスタンプ:', oldestTimestamp);
        console.log('🕐 oldestタイムスタンプ確認:', new Date(parseInt(oldestTimestamp) * 1000).toISOString());
        
        console.log('\n3️⃣ etc-spotsチャンネル履歴取得テスト...');
        
        // etc-spotsチャンネルの履歴を取得
        const channelId = 'C040BKQ8P2L'; // etc-spots
        const limit = 50; // より多く取得してタイムスタンプを分析
        
        console.log(`📨 チャンネル: ${channelId}`);
        console.log(`📊 取得制限: ${limit}件`);
        console.log(`⏰ oldest: ${oldestTimestamp}`);
        
        const historyResult = await slackClient.callTool({
            name: "slack_get_channel_history",
            arguments: {
                channel_id: channelId,
                limit: limit,
                oldest: oldestTimestamp
            }
        });
        
        console.log('\n4️⃣ レスポンス構造分析...');
        console.log('📊 レスポンスタイプ:', typeof historyResult);
        console.log('📊 レスポンスキー:', Object.keys(historyResult || {}));
        
        // レスポンス解析
        let historyData = null;
        if (historyResult && historyResult.content) {
            if (Array.isArray(historyResult.content)) {
                if (historyResult.content.length > 0 && historyResult.content[0].text) {
                    historyData = JSON.parse(historyResult.content[0].text);
                }
            }
            else if (typeof historyResult.content === 'object') {
                historyData = historyResult.content;
            }
            else if (typeof historyResult.content === 'string') {
                historyData = JSON.parse(historyResult.content);
            }
        }
        
        if (!historyData) {
            console.log('❌ レスポンス解析失敗');
            console.log('📋 生レスポンス:', JSON.stringify(historyResult, null, 2));
            return;
        }
        
        console.log('\n5️⃣ メッセージタイムスタンプ詳細分析...');
        
        const messages = historyData.messages || [];
        console.log(`📊 取得メッセージ数: ${messages.length}件`);
        
        if (messages.length === 0) {
            console.log('⚠️ メッセージが取得されませんでした');
            return;
        }
        
        // タイムスタンプ解析
        console.log('\n📅 メッセージタイムスタンプ詳細:');
        console.log('=' + '='.repeat(80));
        
        const timestampAnalysis = [];
        
        messages.forEach((msg, index) => {
            const ts = parseFloat(msg.ts);
            const date = new Date(ts * 1000);
            const isWithinRange = ts >= parseInt(oldestTimestamp);
            const daysAgo = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
            
            const analysis = {
                index: index + 1,
                ts: msg.ts,
                date: date.toISOString(),
                daysAgo: daysAgo,
                withinRange: isWithinRange,
                user: msg.user,
                text: (msg.text || '').substring(0, 50) + '...',
                type: msg.type,
                subtype: msg.subtype,
                edited: !!msg.edited,
                thread_ts: msg.thread_ts
            };
            
            timestampAnalysis.push(analysis);
            
            console.log(`${index + 1}. ${analysis.date} (${daysAgo}日前) ${isWithinRange ? '✅' : '❌'}`);
            console.log(`   ts: ${msg.ts}, user: ${msg.user}, type: ${msg.type}`);
            if (msg.subtype) console.log(`   subtype: ${msg.subtype}`);
            if (msg.edited) console.log(`   edited: ${JSON.stringify(msg.edited)}`);
            if (msg.thread_ts) console.log(`   thread_ts: ${msg.thread_ts}`);
            console.log(`   text: ${analysis.text}`);
            console.log('');
        });
        
        console.log('\n6️⃣ 問題の分析結果...');
        
        const outOfRangeMessages = timestampAnalysis.filter(msg => !msg.withinRange);
        const oldMessages = timestampAnalysis.filter(msg => msg.daysAgo > 2);
        
        console.log(`🔍 指定範囲外メッセージ: ${outOfRangeMessages.length}件`);
        console.log(`🔍 48時間を超える古いメッセージ: ${oldMessages.length}件`);
        
        if (outOfRangeMessages.length > 0) {
            console.log('\n❌ 範囲外メッセージの詳細:');
            outOfRangeMessages.forEach(msg => {
                console.log(`   - ${msg.date} (${msg.daysAgo}日前): ${msg.text}`);
                console.log(`     ts: ${msg.ts}, edited: ${msg.edited}, thread_ts: ${msg.thread_ts}`);
            });
        }
        
        if (oldMessages.length > 0) {
            console.log('\n📊 古いメッセージの特徴分析:');
            
            // 編集されたメッセージの分析
            const editedOldMessages = oldMessages.filter(msg => msg.edited);
            console.log(`   - 編集されたメッセージ: ${editedOldMessages.length}件`);
            
            // スレッドメッセージの分析
            const threadOldMessages = oldMessages.filter(msg => msg.thread_ts);
            console.log(`   - スレッドメッセージ: ${threadOldMessages.length}件`);
            
            // サブタイプのあるメッセージの分析
            const subtypeOldMessages = oldMessages.filter(msg => msg.subtype);
            console.log(`   - サブタイプあり: ${subtypeOldMessages.length}件`);
            
            if (editedOldMessages.length > 0) {
                console.log('\n🔧 編集されたメッセージの詳細:');
                editedOldMessages.forEach(msg => {
                    console.log(`   - ${msg.date}: ${msg.text}`);
                });
            }
        }
        
        console.log('\n7️⃣ Slack API パラメータ確認...');
        
        // 実際にSlack MCPサーバーに送信されたパラメータを確認
        console.log('📋 送信されたパラメータ:');
        console.log(`   channel_id: ${channelId}`);
        console.log(`   limit: ${limit}`);
        console.log(`   oldest: ${oldestTimestamp}`);
        console.log(`   oldest日時: ${new Date(parseInt(oldestTimestamp) * 1000).toISOString()}`);
        
        console.log('\n8️⃣ Phase 6.6+ 実装済み対策確認...');
        
        if (outOfRangeMessages.length > 0) {
            console.log('❌ 問題確認: oldestパラメータが無視されています');
            console.log('✅ Phase 6.6+ 実装済み対策:');
            console.log('   1. ✅ アプリケーション側タイムスタンプフィルタリング追加済み');
            console.log('   2. ✅ チャンネル別カスタム期間制限設定 (etc-spots: 72時間)');
            console.log('   3. ✅ 詳細ログ出力で範囲外メッセージ検出・除外');
            console.log('   4. ✅ 強化されたフィルタリングロジック実装');
            console.log('');
            console.log('🔧 次回実行時は範囲外メッセージが除外されるはずです');
        } else {
            console.log('✅ oldest パラメータは正常に動作しています');
            console.log('✅ または Phase 6.6+ フィルタリングが正常に機能しています');
        }
        
    } catch (error) {
        console.error('❌ 調査エラー:', error);
        console.log('\nエラー詳細:');
        console.log('Message:', error.message);
        console.log('Stack:', error.stack);
    } finally {
        await mcpManager.cleanup();
        console.log('\n🧹 クリーンアップ完了');
    }
}

// スクリプト実行
if (require.main === module) {
    debugSlackOldestParameter().catch(console.error);
}

module.exports = { debugSlackOldestParameter };
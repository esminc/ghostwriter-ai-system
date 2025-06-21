// リアクション付きメッセージがメッセージフィルタリングに与える影響調査
// 6/8の古い投稿にリアクションが付いた場合の48時間制限への影響を分析

require('dotenv').config();
const SlackMCPWrapperDirect = require('./src/mcp-integration/slack-mcp-wrapper-direct');

async function debugSlackReactionMessages() {
    console.log('🔍 リアクション付きメッセージフィルタリング影響調査開始');
    console.log('🎯 仮説: 6/8の古い投稿にリアクションが付いたため、48時間制限内に含まれている');
    
    const slackWrapper = new SlackMCPWrapperDirect();
    
    try {
        // 初期化
        await slackWrapper.initialize();
        
        // ユーザーID (takuya.okamoto)
        const targetUserId = 'U040L7EJC0Z';
        
        console.log('\n=== Slackデータ取得分析 ===');
        const slackData = await slackWrapper.getUserSlackDataByUserId(targetUserId, {
            analysisMode: 'diary_generation_dynamic_only'
        });
        
        console.log('\n=== チャンネル別メッセージ取得結果 ===');
        const channelBreakdown = slackData.channelBreakdown || {};
        
        Object.entries(channelBreakdown).forEach(([channelName, data]) => {
            console.log(`${channelName}: ${data.count}件取得`);
        });
        
        console.log('\n=== リアクション・タイムスタンプ詳細分析 ===');
        const messages = slackData.todayMessages || [];
        
        // 48時間前のタイムスタンプを計算
        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
        const cutoffTimestamp = Math.floor(fortyEightHoursAgo.getTime() / 1000);
        
        console.log(`現在時刻: ${now.toISOString()}`);
        console.log(`48時間前: ${fortyEightHoursAgo.toISOString()}`);
        console.log(`制限タイムスタンプ: ${cutoffTimestamp}`);
        
        // チャンネル別でメッセージをグループ化
        const messagesByChannel = {};
        messages.forEach(msg => {
            if (!messagesByChannel[msg.channel_name]) {
                messagesByChannel[msg.channel_name] = [];
            }
            messagesByChannel[msg.channel_name].push(msg);
        });
        
        // 各チャンネルのメッセージ内容を表示
        Object.entries(messagesByChannel).forEach(([channelName, channelMessages]) => {
            console.log(`\n--- ${channelName} (${channelMessages.length}件) ---`);
            
            channelMessages.forEach((msg, index) => {
                const msgTimestamp = parseFloat(msg.ts);
                const msgDate = new Date(msgTimestamp * 1000);
                const text = (msg.text || '').substring(0, 80);
                const daysDiff = Math.floor((Date.now() - msgTimestamp * 1000) / (24 * 60 * 60 * 1000));
                const isWithinRange = msgTimestamp >= cutoffTimestamp;
                
                console.log(`${index + 1}. [${msgDate.toISOString().substring(0, 16)}] (${daysDiff}日前) ${isWithinRange ? '✅' : '❌'}`);
                console.log(`     "${text}"`);
                
                // リアクション分析
                if (msg.reactions && msg.reactions.length > 0) {
                    console.log(`     🎭 リアクション: ${msg.reactions.length}個 - ${msg.reactions.map(r => `:${r.name}:(${r.count})`).join(', ')}`);
                }
                
                // スレッド分析
                if (msg.thread_ts) {
                    console.log(`     🧵 スレッド: thread_ts=${msg.thread_ts}`);
                    if (msg.latest_reply) {
                        const latestReplyDate = new Date(parseFloat(msg.latest_reply) * 1000);
                        const replyDaysDiff = Math.floor((Date.now() - parseFloat(msg.latest_reply) * 1000) / (24 * 60 * 60 * 1000));
                        console.log(`        最新返信: ${latestReplyDate.toISOString().substring(0, 16)} (${replyDaysDiff}日前)`);
                    }
                }
                
                // 範囲外メッセージの警告
                if (!isWithinRange) {
                    console.log(`     🚨 範囲外メッセージ: ${daysDiff}日前の投稿が取得されました`);
                    console.log(`        タイムスタンプ: ${msg.ts} (${msgDate.toISOString()})`);
                    
                    // 取得理由の推測
                    const reasons = [];
                    if (msg.reactions && msg.reactions.length > 0) reasons.push('リアクション');
                    if (msg.thread_ts) reasons.push('スレッド');
                    if (msg.edited) reasons.push('編集済み');
                    
                    if (reasons.length > 0) {
                        console.log(`        推測理由: ${reasons.join(', ')}`);
                    }
                    
                    // 6/8の投稿チェック
                    if (msgDate.getMonth() === 5 && msgDate.getDate() === 8) {
                        console.log(`        🎯 重要: 6/8の投稿です！仮説と一致`);
                    }
                }
            });
        });
        
        console.log('\n=== 動的特徴語抽出結果 ===');
        const activityAnalysis = slackData.activityAnalysis || {};
        const characteristicWords = activityAnalysis.characteristicWords || [];
        
        characteristicWords.forEach(wordData => {
            console.log(`- ${wordData.word} (カテゴリ: ${wordData.category}, 頻度: ${wordData.frequency})`);
            
            // 問題の語句を検索
            if (wordData.word.includes('北陸新幹線') || wordData.word.includes('帰ってきました')) {
                console.log(`🚨 問題の特徴語発見: ${wordData.word}`);
            }
        });
        
        console.log('\n=== メッセージ取得期間分析 ===');
        console.log(`取得範囲: ${new Date().toISOString()} から過去48時間`);
        console.log(`oldest タイムスタンプ: ${slackWrapper.getTodayTimestamp()}`);
        
        // Unix timestampを人間が読める形式に変換
        const oldestUnix = parseInt(slackWrapper.getTodayTimestamp());
        const oldestDate = new Date(oldestUnix * 1000);
        console.log(`oldest 日時: ${oldestDate.toISOString()}`);
        
        console.log('\n=== リアクション付きメッセージ影響レポート ===');
        const oldMessages = messages.filter(msg => {
            const msgTimestamp = parseFloat(msg.ts);
            return msgTimestamp < cutoffTimestamp;
        });
        
        if (oldMessages.length > 0) {
            console.log(`🚨 48時間範囲外の古いメッセージ: ${oldMessages.length}件発見`);
            oldMessages.forEach((msg, index) => {
                const msgDate = new Date(parseFloat(msg.ts) * 1000);
                const daysDiff = Math.floor((Date.now() - parseFloat(msg.ts) * 1000) / (24 * 60 * 60 * 1000));
                console.log(`${index + 1}. ${msgDate.toISOString()} (${daysDiff}日前): ${msg.channel_name}`);
                
                if (msg.reactions) {
                    console.log(`   リアクション: ${msg.reactions.map(r => `:${r.name}:`).join(' ')}`);
                }
            });
        } else {
            console.log('✅ 48時間範囲外のメッセージなし - フィルタリング正常');
        }
        
        console.log('\n=== 推奨対策 ===');
        console.log('1. msg.tsでの厳密なタイムスタンプチェック実装');
        console.log('2. リアクション付きメッセージの特別処理');
        console.log('3. Slack MCP Serverのoldestパラメータ制限の理解');
        console.log('4. アプリケーション側でのダブルフィルタリング');
        
    } catch (error) {
        console.error('❌ デバッグ実行エラー:', error);
    } finally {
        await slackWrapper.cleanup();
    }
}

// 実行
debugSlackReactionMessages();
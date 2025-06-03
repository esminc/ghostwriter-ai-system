#!/usr/bin/env node

// 最終確認テスト - 修正版Slack投稿参照機能
require('dotenv').config();

async function finalSlackTest(userId) {
    if (!userId) {
        console.log('❌ 使用方法: node final-slack-test.js [YOUR_USER_ID]');
        console.log('例: node final-slack-test.js U040L7EJC0Z');
        return;
    }
    
    console.log('🎉 最終確認テスト - 修正版Slack投稿参照機能');
    console.log('===============================================');
    console.log(`対象ユーザー: ${userId}`);
    console.log('修正内容: 直接チャンネルアクセス方式\n');
    
    const SlackMCPWrapperDirect = require('./src/mcp-integration/slack-mcp-wrapper-direct.js');
    
    try {
        const slackWrapper = new SlackMCPWrapperDirect();
        await slackWrapper.initialize();
        
        console.log('🔍 **修正版Slackデータ取得実行**');
        const result = await slackWrapper.getUserSlackDataByUserId(userId, {
            includeThreads: true,
            targetChannelId: 'C05JRUFND9P',
            messageLimit: 100,
            secureMode: true
        });
        
        console.log('\n✅ **最終結果**:');
        console.log(`📊 データソース: ${result.dataSource}`);
        console.log(`👤 ユーザー名: ${result.user_name}`);
        console.log(`📝 今日のメッセージ: ${result.todayMessages?.length || 0}件`);
        console.log(`📁 アクセス方法: ${result.accessMethod}`);
        console.log(`🔒 セキュリティ: パブリックチャンネルのみ`);
        
        if (result.todayMessages && result.todayMessages.length > 0) {
            console.log('\n💬 **今日の活動サマリー**:');
            result.todayMessages.forEach((msg, index) => {
                const time = new Date(parseFloat(msg.ts) * 1000).toLocaleTimeString('ja-JP');
                const text = msg.text ? msg.text.substring(0, 80) : '[添付ファイルまたはその他]';
                console.log(`  ${index + 1}. [${time}] ${text}...`);
            });
            
            console.log('\n📈 **活動統計**:');
            console.log(`  チャンネル: ${result.messageStats.channelsActive.join(', ')}`);
            console.log(`  平均リアクション: ${result.messageStats.averageReactions.toFixed(1)}`);
            console.log(`  スレッド参加: ${result.messageStats.threadParticipation}件`);
            
            console.log('\n🧠 **活動分析**:');
            console.log(`  主要トピック: ${result.activityAnalysis.topics.join(', ')}`);
            console.log(`  ムード: ${result.activityAnalysis.mood}`);
            console.log(`  エンゲージメント: ${result.activityAnalysis.engagement}`);
            if (result.activityAnalysis.keyActivities) {
                console.log('  重要な活動:');
                result.activityAnalysis.keyActivities.forEach(activity => {
                    console.log(`    - ${activity}`);
                });
            }
            
            console.log('\n📊 **生産性指標**:');
            console.log(`  スコア: ${(result.productivityMetrics.score * 100).toFixed(0)}%`);
            console.log(`  指標: ${result.productivityMetrics.indicators.join(', ')}`);
        }
        
        console.log('\n🎊 **修正版Slack投稿参照機能テスト完了！**');
        
        if (result.dataSource === 'real_slack_mcp_direct' && result.todayMessages?.length > 0) {
            console.log('\n🎉 **完全成功！**');
            console.log('✅ 修正版Slack投稿参照機能が完全に動作しています！');
            console.log('✅ 直接チャンネルアクセスでデータ取得成功！');
            console.log('✅ 岡本さんの今日の活動を正確に分析！');
            console.log('✅ 日記生成に必要な全データを取得完了！');
            
            console.log('\n📋 **次のステップ**:');
            console.log('1. 日記生成機能のテスト');
            console.log('2. 実際の日記作成実行');
            console.log('3. esaへの投稿テスト');
            
        } else if (result.dataSource === 'real_slack_mcp_direct' && result.todayMessages?.length === 0) {
            console.log('\n⚠️ **データ取得成功、メッセージなし**');
            console.log('✅ 修正版システムは正常動作しています');
            console.log('ℹ️ 今日はまだメッセージがない、または全て非表示メッセージです');
            
        } else {
            console.log('\n❌ **まだフォールバックモードです**');
            console.log('🔧 追加の設定調整が必要かもしれません');
        }
        
        await slackWrapper.cleanup();
        
    } catch (error) {
        console.error('❌ 最終テストエラー:', error.message);
    }
}

// コマンドライン引数からユーザーIDを取得
const userId = process.argv[2];
finalSlackTest(userId);

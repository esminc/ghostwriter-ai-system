#!/usr/bin/env node

// 🔍 Phase 6.5: etc-spotsメッセージ取得問題調査テスト
// Slackメッセージ取得の詳細調査とetc-spotsチャンネル問題の解決確認

const SlackMCPWrapperDirect = require('./src/mcp-integration/slack-mcp-wrapper-direct');

async function testSlackMessageInvestigation() {
    console.log('🔍 Phase 6.5: Slackメッセージ取得問題調査テスト開始');
    console.log('=' * 80);
    
    const slackWrapper = new SlackMCPWrapperDirect();
    
    try {
        // Step 1: 初期化
        console.log('\n📊 Step 1: Slack MCP Wrapper初期化');
        const initResult = await slackWrapper.initialize();
        console.log('初期化結果:', JSON.stringify(initResult, null, 2));
        
        if (!initResult.success && !initResult.fallback_mode) {
            console.log('❌ 初期化失敗、フォールバックモードで続行');
        }
        
        // Step 2: ユーザーデータ取得（詳細ログ付き）
        console.log('\n📊 Step 2: ユーザーSlackデータ取得（詳細調査モード）');
        const userId = 'U040L7EJC0Z'; // okamoto-takuya
        
        console.log(`対象ユーザー: ${userId}`);
        console.log('対象チャンネル: 全8チャンネル（特にetc-spotsを重点調査）');
        
        const slackData = await slackWrapper.getUserSlackDataByUserId(userId, {
            totalMessageLimit: 100, // 多めに取得
            includeThreads: true
        });
        
        // Step 3: 結果詳細分析
        console.log('\n📊 Step 3: 取得結果詳細分析');
        console.log(`データソース: ${slackData.dataSource}`);
        console.log(`取得メッセージ総数: ${slackData.todayMessages.length}`);
        console.log(`アクセスしたチャンネル数: ${slackData.channels_accessed}`);
        
        // Step 4: チャンネル別分析
        console.log('\n📊 Step 4: チャンネル別メッセージ分析');
        console.log('チャンネル別分布:', JSON.stringify(slackData.channelBreakdown, null, 2));
        
        // Step 5: etc-spotsチャンネル特別調査
        console.log('\n🔍 Step 5: etc-spotsチャンネル特別調査');
        const etcSpotsMessages = slackData.todayMessages.filter(msg => msg.channel_name === 'etc-spots');
        console.log(`etc-spotsメッセージ数: ${etcSpotsMessages.length}`);
        
        if (etcSpotsMessages.length > 0) {
            console.log('✅ etc-spotsメッセージ発見！');
            etcSpotsMessages.forEach((msg, index) => {
                const msgTime = new Date(parseFloat(msg.ts) * 1000);
                console.log(`  ${index + 1}. 時刻: ${msgTime.toISOString()}`);
                console.log(`     内容: ${(msg.text || '').substring(0, 100)}...`);
                console.log(`     タイムスタンプ: ${msg.ts}`);
            });
        } else {
            console.log('❌ etc-spotsメッセージが見つかりません');
            console.log('📋 調査項目:');
            console.log('   - チャンネルID: C040BKQ8P2L');
            console.log('   - ユーザーID: U040L7EJC0Z');
            console.log('   - 期待メッセージ: 6/9 15:08の三鷹訪問投稿');
        }
        
        // Step 6: 全メッセージの時間分析
        console.log('\n📊 Step 6: 全メッセージ時間分析');
        if (slackData.todayMessages.length > 0) {
            const messageTimes = slackData.todayMessages.map(msg => {
                const time = new Date(parseFloat(msg.ts) * 1000);
                return {
                    channel: msg.channel_name,
                    time: time.toISOString(),
                    hoursAgo: (Date.now() - time.getTime()) / (1000 * 60 * 60)
                };
            }).sort((a, b) => new Date(b.time) - new Date(a.time));
            
            console.log('メッセージタイムライン（最新順）:');
            messageTimes.slice(0, 10).forEach((msgInfo, index) => {
                console.log(`  ${index + 1}. ${msgInfo.channel}: ${msgInfo.time} (${msgInfo.hoursAgo.toFixed(1)}時間前)`);
            });
        }
        
        // Step 7: キーワード分析結果確認
        console.log('\n📊 Step 7: 抽出されたキーワード分析');
        if (slackData.advancedKeywordAnalysis) {
            const keywords = slackData.advancedKeywordAnalysis;
            console.log('技術キーワード:', Array.from(keywords.keywords.technical.keys()));
            console.log('ビジネスキーワード:', Array.from(keywords.keywords.business.keys()));
            console.log('イベントキーワード:', Array.from(keywords.keywords.events.keys()));
            
            if (keywords.keywords.characteristic && keywords.keywords.characteristic.length > 0) {
                console.log('動的特徴語:');
                keywords.keywords.characteristic.forEach((word, index) => {
                    console.log(`  ${index + 1}. ${word.word} (頻度: ${word.frequency}, カテゴリ: ${word.category})`);
                });
            }
        }
        
        // Step 8: 問題解決状況の確認
        console.log('\n🎯 Step 8: 問題解決状況の確認');
        
        const hasEtcSpots = etcSpotsMessages.length > 0;
        const has24HourRange = slackData.todayMessages.some(msg => {
            const hoursAgo = (Date.now() - parseFloat(msg.ts) * 1000) / (1000 * 60 * 60);
            return hoursAgo > 6; // 6時間以上前のメッセージがあるか
        });
        
        console.log(`✅ etc-spotsメッセージ取得: ${hasEtcSpots ? '成功' : '失敗'}`);
        console.log(`✅ 24時間範囲取得: ${has24HourRange ? '成功' : '失敗'}`);
        console.log(`✅ 総メッセージ数: ${slackData.todayMessages.length}件`);
        
        if (hasEtcSpots && has24HourRange) {
            console.log('🎉 Phase 6.5修正: 完全成功！');
            console.log('   - etc-spotsメッセージ取得問題解決');
            console.log('   - 24時間範囲拡大により最新メッセージ確実取得');
        } else {
            console.log('⚠️ まだ問題が残っています:');
            if (!hasEtcSpots) console.log('   - etc-spotsメッセージが取得できていない');
            if (!has24HourRange) console.log('   - 時間範囲が狭い可能性');
        }
        
        // Step 9: フォールバック分析
        if (slackData.dataSource.includes('fallback')) {
            console.log('\n🔄 Step 9: フォールバック動作分析');
            console.log('フォールバック理由:', slackData.fallbackReason);
            console.log('フォールバックデータでもetc-spotsは含まれているか確認');
        }
        
        console.log('\n🎊 etc-spotsメッセージ取得問題調査完了');
        console.log('修正効果:', hasEtcSpots ? '問題解決済み' : '追加調査が必要');
        
        return {
            success: true,
            etcSpotsFound: hasEtcSpots,
            messageCount: slackData.todayMessages.length,
            channelCount: slackData.channels_accessed,
            has24HourRange: has24HourRange,
            dataSource: slackData.dataSource
        };
        
    } catch (error) {
        console.error('❌ テスト実行エラー:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        // クリーンアップ
        try {
            await slackWrapper.cleanup();
            console.log('🧹 クリーンアップ完了');
        } catch (cleanupError) {
            console.warn('⚠️ クリーンアップエラー:', cleanupError.message);
        }
    }
}

// メイン実行
if (require.main === module) {
    testSlackMessageInvestigation()
        .then(result => {
            console.log('\n📋 最終結果:', JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 致命的エラー:', error);
            process.exit(1);
        });
}

module.exports = testSlackMessageInvestigation;

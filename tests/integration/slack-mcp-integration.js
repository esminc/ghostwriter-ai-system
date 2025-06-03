#!/usr/bin/env node

/**
 * 🧪 真のSlack MCP統合システムテスト
 * Phase 2-A+ 完成版テスト実行スクリプト
 */

const LLMDiaryGenerator = require('./src/mcp-integration/llm-diary-generator');
require('dotenv').config();

async function runComprehensiveTest() {
    console.log('🚀 真のSlack MCP統合システム 完全テスト開始');
    console.log('=' .repeat(60));
    
    try {
        // システム初期化
        const diaryGenerator = new LLMDiaryGenerator();
        
        // 🧪 Phase 1: システムテスト実行
        console.log('\n📊 Phase 1: システム統合テスト実行...');
        const systemTest = await diaryGenerator.runSystemTest('okamoto-takuya');
        
        console.log('\n✅ システムテスト結果:');
        console.log('=' .repeat(40));
        console.log(JSON.stringify(systemTest, null, 2));
        
        // 🧪 Phase 2: 実日記生成テスト
        console.log('\n📝 Phase 2: 実日記生成テスト実行...');
        const diaryResult = await diaryGenerator.generateDiaryWithMCP('okamoto-takuya');
        
        if (diaryResult.success) {
            console.log('\n✅ 日記生成成功:');
            console.log('タイトル:', diaryResult.diary.title);
            console.log('品質スコア:', diaryResult.diary.qualityScore);
            console.log('処理方式:', diaryResult.metadata?.processing_method);
            console.log('トークン使用量:', diaryResult.metadata?.tokens_used);
            
            console.log('\n📄 生成された日記内容:');
            console.log('-' .repeat(40));
            console.log(diaryResult.diary.content.substring(0, 300) + '...');
        } else {
            console.log('\n❌ 日記生成失敗:', diaryResult.error);
            if (diaryResult.fallback_diary) {
                console.log('📄 フォールバック日記が準備されています');
            }
        }
        
        // 🧪 Phase 3: Slack MCP直接テスト
        console.log('\n💬 Phase 3: Slack MCP直接テスト...');
        const slackData = await diaryGenerator.getSlackMCPData('okamoto-takuya');
        
        console.log('\n📊 Slack MCPデータ結果:');
        console.log('データソース:', slackData.dataSource);
        console.log('メッセージ数:', slackData.todayMessages.length);
        console.log('アクティブチャンネル:', slackData.messageStats.channelsActive.length);
        
        if (slackData.dataSource === 'real_slack_mcp') {
            console.log('🎉 真のSlack MCP統合が動作中！');
            console.log('主要トピック:', slackData.activityAnalysis.topics.join(', '));
        } else {
            console.log('🔄 フォールバックデータを使用中');
            console.log('理由:', slackData.fallbackReason);
        }
        
        // 🧪 Phase 4: システム状態確認
        console.log('\n🔍 Phase 4: システム状態確認...');
        const systemStatus = diaryGenerator.getSystemStatus();
        
        console.log('\n📋 システム状態:');
        console.log('バージョン:', systemStatus.system_version);
        console.log('環境:', systemStatus.environment);
        console.log('Slack MCP利用可能:', systemStatus.capabilities.real_slack_integration || false);
        console.log('フォールバック機能:', systemStatus.capabilities.fallback_mode);
        
        // 🎯 最終評価
        console.log('\n' + '=' .repeat(60));
        console.log('🎯 最終評価');
        console.log('=' .repeat(60));
        
        const isFullyIntegrated = slackData.dataSource === 'real_slack_mcp';
        const isSystemWorking = systemTest.tests?.slack_mcp?.success && 
                               systemTest.tests?.diary_generation?.success;
        
        if (isFullyIntegrated) {
            console.log('🎉 STATUS: 真のSlack MCP統合が完全に動作中！');
            console.log('💡 LLMがSlack MCPサーバーを使用してリアルタイムデータを取得しています');
        } else if (isSystemWorking) {
            console.log('🔄 STATUS: フォールバックシステムが正常動作中');
            console.log('💡 Claude Desktop環境では真のMCP統合が利用可能です');
        } else {
            console.log('❌ STATUS: システムエラーが発生しています');
        }
        
        console.log('\n📊 統計情報:');
        console.log(`- Slack MCP統合: ${isFullyIntegrated ? '✅ 有効' : '⚠️ フォールバック'}`);
        console.log(`- esa MCP統合: ${systemTest.tests?.esa_mcp?.success ? '✅ 有効' : '❌ 無効'}`);
        console.log(`- AI日記生成: ${diaryResult.success ? '✅ 有効' : '❌ 無効'}`);
        console.log(`- システム安定性: ${isSystemWorking ? '✅ 良好' : '❌ 要確認'}`);
        
        console.log('\n🔗 次の推奨アクション:');
        if (isFullyIntegrated) {
            console.log('- 🎯 本格運用開始の準備完了');
            console.log('- 📈 パフォーマンス監視の実装');
            console.log('- 🔧 追加機能の開発');
        } else {
            console.log('- 💻 Claude Desktop環境での真のMCP統合テスト');
            console.log('- 🔧 Slack MCPサーバーの設定確認');
            console.log('- 📚 MCP統合ドキュメントの参照');
        }
        
        console.log('\n' + '=' .repeat(60));
        console.log('🎊 テスト完了: 真のSlack MCP統合システム v2.1.0');
        console.log('=' .repeat(60));
        
        return {
            success: true,
            fullIntegration: isFullyIntegrated,
            systemWorking: isSystemWorking,
            testResults: systemTest,
            diaryGenerated: diaryResult.success
        };
        
    } catch (error) {
        console.error('\n❌ テスト実行エラー:', error.message);
        console.error('スタックトレース:', error.stack);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// メイン実行
if (require.main === module) {
    runComprehensiveTest()
        .then(result => {
            console.log('\n🏁 テスト終了:', result.success ? '成功' : '失敗');
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 予期しないエラー:', error);
            process.exit(1);
        });
}

module.exports = { runComprehensiveTest };

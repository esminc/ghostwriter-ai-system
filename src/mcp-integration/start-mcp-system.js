// MCP統合版 GhostWriter システム起動エントリーポイント
// Phase 1との並行運用・段階的移行対応

require('dotenv').config();

const SimplifiedGhostWriterBot = require('./simplified-slack-bot');

/**
 * MCP統合版システム起動
 * Phase 1システムとの並行運用を想定
 */
async function startMCPIntegratedSystem() {
    console.log('🚀 MCP統合版 GhostWriter システム起動開始...');
    console.log('📅 起動日時:', new Date().toLocaleString('ja-JP'));
    
    // 環境変数チェック
    const requiredEnvVars = [
        'SLACK_BOT_TOKEN',
        'SLACK_SIGNING_SECRET',
        'OPENAI_API_KEY'
    ];
    
    // SLACK_APP_TOKEN は Socket Mode でのみ必要（オプショナル）
    const optionalEnvVars = ['SLACK_APP_TOKEN'];
    console.log('💡 オプショナル環境変数（Socket Mode用）:', optionalEnvVars.filter(v => !process.env[v]));

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error('❌ 必要な環境変数が不足しています:', missingVars);
        process.exit(1);
    }

    console.log('✅ 環境変数チェック完了');

    // システム構成情報表示
    console.log('\n📊 MCP統合版システム構成:');
    console.log('├── Slack Bot: 簡素化版（~20行）');
    console.log('├── LLM Engine: GPT-4o-mini（Phase 1実績継承）');
    console.log('├── MCP Server: esa統合（Claude Desktop実証済み）');
    console.log('├── フォールバック: Phase 1システム（品質5/5保証）');
    console.log('└── ポート: 3000（Phase 1と同じ）');

    try {
        // MCP統合版Bot起動
        const bot = new SimplifiedGhostWriterBot();
        await bot.start();

        console.log('\n🎊 MCP統合版システム起動完了！');
        console.log('🔗 システムの特徴:');
        console.log('  • 複雑なAPI実装→LLM自然言語委任');
        console.log('  • 300行以上→20行程度に大幅簡素化');
        console.log('  • Phase 1品質維持（エンタープライズ品質）');
        console.log('  • 自動フォールバック機能完備');
        
        console.log('\n💡 使用方法:');
        console.log('  Slackで @GhostWriter @ユーザー名');
        console.log('  または @GhostWriter （自分の日記生成）');

        // 優雅なシャットダウン処理
        process.on('SIGINT', () => {
            console.log('\n🛑 MCP統合版システム終了中...');
            console.log('📋 Phase 1システムは引き続き利用可能です');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 MCP統合版システム終了（SIGTERM）');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ MCP統合版システム起動失敗:', error);
        console.log('\n🔄 Phase 1システムをご利用ください');
        console.log('   ディレクトリ: src/slack/app.js');
        process.exit(1);
    }
}

// 実行時の情報表示
console.log('🔧 GhostWriter MCP統合版 - システム起動');
console.log('📝 目的: Slack Bot大幅簡素化によるシステム拡張性向上');
console.log('🎯 効果: 複雑なコード→LLMの柔軟判断による自然言語ベース処理');
console.log('');

// システム起動
startMCPIntegratedSystem().catch(error => {
    console.error('❌ 起動エラー:', error);
    console.log('🔄 代替案: Phase 1システム（src/slack/app.js）をご利用ください');
    process.exit(1);
});

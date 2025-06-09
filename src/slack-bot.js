#!/usr/bin/env node

// 環境変数読み込み（最優先）
require('dotenv').config();

// GhostWriter Slack Bot起動スクリプト - Phase 2
const GhostWriterSlackBot = require('./slack/app');

async function main() {
    console.log('🚀 Starting GhostWriter Slack Bot - Phase 2...');
    
    // 環境変数チェック
    const requiredEnvVars = [
        'SLACK_BOT_TOKEN',
        'SLACK_SIGNING_SECRET',
        'ESA_ACCESS_TOKEN',
        'ESA_TEAM_NAME'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName] || process.env[varName].includes('your_'));
    
    if (missingVars.length > 0) {
        console.log(`
⚠️  Slack Bot設定が未完了です

未設定の環境変数:
${missingVars.map(v => `  - ${v}`).join('\n')}

📋 設定手順:
1. Slack Appを作成してトークンを取得
2. .envファイルに設定を追加
3. 再度実行

現在はDemo Modeで起動します...
        `);
        
        // Demo Mode での起動
        console.log('🎭 Demo Mode: Phase 1機能のテストを実行...');
        
        // Phase 1のAI統合テストを実行
        const testAI = require('./test-ai-integration');
        console.log('Phase 1の完成機能をテスト実行中...');
        return;
    }

    // Slack Bot の初期化と起動
    const bot = new GhostWriterSlackBot();
    
    // 終了処理の設定
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down GhostWriter Slack Bot...');
        await bot.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down GhostWriter Slack Bot...');
        await bot.stop();
        process.exit(0);
    });

    // Bot開始
    await bot.start();
}

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// メイン処理実行
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Failed to start application:', error);
        process.exit(1);
    });
}

module.exports = { main };

#!/usr/bin/env node

// GhostWriter Slack Bot - 設定確認スクリプト
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

console.log('🔍 GhostWriter Slack Bot 設定確認\n');

// 必要な環境変数のチェック
const requiredEnvVars = {
    'SLACK_BOT_TOKEN': process.env.SLACK_BOT_TOKEN,
    'SLACK_SIGNING_SECRET': process.env.SLACK_SIGNING_SECRET,
    'ESA_ACCESS_TOKEN': process.env.ESA_ACCESS_TOKEN,
    'ESA_TEAM_NAME': process.env.ESA_TEAM_NAME,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY
};

let allGood = true;

console.log('📋 環境変数チェック:');
for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value.includes('your_')) {
        console.log(`❌ ${key}: 未設定または無効`);
        allGood = false;
    } else {
        const displayValue = value.length > 20 ? value.substring(0, 10) + '...' : value;
        console.log(`✅ ${key}: ${displayValue}`);
    }
}

console.log('\n📡 Slack App設定チェック:');
console.log('以下の設定がSlack App管理画面で必要です:');
console.log('');
console.log('🔗 Interactivity & Shortcuts:');
console.log('   - Interactivity: ON');
console.log('   - Request URL: https://your-ngrok-url.ngrok.io/slack/events');
console.log('');
console.log('📨 Event Subscriptions:');
console.log('   - Enable Events: ON');
console.log('   - Request URL: https://your-ngrok-url.ngrok.io/slack/events');
console.log('   - Subscribe to bot events: app_mention');
console.log('');
console.log('⚡ Slash Commands:');
console.log('   - Command: /ghostwrite');
console.log('   - Request URL: https://your-ngrok-url.ngrok.io/slack/events');
console.log('   - Description: AI代筆システムで日記を自動生成');

if (allGood) {
    console.log('\n🎉 環境変数の設定は完了しています！');
    console.log('');
    console.log('📋 次のステップ:');
    console.log('1. ./setup-ngrok.sh でngrokを起動');
    console.log('2. ngrokのHTTPS URLをSlack Appに設定');
    console.log('3. npm run slack でボットを起動');
    console.log('4. Slackで /ghostwrite をテスト');
} else {
    console.log('\n⚠️  設定が不完全です。.envファイルを確認してください。');
}

console.log('\n📖 詳細な手順: SLACK_INTERACTIVITY_FIX.md を参照してください');

#!/usr/bin/env node

// 環境変数読み込み
require('dotenv').config();

// Phase 1緊急診断スクリプト
console.log('🔍 Phase 1 Slack Bot緊急診断開始');
console.log('時刻:', new Date().toLocaleString('ja-JP'));
console.log('');

// 環境変数チェック
console.log('📊 環境変数チェック:');
const requiredEnvs = [
    'SLACK_BOT_TOKEN',
    'SLACK_SIGNING_SECRET', 
    'ESA_ACCESS_TOKEN',
    'ESA_TEAM_NAME',
    'OPENAI_API_KEY',
    'MAPPING_PHASE'
];

requiredEnvs.forEach(env => {
    const value = process.env[env];
    const status = value ? '✅' : '❌';
    console.log(`   ${status} ${env}: ${value ? (value.substring(0, 10) + '...') : 'NOT SET'}`);
});

console.log('');

// ファイル存在チェック
console.log('📁 重要ファイル存在チェック:');
const fs = require('fs');
const importantFiles = [
    'src/slack/app.js',
    'src/services/migration-manager.js',
    'src/services/auto-user-mapper.js',
    'config/user-mappings.json',
    'logs/mapping-migration.log'
];

importantFiles.forEach(file => {
    try {
        const exists = fs.existsSync(file);
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    } catch (error) {
        console.log(`   ❌ ${file} (エラー: ${error.message})`);
    }
});

console.log('');

// 依存関係チェック
console.log('📦 重要依存関係チェック:');
const dependencies = [
    '@slack/bolt',
    'openai', 
    'axios',
    'sqlite3',
    'dotenv'
];

dependencies.forEach(dep => {
    try {
        require(dep);
        console.log(`   ✅ ${dep}`);
    } catch (error) {
        console.log(`   ❌ ${dep} (エラー: ${error.message})`);
    }
});

console.log('');

// 簡易接続テスト
console.log('🌐 基本接続テスト:');

async function testConnections() {
    // OpenAI接続テスト
    try {
        const OpenAI = require('openai');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        // 簡易リクエスト（実際には送信しない）
        console.log('   ✅ OpenAI: API設定OK');
    } catch (error) {
        console.log(`   ❌ OpenAI: ${error.message}`);
    }
    
    // esa API接続テスト
    try {
        const axios = require('axios');
        const response = await axios.get(`https://api.esa.io/v1/teams/${process.env.ESA_TEAM_NAME}`, {
            headers: {
                'Authorization': `Bearer ${process.env.ESA_ACCESS_TOKEN}`
            },
            timeout: 5000
        });
        console.log('   ✅ esa API: 接続OK');
    } catch (error) {
        console.log(`   ❌ esa API: ${error.message}`);
    }
}

// データベース接続テスト
async function testDatabase() {
    try {
        console.log('💾 データベース接続テスト:');
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = process.env.DB_PATH || './src/database/ghostwriter.db';
        
        console.log(`   データベースパス: ${dbPath}`);
        
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.log(`   ❌ DB接続エラー: ${err.message}`);
            } else {
                console.log('   ✅ データベース: 接続OK');
                db.close();
            }
        });
    } catch (error) {
        console.log(`   ❌ データベース: ${error.message}`);
    }
}

// 実行
async function runDiagnostics() {
    await testConnections();
    console.log('');
    await testDatabase();
    
    console.log('');
    console.log('🎯 推奨アクション:');
    console.log('1. 上記のエラー項目を修正');
    console.log('2. npm run slack のコンソールログを確認');
    console.log('3. 必要に応じて npm install を実行');
    console.log('4. Slack Bot再起動後に再テスト');
}

runDiagnostics().catch(console.error);

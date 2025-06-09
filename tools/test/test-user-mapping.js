#!/usr/bin/env node

// ユーザーマッピングシステムのテスト
const dotenv = require('dotenv');
const UserMappingManager = require('./src/services/user-mapping-manager');
const AIProfileAnalyzer = require('./src/services/ai-profile-analyzer');

// 環境変数の読み込み
dotenv.config();

async function testUserMapping() {
    console.log('🔄 ユーザーマッピングシステムテスト開始...\n');
    
    // 1. マッピングマネージャーのテスト
    console.log('📋 Step 1: マッピングマネージャーのテスト');
    const mappingManager = new UserMappingManager();
    
    // マッピング情報を表示
    mappingManager.logMappingInfo();
    
    // 具体的なマッピングテスト
    console.log('\n🔍 Step 2: 具体的なマッピングテスト');
    const testUsers = ['takuya.okamoto', 'unknown.user', 'okamoto-takuya'];
    
    testUsers.forEach(user => {
        console.log(`\n👤 "${user}" のテスト:`);
        mappingManager.debugUser(user);
    });
    
    // 2. プロフィール分析のテスト
    console.log('\n🤖 Step 3: プロフィール分析テスト');
    
    try {
        const analyzer = new AIProfileAnalyzer();
        
        console.log('📡 takuya.okamoto (Slackユーザー) でプロフィール分析...');
        const profile = await analyzer.analyzeFromEsa('takuya.okamoto');
        
        console.log('\n✅ プロフィール分析結果:');
        console.log('📊 基本情報:');
        console.log(`   - 主要トーン: ${profile.writing_style.primary_tone}`);
        console.log(`   - フォーマリティレベル: ${profile.writing_style.formality_level}/5`);
        
        console.log('\n🎯 関心分野:');
        console.log(`   - 主要カテゴリ: ${profile.interests.main_categories.join(', ')}`);
        
        console.log('\n💼 行動パターン:');
        console.log(`   - 典型的タスク: ${profile.behavior_patterns.typical_tasks.slice(0, 3).join(', ')}`);
        console.log(`   - 作業スタイル: ${profile.behavior_patterns.work_style}`);
        
        console.log('\n🎭 特徴的表現:');
        console.log(`   - ${profile.writing_style.characteristic_expressions.join(', ')}`);
        
        console.log('\n🎉 プロフィール分析成功！');
        
    } catch (error) {
        console.error('❌ プロフィール分析エラー:', error);
    }
    
    console.log('\n🏁 テスト完了!');
}

testUserMapping().catch(console.error);

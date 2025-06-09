#!/usr/bin/env node

// ユーザー名正規化機能のテスト
const AIProfileAnalyzer = require('./src/services/ai-profile-analyzer');

async function testUserNameNormalization() {
    console.log('🔄 ユーザー名正規化テスト開始...\n');
    
    const analyzer = new AIProfileAnalyzer();
    
    // テストケース
    const testCases = [
        'takuya.okamoto',
        'takuya_okamoto', 
        'okamoto-takuya',
        'unknown_user'
    ];
    
    console.log('📋 テストケース:');
    testCases.forEach(userName => {
        const normalized = analyzer.normalizeUserName(userName);
        console.log(`  - ${userName} → ${normalized}`);
    });
    
    console.log('\n🔍 実際のプロフィール分析テスト...');
    
    try {
        // takuya.okamotoでプロフィール分析をテスト
        console.log('🤖 takuya.okamotoのプロフィール分析開始...');
        const profile = await analyzer.analyzeFromEsa('takuya.okamoto');
        
        console.log('✅ プロフィール分析成功!');
        console.log('📊 結果概要:');
        console.log(`   - 主要トーン: ${profile.writing_style.primary_tone}`);
        console.log(`   - 関心分野: ${profile.interests.main_categories.join(', ')}`);
        console.log(`   - 特徴的表現: ${profile.writing_style.characteristic_expressions.join(', ')}`);
        
    } catch (error) {
        console.error('❌ プロフィール分析エラー:', error);
    }
    
    console.log('\n🎉 テスト完了!');
}

testUserNameNormalization().catch(console.error);

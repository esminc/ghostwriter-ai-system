#!/usr/bin/env node

// 改善されたユーザー名検索のテスト
const dotenv = require('dotenv');
const AIProfileAnalyzer = require('./src/services/ai-profile-analyzer');

// 環境変数の読み込み
dotenv.config();

async function testImprovedUserSearch() {
    console.log('🔄 改善されたユーザー検索テスト開始...\n');
    
    const analyzer = new AIProfileAnalyzer();
    
    try {
        console.log('🤖 takuya.okamotoのプロフィール分析テスト...');
        
        const profile = await analyzer.analyzeFromEsa('takuya.okamoto');
        
        console.log('\n✅ プロフィール分析結果:');
        console.log('📊 基本情報:');
        console.log(`   - 主要トーン: ${profile.writing_style.primary_tone}`);
        console.log(`   - フォーマリティレベル: ${profile.writing_style.formality_level}/5`);
        console.log(`   - 平均文字数: ${profile.writing_style.avg_article_length}文字`);
        console.log(`   - 絵文字頻度: ${profile.writing_style.emoji_frequency}`);
        
        console.log('\n🎯 関心分野:');
        console.log(`   - 主要カテゴリ: ${profile.interests.main_categories.join(', ')}`);
        console.log(`   - 技術キーワード: ${profile.interests.technical_keywords.slice(0, 5).join(', ')}`);
        
        console.log('\n💼 行動パターン:');
        console.log(`   - 典型的タスク: ${profile.behavior_patterns.typical_tasks.slice(0, 3).join(', ')}`);
        console.log(`   - 作業スタイル: ${profile.behavior_patterns.work_style}`);
        
        console.log('\n🎭 特徴的表現:');
        console.log(`   - ${profile.writing_style.characteristic_expressions.join(', ')}`);
        
        if (profile.personality_traits) {
            console.log('\n🧑‍💼 性格特性:');
            console.log(`   - コミュニケーション: ${profile.personality_traits.communication_style}`);
            console.log(`   - 問題解決: ${profile.personality_traits.problem_solving_approach}`);
            console.log(`   - チーム協調性: ${profile.personality_traits.team_interaction}`);
        }
        
        console.log('\n🎉 プロフィール分析成功！');
        
    } catch (error) {
        console.error('❌ プロフィール分析エラー:', error);
        console.error('スタックトレース:', error.stack);
    }
    
    console.log('\n🏁 テスト完了!');
}

testImprovedUserSearch().catch(console.error);

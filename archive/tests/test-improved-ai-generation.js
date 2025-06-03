#!/usr/bin/env node

/**
 * 改良版AI生成テスト - 関心事反映確認
 * プロフィール分析結果がAI生成に適切に反映されているかをテスト
 */

require('dotenv').config();

// 改良版OpenAIクライアントをテスト
const OriginalOpenAIClient = require('./src/ai/openai-client');
const ImprovedOpenAIClient = require('./src/ai/openai-client-improved-context-aware');

// テスト用のプロフィール分析結果（実際のokamoto-takuyaさんの分析結果）
const testProfileAnalysis = {
  writing_style: {
    primary_tone: "casual",
    characteristic_expressions: ["だね", "って感じ", "いい感じ"],
    emotion_style: "フレンドリーで親しみやすい",
    formality_level: 2
  },
  interests: {
    main_categories: ["AI", "ソフトウェア開発", "ハッカソン", "ai_ml", "backend"],
    technical_keywords: ["API", "データベース", "機械学習", "システム設計", "MCP", "OpenAI"],
    learning_patterns: ["実装して学ぶタイプ", "新技術への積極的取り組み"]
  },
  behavior_patterns: {
    typical_tasks: ["API実装", "システム改善", "技術調査", "バックエンド開発", "AI統合"],
    work_style: "技術的な深掘りを好む集中型",
    article_structure: "具体的な実装内容中心"
  },
  personality_traits: {
    communication_style: "技術的だがカジュアルで分かりやすい",
    problem_solving_approach: "実践的・体系的",
    team_interaction: "技術共有を重視する協力的"
  }
};

async function compareAIGeneration() {
  console.log(`
🔍 改良版AI生成テスト - 関心事反映確認

📊 テスト対象:
✅ 元版: 汎用的なプロンプト
🔧 改良版: 関心事反映強化プロンプト

🎯 期待される改善:
- AI, ソフトウェア開発, ハッカソン, backend の具体的反映
- API, データベース, 機械学習 などの技術用語活用
- 抽象的な「タスク」→具体的な技術作業への変更
  `);

  const targetUser = 'okamoto-takuya';
  const testActions = ['今日のタスクと日常作業']; // 汎用的なアクション
  const contextData = { allow_automatic: true };

  // 1. 元版での生成テスト
  console.log('\n🔍 1. 元版OpenAIClientでの生成テスト...');
  const originalClient = new OriginalOpenAIClient();
  
  try {
    const originalResult = await originalClient.generateDiary(targetUser, testActions, testProfileAnalysis, contextData);
    
    console.log('📝 元版生成結果:');
    console.log('   成功:', originalResult.success);
    console.log('   タイトル抽出テスト:');
    const originalTitleMatch = originalResult.content.match(/タイトル:\s*(.+)/);
    const originalTitle = originalTitleMatch ? originalTitleMatch[1] : '抽出失敗';
    console.log('   - タイトル:', originalTitle);
    
    // 関心事の反映度チェック
    const originalContent = originalResult.content || '';
    const interestReflection = checkInterestReflection(originalContent, testProfileAnalysis.interests);
    console.log('   関心事反映度:', interestReflection);
    
  } catch (error) {
    console.error('❌ 元版テストエラー:', error.message);
  }

  // 2. 改良版での生成テスト
  console.log('\n🔧 2. 改良版OpenAIClientでの生成テスト...');
  const improvedClient = new ImprovedOpenAIClient();
  
  try {
    const improvedResult = await improvedClient.generateDiary(targetUser, testActions, testProfileAnalysis, contextData);
    
    console.log('📝 改良版生成結果:');
    console.log('   成功:', improvedResult.success);
    console.log('   タイトル抽出テスト:');
    const improvedTitleMatch = improvedResult.content.match(/タイトル:\s*(.+)/);
    const improvedTitle = improvedTitleMatch ? improvedTitleMatch[1] : '抽出失敗';
    console.log('   - タイトル:', improvedTitle);
    
    // 関心事の反映度チェック
    const improvedContent = improvedResult.content || '';
    const improvedInterestReflection = checkInterestReflection(improvedContent, testProfileAnalysis.interests);
    console.log('   関心事反映度:', improvedInterestReflection);
    
    // 技術的具体性チェック
    const technicalSpecificity = checkTechnicalSpecificity(improvedContent);
    console.log('   技術的具体性:', technicalSpecificity);
    
  } catch (error) {
    console.error('❌ 改良版テストエラー:', error.message);
  }

  // 3. 関心事抽出機能の単体テスト
  console.log('\n🎯 3. 関心事抽出機能の単体テスト...');
  
  const interests = improvedClient.extractDetailedInterests(testProfileAnalysis);
  const techKeywords = improvedClient.extractTechnicalKeywords(testProfileAnalysis);
  const workPatterns = improvedClient.extractWorkPatterns(testProfileAnalysis);
  
  console.log('   抽出された関心事:', interests);
  console.log('   抽出された技術キーワード:', techKeywords);
  console.log('   抽出された作業パターン:', workPatterns);
  
  // 4. 改善されたアクション生成テスト
  console.log('\n🚀 4. 改善されたアクション生成テスト...');
  
  const originalActions = ['今日のタスクと日常作業'];
  const enhancedActions = improvedClient.generateContextAwareActions(originalActions, interests, techKeywords, workPatterns);
  
  console.log('   元のアクション:', originalActions);
  console.log('   強化されたアクション:');
  console.log(enhancedActions);

  // 5. 総合評価
  console.log('\n📊 5. 総合評価...');
  
  console.log(`
🎯 改良版の主要改善点:

✅ 関心事の具体的抽出:
   - 分析結果から主要関心事を自動抽出
   - 技術キーワードの体系的整理
   - 作業パターンの効率的活用

✅ プロンプトの技術的強化:
   - 抽象的「タスク」→具体的技術作業
   - 関心事を必須反映する指針
   - 技術用語の自然な活用

✅ アクション生成の改善:
   - 汎用的アクション→関心事ベース生成
   - 技術的コンテキストでの強化
   - 個人の専門領域を反映

🎉 期待される効果:
   - AI分析結果と生成内容の整合性向上
   - より技術的で具体的な日記生成
   - 個人の関心領域が自然に反映される内容
  `);
}

// 関心事反映度チェック関数
function checkInterestReflection(content, interests) {
  const mainCategories = interests.main_categories || [];
  const techKeywords = interests.technical_keywords || [];
  
  let reflectionScore = 0;
  let foundInterests = [];
  
  // 主要関心事のチェック
  mainCategories.forEach(interest => {
    if (content.toLowerCase().includes(interest.toLowerCase())) {
      reflectionScore += 2;
      foundInterests.push(interest);
    }
  });
  
  // 技術キーワードのチェック
  techKeywords.forEach(keyword => {
    if (content.toLowerCase().includes(keyword.toLowerCase())) {
      reflectionScore += 1;
      foundInterests.push(keyword);
    }
  });
  
  return {
    score: reflectionScore,
    maxScore: (mainCategories.length * 2) + techKeywords.length,
    percentage: reflectionScore > 0 ? Math.round((reflectionScore / ((mainCategories.length * 2) + techKeywords.length)) * 100) : 0,
    foundInterests: [...new Set(foundInterests)]
  };
}

// 技術的具体性チェック関数
function checkTechnicalSpecificity(content) {
  const technicalTerms = [
    'API', 'データベース', '実装', 'システム', 'アーキテクチャ',
    'プログラミング', 'フレームワーク', 'ライブラリ', 'アルゴリズム',
    'パフォーマンス', 'セキュリティ', 'スケーリング', 'デプロイ',
    'CI/CD', 'DevOps', 'マイクロサービス', 'REST', 'GraphQL',
    '機械学習', 'AI', 'LLM', 'MCP', 'OpenAI', 'バックエンド',
    'フロントエンド', 'フルスタック', 'クラウド', 'コンテナ'
  ];
  
  const genericTerms = [
    'タスク', '作業', '仕事', '業務', '活動', '行動',
    '取り組み', '対応', '処理', '進行', '実施'
  ];
  
  let technicalCount = 0;
  let genericCount = 0;
  let foundTechnical = [];
  let foundGeneric = [];
  
  technicalTerms.forEach(term => {
    if (content.includes(term)) {
      technicalCount++;
      foundTechnical.push(term);
    }
  });
  
  genericTerms.forEach(term => {
    if (content.includes(term)) {
      genericCount++;
      foundGeneric.push(term);
    }
  });
  
  const technicalRatio = technicalCount / (technicalCount + genericCount);
  
  return {
    technicalTerms: technicalCount,
    genericTerms: genericCount,
    technicalRatio: Math.round(technicalRatio * 100),
    foundTechnical: [...new Set(foundTechnical)],
    foundGeneric: [...new Set(foundGeneric)],
    assessment: technicalRatio > 0.6 ? '高い技術的具体性' : 
                technicalRatio > 0.3 ? '中程度の技術的具体性' : '低い技術的具体性'
  };
}

async function main() {
  try {
    await compareAIGeneration();
    console.log('\n✅ 改良版AI生成テスト完了！');
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { compareAIGeneration, checkInterestReflection, checkTechnicalSpecificity };
#!/usr/bin/env node

// OpenAI API接続テスト
const dotenv = require('dotenv');
const OpenAIClient = require('../../src/ai/openai-client');

// 環境変数の読み込み
dotenv.config();

async function testOpenAIConnection() {
    console.log('🔄 OpenAI API接続テスト開始...\n');
    
    // 1. 環境変数チェック
    console.log('📋 Step 1: 環境変数チェック');
    const apiKey = process.env.OPENAI_API_KEY;
    console.log(`   - API Key 設定: ${apiKey ? '✅ 設定済み' : '❌ 未設定'}`);
    console.log(`   - API Key 長さ: ${apiKey ? apiKey.length : 0}文字`);
    console.log(`   - API Key プレフィックス: ${apiKey ? apiKey.substring(0, 20) + '...' : 'なし'}`);
    
    // 2. OpenAIクライアント初期化
    console.log('\n🤖 Step 2: OpenAIクライアント初期化');
    const client = new OpenAIClient();
    
    // 3. API状況チェック
    console.log('\n📡 Step 3: API接続状況チェック');
    try {
        const status = await client.checkApiStatus();
        console.log(`   - ステータス: ${status.status}`);
        console.log(`   - メッセージ: ${status.message}`);
        
        if (status.status === 'active') {
            console.log('✅ OpenAI API接続成功！');
        } else {
            console.log('⚠️  OpenAI API接続に問題があります');
        }
    } catch (error) {
        console.error('❌ API状況チェックエラー:', error.message);
    }
    
    // 4. 簡単なテスト呼び出し
    console.log('\n🧪 Step 4: 簡単なテスト呼び出し');
    try {
        const testResult = await client.chatCompletion([
            { role: 'user', content: 'Hello, this is a test. Please respond with just "API Working".' }
        ], {
            maxTokens: 50,
            temperature: 0.1
        });
        
        console.log('📤 リクエスト送信: 成功');
        console.log(`📥 レスポンス受信: ${testResult.success ? '成功' : '失敗'}`);
        
        if (testResult.success) {
            console.log(`📝 応答内容: "${testResult.content}"`);
            console.log(`🔧 使用モデル: ${testResult.model}`);
            console.log(`📊 トークン使用量: ${JSON.stringify(testResult.usage)}`);
            console.log('🎉 OpenAI API テスト成功！');
        } else {
            console.log(`❌ API呼び出し失敗: ${testResult.error}`);
            if (testResult.fallback) {
                console.log('🔄 フォールバック応答が使用されています');
            }
        }
        
    } catch (error) {
        console.error('❌ テスト呼び出しエラー:', error);
    }
    
    // 5. 日記生成テスト
    console.log('\n📝 Step 5: 日記生成機能テスト');
    try {
        const profileAnalysis = {
            writing_style: {
                primary_tone: 'casual',
                characteristic_expressions: ['だね', 'って感じ', 'なんか'],
                emotion_style: 'フレンドリー',
                formality_level: 2
            },
            interests: {
                main_categories: ['AI', 'システム開発'],
                technical_keywords: ['API', 'データベース'],
                learning_patterns: ['実装重視']
            },
            behavior_patterns: {
                typical_tasks: ['コーディング', 'テスト', 'ドキュメント作成'],
                work_style: '集中型',
                article_structure: 'やったこと中心'
            }
        };
        
        const diaryResult = await client.generateDiary(
            'takuya.okamoto',
            ['OpenAI API接続テストを実行した', 'システムの動作確認を行った'],
            profileAnalysis,
            { allow_automatic: true }
        );
        
        if (diaryResult.success && !diaryResult.fallback) {
            console.log('✅ 日記生成成功！');
            console.log('📄 生成された日記:');
            console.log('---');
            console.log(diaryResult.content);
            console.log('---');
        } else {
            console.log('⚠️  日記生成はフォールバックモードです');
            if (diaryResult.error) {
                console.log(`❌ エラー: ${diaryResult.error}`);
            }
        }
        
    } catch (error) {
        console.error('❌ 日記生成テストエラー:', error);
    }
    
    console.log('\n🏁 OpenAI API接続テスト完了！');
}

testOpenAIConnection().catch(console.error);

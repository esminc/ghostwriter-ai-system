#!/bin/bash

# GhostWriter Phase1完全テスト - Slack承認後実行スクリプト
# 2025年6月2日実行予定

echo "🎉 GhostWriter Phase 4 Slack情報取り込み拡充テスト開始"
echo "==================================="
echo "📅 実行日: $(date)"
echo "🎯 目標: Slack App承認後のSlack情報取り込み拡充"
echo ""

# プロジェクトディレクトリに移動
cd /Users/takuya/Documents/AI-Work/GhostWriter

echo "📁 現在のディレクトリ: $(pwd)"
echo ""

# Step 1: 環境確認
echo "🔍 Step 1: 環境確認"
echo "----------------------------------------"
echo "Slack Bot Token: ${SLACK_BOT_TOKEN:0:20}..."
echo "esa Access Token: ${ESA_ACCESS_TOKEN:0:20}..."
echo "OpenAI API Key: ${OPENAI_API_KEY:0:20}..."
echo ""

# Step 2: Slack接続テスト
echo "🔧 Step 2: Slack接続復旧テスト"
echo "----------------------------------------"
echo "コマンド: node final-slack-test.js U040L7EJC0Z"
echo ""
read -p "実行しますか？ (y/n): " confirm1
if [ "$confirm1" = "y" ]; then
    node final-slack-test.js U040L7EJC0Z
    echo ""
    read -p "接続成功しましたか？ (y/n): " success1
    if [ "$success1" != "y" ]; then
        echo "❌ Slack接続に問題があります。設定を確認してください。"
        exit 1
    fi
fi

# Step 3: チャンネル調査
echo "🔍 Step 3: チャンネル・メッセージ調査"
echo "----------------------------------------"
echo "コマンド: node investigate-channels.js U040L7EJC0Z"
echo ""
read -p "実行しますか？ (y/n): " confirm2
if [ "$confirm2" = "y" ]; then
    node investigate-channels.js U040L7EJC0Z
    echo ""
    read -p "チャンネルとメッセージが取得できましたか？ (y/n): " success2
    if [ "$success2" != "y" ]; then
        echo "⚠️ チャンネル権限を確認してください。"
    fi
fi

# Step 4: AI日記生成テスト
echo "🧠 Step 4: AI日記生成テスト"
echo "----------------------------------------"
echo "コマンド: node test-diary-generation.js \"岡本卓也\" U040L7EJC0Z"
echo ""
read -p "実行しますか？ (y/n): " confirm3
if [ "$confirm3" = "y" ]; then
    node test-diary-generation.js "岡本卓也" U040L7EJC0Z
    echo ""
    read -p "AI日記生成が成功しましたか？ (y/n): " success3
    if [ "$success3" != "y" ]; then
        echo "⚠️ OpenAI API設定を確認してください。"
    fi
fi

# Step 5: 完全統合テスト（ドライラン）
echo "🚀 Step 5: 完全統合テスト（ドライラン）"
echo "----------------------------------------"
echo "コマンド: node test-esa-posting-bot.js \"岡本卓也\" U040L7EJC0Z"
echo ""
read -p "実行しますか？ (y/n): " confirm4
if [ "$confirm4" = "y" ]; then
    node test-esa-posting-bot.js "岡本卓也" U040L7EJC0Z
    echo ""
    read -p "ドライランが成功しましたか？ (y/n): " success4
    if [ "$success4" = "y" ]; then
        echo ""
        echo "🎯 Step 6: 実投稿テスト（オプション）"
        echo "----------------------------------------"
        echo "⚠️  注意: これは実際にesaに投稿されます"
        echo "コマンド: node test-esa-posting-bot.js \"岡本卓也\" U040L7EJC0Z --real-post"
        echo ""
        read -p "実投稿テストを実行しますか？ (y/n): " confirm5
        if [ "$confirm5" = "y" ]; then
            node test-esa-posting-bot.js "岡本卓也" U040L7EJC0Z --real-post
            echo ""
            echo "🎉 Phase 4 Slack情報取り込み拡充テスト完了！"
            echo "次はPhase 5（自動実行システム）に進めます。"
        fi
    fi
fi

echo ""
echo "✅ Phase 4テストセッション完了"
echo "📊 結果サマリー:"
echo "   Slack接続: $success1"
echo "   チャンネル取得: $success2" 
echo "   AI日記生成: $success3"
echo "   統合テスト: $success4"
echo ""
echo "🚀 次回セッション: Phase 5（自動実行システム構築）"

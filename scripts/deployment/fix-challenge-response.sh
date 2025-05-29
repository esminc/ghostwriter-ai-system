#!/bin/bash

# Challenge Response緊急修正スクリプト

echo "🚨 Slack Challenge Response緊急修正"
echo "ngrok URL: https://94eb-2400-2653-f561-8100-8c5f-774f-50c1-a09.ngrok-free.app"
echo ""

# 現在のプロセス終了
echo "🛑 既存プロセス停止中..."
pkill -f "node src/slack/app.js"
pkill -f "node challenge-server.js"

# Challenge専用サーバー起動
echo "🔧 Challenge Response専用サーバー起動..."
echo "ポート: 3001"
echo "エンドポイント: /slack/events"
echo ""

# バックグラウンドでChallenge専用サーバー起動
node challenge-server.js &
CHALLENGE_PID=$!

echo "✅ Challenge専用サーバー起動完了 (PID: $CHALLENGE_PID)"
echo ""

# ngrok新規起動
echo "🌐 ngrok再起動中... (ポート3001)"
pkill ngrok
sleep 2

# ngrokでポート3001を公開
echo "新しいngrok URLを取得して、Slackに設定してください:"
echo "設定URL: https://xxxxx.ngrok.io/slack/events"
echo ""
echo "Press Ctrl+C to stop all processes"

ngrok http 3001

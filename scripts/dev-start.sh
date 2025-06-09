#!/bin/bash
# ローカル開発用Ngrok + GhostWriter起動スクリプト

echo "🚀 GhostWriter ローカル開発環境起動中..."

# Ngrokが起動しているかチェック
if pgrep -x "ngrok" > /dev/null; then
    echo "⚠️ Ngrokが既に起動しています。停止中..."
    pkill ngrok
    sleep 2
fi

# ポート3000でNgrok起動（バックグラウンド）
echo "🌐 Ngrok起動中... (Port 3000)"
ngrok http 3000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# NgrokのURL取得まで待機
echo "⏳ NgrokのURL取得を待機中..."
sleep 5

# NgrokのURLを取得
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo "❌ NgrokのURL取得に失敗しました"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ Ngrok URL: $NGROK_URL"
echo "📋 SlackのWebhook URLを以下に設定してください:"
echo "   $NGROK_URL/slack/events"

# GhostWriter起動
echo "🤖 GhostWriter起動中..."
npm run dev

# Ctrl+Cで停止時のクリーンアップ
trap 'echo "🛑 サーバー停止中..."; kill $NGROK_PID 2>/dev/null; exit 0' INT

wait

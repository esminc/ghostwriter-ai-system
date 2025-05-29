#!/bin/bash

echo "🚀 GhostWriter Slack Bot再起動 - y-sakai修正版"
echo ""

cd /Users/takuya/Documents/AI-Work/GhostWriter

# 既存のプロセスを停止（もしあれば）
echo "🛑 既存プロセスの停止..."
pkill -f "node.*slack-bot" || echo "既存プロセスなし"

sleep 2

# 新しいプロセスを起動
echo "🚀 修正版Slack Bot起動..."
node src/slack-bot.js

echo ""
echo "✅ 起動完了 - y-sakaiマッピング修正版"

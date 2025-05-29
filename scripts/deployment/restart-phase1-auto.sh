#!/bin/bash

echo "🚀 Phase 1完全自動化版 Slack Bot再起動"
echo "📍 MCP統合は含まれていません（別システム）"
echo ""

cd /Users/takuya/Documents/AI-Work/GhostWriter

# 既存のプロセスを停止
echo "🛑 既存プロセスの停止..."
pkill -f "node.*slack-bot" || echo "既存プロセスなし"

sleep 2

# Phase 1完全自動化版を起動
echo "🚀 Phase 1完全自動化版 起動..."
echo "   - y-sakaiマッピング修正済み"
echo "   - 完全自動マッピング（Phase 3）"
echo "   - 新ユーザー手動設定不要"
echo ""

node src/slack-bot.js

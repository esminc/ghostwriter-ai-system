#!/bin/bash

# Phase 6.5: etc-spotsメッセージ取得問題緊急修正（正しい起動方法）
# Slackアプリサーバー再起動とログ確認スクリプト

echo "🔧 Phase 6.5: 緊急修正 - Slackアプリサーバー再起動"
echo "============================================="

# 1. 現在のサーバープロセスを停止
echo "📊 Step 1: 現在のSlackサーバープロセス確認・停止"
pkill -f "npm run slack:dev" || echo "既存Slackプロセスなし"
pkill -f "nodemon.*slack-bot.js" || echo "既存nodemonプロセスなし"
pkill -f "node.*slack-bot.js" || echo "既存nodeプロセスなし"

# 2. ファイル更新確認
echo "📊 Step 2: 修正ファイル確認"
echo "slack-mcp-wrapper-direct.js の更新時刻:"
ls -la src/mcp-integration/slack-mcp-wrapper-direct.js | awk '{print $6, $7, $8}'
echo "slack-bot.js の確認:"
ls -la src/slack-bot.js | awk '{print $6, $7, $8}'

# 3. 起動確認
echo "📊 Step 3: package.json確認"
echo "slack:dev スクリプト: $(grep -A1 '\"slack:dev\"' package.json)"

# 4. 正しいSlackサーバー起動
echo "📊 Step 4: Slackアプリサーバー起動（デバッグモード）"
echo "修正内容:"
echo "  ✅ 時間範囲: 6時間 → 24時間"
echo "  ✅ etc-spots詳細ログ追加"  
echo "  ✅ メッセージ取得確認機能強化"
echo ""
echo "🚀 Slackアプリサーバー起動中..."
echo "起動後、Slackで /diary コマンドを実行してください"
echo "コンソールでetc-spotsチャンネルの詳細情報を確認できます"
echo ""

# 正しいSlackアプリでサーバー起動
npm run slack:dev

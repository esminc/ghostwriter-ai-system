#!/bin/bash

# Phase 6.5: etc-spotsメッセージ取得問題緊急修正
# サーバー再起動とログ確認スクリプト

echo "🔧 Phase 6.5: 緊急修正 - サーバー再起動"
echo "=================================="

# 1. 現在のサーバープロセスを停止
echo "📊 Step 1: 現在のサーバープロセス確認・停止"
pkill -f "npm run dev" || echo "既存プロセスなし"
pkill -f "node.*app.js" || echo "既存プロセスなし"

# 2. ファイル更新確認
echo "📊 Step 2: 修正ファイル確認"
echo "slack-mcp-wrapper-direct.js の更新時刻:"
ls -la src/mcp-integration/slack-mcp-wrapper-direct.js | awk '{print $6, $7, $8}'

# 3. 依存関係確認
echo "📊 Step 3: npm依存関係確認"
npm list --depth=0 | grep -E "(slack|mcp)" || echo "依存関係確認完了"

# 4. サーバー再起動
echo "📊 Step 4: サーバー再起動（デバッグモード）"
echo "環境変数確認:"
echo "NODE_ENV: ${NODE_ENV:-development}"
echo "DEBUG: ${DEBUG:-none}"

echo ""
echo "🚀 サーバー起動中..."
echo "修正内容:"
echo "  - 時間範囲: 6時間 → 24時間"
echo "  - etc-spots詳細ログ追加"
echo "  - メッセージ取得確認機能強化"
echo ""
echo "起動後、Slackで /diary コマンドを実行してください"
echo "ログでetc-spotsチャンネルの詳細情報を確認できます"

# デバッグモードでサーバー起動
DEBUG=slack:* npm run dev

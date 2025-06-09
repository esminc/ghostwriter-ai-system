#!/bin/bash

# Phase 1移行テスト - ngrok + Slack Bot同時起動スクリプト

echo "🚀 Phase 1移行テスト開始"
echo "フェーズ: auto_with_manual_fallback"
echo "期待成果: 自動マッピング成功率 > 80%"
echo ""

# 環境変数確認
echo "📊 環境設定確認:"
echo "MAPPING_PHASE: $MAPPING_PHASE"
echo "ESA_TEAM_NAME: $ESA_TEAM_NAME"
echo "NODE_ENV: $NODE_ENV"
echo ""

# 依存関係チェック
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed."
    echo "📥 Please install: brew install ngrok"
    exit 1
fi

if [ ! -f "src/slack/app.js" ]; then
    echo "❌ Slack Bot file not found: src/slack/app.js"
    exit 1
fi

echo "✅ 依存関係確認完了"
echo ""

# ログファイル準備
echo "📝 Phase 1移行ログ開始 - $(date)" >> logs/mapping-migration.log
echo "フェーズ: auto_with_manual_fallback" >> logs/mapping-migration.log
echo "" >> logs/mapping-migration.log

echo "🎯 Phase 1テスト手順:"
echo "1. Terminal 1: ngrok起動 (このスクリプトで自動実行)"
echo "2. Terminal 2: Slack Bot起動"
echo "3. SlackでURL設定後、/ghostwrite テスト実行"
echo "4. 自動マッピング動作・統計監視"
echo ""

echo "💡 Slack App設定用URL (ngrok起動後に表示されるHTTPS URLを使用):"
echo "   - Request URL: https://xxxxx.ngrok.io/slack/events"
echo ""

echo "🌐 ngrok起動中..."
echo "別ターミナルで以下を実行してください:"
echo "   cd /Users/takuya/Documents/AI-Work/GhostWriter"
echo "   node src/slack/app.js"
echo ""

# ngrok起動 (ポート3000)
ngrok http 3000

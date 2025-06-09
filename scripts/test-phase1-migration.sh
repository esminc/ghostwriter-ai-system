#!/bin/bash
# Phase 1移行テスト実行スクリプト
# ngrok環境での自動マッピングシステムテスト

echo "🚀 Phase 1移行テスト開始"
echo "フェーズ: auto_with_manual_fallback"
echo "環境: ngrok開発環境"
echo ""

# 1. 環境変数確認
echo "📊 環境変数確認..."
echo "MAPPING_PHASE: $MAPPING_PHASE"
echo "SLACK_BOT_TOKEN: ${SLACK_BOT_TOKEN:0:10}..."
echo "ESA_ACCESS_TOKEN: ${ESA_ACCESS_TOKEN:0:10}..."
echo ""

# 2. ログディレクトリ確認
echo "📁 ログディレクトリ確認..."
if [ ! -d "logs" ]; then
    mkdir logs
    echo "✅ logsディレクトリ作成"
fi

if [ ! -f "logs/mapping-migration.log" ]; then
    touch logs/mapping-migration.log
    echo "✅ mapping-migration.log作成"
fi

# 3. 依存関係確認
echo "📦 依存関係確認..."
npm list --depth=0 | grep -E "(slack|express|dotenv)" || echo "⚠️ 一部依存関係が不足している可能性があります"

# 4. データベース確認
echo "💾 データベース確認..."
if [ -f "src/database/ghostwriter.db" ]; then
    echo "✅ データベースファイル存在"
else
    echo "⚠️ データベースファイルが見つかりません（初回起動時に作成されます）"
fi

# 5. ngrok確認
echo "🌐 ngrok確認..."
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok利用可能"
    echo "💡 起動コマンド: ngrok http 3000"
else
    echo "❌ ngrokがインストールされていません"
    echo "📥 インストール: https://ngrok.com/download"
fi

echo ""
echo "🎯 Phase 1テスト手順:"
echo "1. Terminal 1: ngrok http 3000"
echo "2. Slack App設定更新: https://api.slack.com/apps"
echo "3. Terminal 2: node src/slack/app.js"
echo "4. Slackで /ghostwrite テスト"
echo "5. ログ監視: tail -f logs/mapping-migration.log"
echo ""

echo "📊 監視すべきメトリクス:"
echo "- 自動マッピング成功率 > 80%"
echo "- フォールバック使用率 < 20%" 
echo "- 平均処理時間 < 100ms"
echo "- エラー率 < 5%"
echo ""

echo "✅ Phase 1移行テスト準備完了!"

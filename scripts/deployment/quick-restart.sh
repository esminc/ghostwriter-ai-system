#!/bin/bash

# GhostWriter 0.1.0 - セッション継続用クイックスタートスクリプト
# 実行: bash quick-restart.sh

echo "🚀 GhostWriter 0.1.0 - セッション継続開始"
echo "=============================================="

# プロジェクトディレクトリに移動
cd /Users/takuya/Documents/AI-Work/GhostWriter

echo "📁 現在のディレクトリ: $(pwd)"

# 環境変数ファイル確認
echo "🔍 環境変数ファイル確認:"
if [ -f .env ]; then
    echo "  ✅ .env ファイル存在"
    echo "  📊 ファイルサイズ: $(wc -c < .env) bytes"
else
    echo "  ❌ .env ファイルが見つかりません"
    exit 1
fi

# 重要ファイルの存在確認
echo "📋 重要ファイル確認:"
files=(
    "final-slack-test.js"
    "test-diary-generation.js"
    "test-esa-posting.js"
    "src/mcp-integration/slack-mcp-wrapper-direct.js"
    "src/ai/openai-client.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file が見つかりません"
    fi
done

echo ""
echo "🎯 次のタスク: esa投稿機能テスト"
echo "実行コマンド:"
echo "  ドライラン: node test-esa-posting.js \"岡本拓也\" U040L7EJC0Z"
echo "  実投稿:     node test-esa-posting.js \"岡本拓也\" U040L7EJC0Z --real-post"
echo ""
echo "📚 詳細情報: SESSION_HANDOVER_2025_06_01.md を参照"

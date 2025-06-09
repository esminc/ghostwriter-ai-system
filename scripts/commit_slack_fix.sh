#!/bin/bash

# GhostWriter Slack フォールバック判定修正のコミット

cd /Users/takuya/Documents/AI-Work/GhostWriter

echo "🔧 Slack フォールバック判定修正をコミット中..."

# 変更ファイルの確認
echo "📋 変更ファイルの確認:"
git status

# ステージング
echo "📁 変更をステージング中..."
git add src/mcp-integration/llm-diary-generator-phase53-unified.js
git add .gitmessage
git add COMMIT_MESSAGE.md

# コミット実行
echo "💾 コミット実行中..."
git commit -F .gitmessage

echo "✅ コミット完了！"

# 最新のコミット確認
echo "📊 最新のコミット情報:"
git log --oneline -1

echo "🎉 Slack フォールバック判定修正が正常にコミットされました！"

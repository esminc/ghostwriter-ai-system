#!/bin/bash

# Phase 2-A タイトル修正コミット実行スクリプト

echo "🚀 Phase 2-A タイトル修正コミット実行"
echo "📅 実行日時: $(date)"

# 現在のGit状態確認
echo -e "\n🔍 現在のGit状態:"
git status --short

# 変更されたファイル確認
echo -e "\n📝 変更されたファイル:"
git diff --name-only

# ステージング
echo -e "\n📦 変更をステージング..."
git add src/mcp-integration/llm-diary-generator.js
git add src/mcp-integration/full-featured-slack-bot.js

# コミット実行
echo -e "\n💾 コミット実行..."
git commit -m "feat: Phase 2-A タイトル形式をPhase 1完全互換に修正

- 【代筆】ユーザー名: タイトル 形式を完全復活
- esa投稿時の代筆情報を強化（投稿者esa_bot、メッセージ明確化）
- Slack Bot表示で代筆対象ユーザーを明確化
- Phase 2-A MCP統合版の代筆機能完全対応

修正ファイル:
- src/mcp-integration/llm-diary-generator.js: タイトル生成とesa投稿データ準備
- src/mcp-integration/full-featured-slack-bot.js: Slack表示での代筆情報強化

これにより Phase 2-A は Phase 1 の代筆表示機能を完全継承しつつ
MCP統合による効率化を実現した完成版となった。"

echo -e "\n✅ コミット完了"

# 最新のコミット確認
echo -e "\n📋 最新コミット:"
git log --oneline -1

echo -e "\n🎉 Phase 2-A タイトル修正コミット完了！"
echo "次のステップ: git push origin main でリモートにプッシュ"

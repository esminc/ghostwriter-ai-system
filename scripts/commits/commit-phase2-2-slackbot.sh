#!/bin/bash

# Phase 2-2: Slack Bot基本実装コミット
echo "🤖 Phase 2-2: Slack Bot基本実装をコミット中..."

# Slack Bot関連ファイルをステージング
git add src/slack/
git add src/slack-bot.js

# コミット実行
git commit -m "🤖 Phase 2-2: Slack Bot基本実装完了

🚀 Slack Bot統合システム実装
============================

✨ 実装機能:
- GhostWriterSlackBot クラス完全実装
- /ghostwrite コマンド対応
- 対話的UI (ボタン・アクション)
- esa自動投稿機能
- 履歴管理・再生成機能
- Phase 1システムとの完全統合

🎯 主要機能:
- handleGhostwriteCommand() - コマンド処理
- generateDiary() - AI代筆生成 (Phase 1活用)
- handleEsaPostAction() - esa投稿連携
- showHistory() - 履歴表示
- getInteractiveBlocks() - UI構築

💬 Slack機能:
- スラッシュコマンド (/ghostwrite)
- インタラクティブボタン
- メンション対応 (@GhostWriter)
- エラーハンドリング

🔗 統合:
- Phase 1 AI Profile Analyzer完全活用
- Phase 1 AI Diary Generator完全活用
- リアルタイムesa API連携
- SQLiteデータベース連携"

if [ $? -eq 0 ]; then
    echo "✅ Phase 2-2コミット完了"
else
    echo "❌ Phase 2-2コミットでエラーが発生"
fi

#!/bin/bash

# Session 6: OpenAI API問題解決 - 分割コミットスクリプト
# 実行前に現在のディレクトリがGhostWriterルートであることを確認

echo "🚀 Session 6: OpenAI API問題解決 - 分割コミット開始"
echo "=================================================="

# 現在のディレクトリ確認
if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
    echo "❌ エラー: GhostWriterプロジェクトのルートディレクトリで実行してください"
    exit 1
fi

echo "📂 現在のディレクトリ: $(pwd)"
echo ""

# Git状態確認
echo "📋 Step 1: Git状態確認"
echo "----------------------"
git status --porcelain
echo ""

# 変更されたファイルの一覧表示
echo "📝 変更されたファイル:"
git diff --name-only
echo ""

# ユーザー確認
read -p "🤔 上記の変更をコミットしますか？ (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⏹️  コミット処理を中止しました"
    exit 0
fi

echo ""
echo "🔄 分割コミット実行中..."
echo ""

# Commit 1: OpenAI API デバッグログ強化
echo "📦 Commit 1/4: OpenAI API デバッグログ強化"
if git diff --name-only | grep -q "src/ai/openai-client.js"; then
    git add src/ai/openai-client.js
    git commit -m "🔧 OpenAI API デバッグログ強化

- 初期化時の詳細ログ追加（API Key存在・長さ・プレフィックス）
- API呼び出し開始/完了時のログ追加
- エラー時の詳細情報出力
- フォールバックモード状態の明確化

目的: Slack Bot経由でのフォールバック問題診断強化"
    echo "✅ Commit 1 完了: OpenAI API デバッグログ強化"
else
    echo "⏭️  Commit 1 スキップ: src/ai/openai-client.js に変更なし"
fi
echo ""

# Commit 2: AIDiaryGenerator 自動生成対応
echo "📦 Commit 2/4: AIDiaryGenerator 自動生成機能改善"
if git diff --name-only | grep -q "src/services/ai-diary-generator.js"; then
    git add src/services/ai-diary-generator.js
    git commit -m "🤖 AIDiaryGenerator 自動生成機能改善

- inputActions空配列時の自動生成対応
- ダミーアクション'今日のタスクと日常作業'を使用
- 詳細デバッグログ追加（ターゲットユーザー・アクション数・自動生成状態）
- AI生成結果の詳細ログ出力

修正内容: Slack Bot→AI生成パイプラインの確実な動作保証"
    echo "✅ Commit 2 完了: AIDiaryGenerator 自動生成機能改善"
else
    echo "⏭️  Commit 2 スキップ: src/services/ai-diary-generator.js に変更なし"
fi
echo ""

# Commit 3: Slack Bot パラメータ渡し修正
echo "📦 Commit 3/4: Slack Bot AI日記生成パラメータ修正"
if git diff --name-only | grep -q "src/slack/app.js"; then
    git add src/slack/app.js
    git commit -m "🚀 Slack Bot AI日記生成パラメータ修正

- generateDiary呼び出し時のinputActions明示的指定
- contextData.allow_automatic=true追加
- 自動生成許可フラグの適切な設定
- source情報追加（slack_bot）

効果: フォールバック問題解決・AI生成の確実な実行"
    echo "✅ Commit 3 完了: Slack Bot AI日記生成パラメータ修正"
else
    echo "⏭️  Commit 3 スキップ: src/slack/app.js に変更なし"
fi
echo ""

# Commit 4: CHAT_CONTINUATION.md 更新
echo "📦 Commit 4/4: Session 6完了記録更新"
if git diff --name-only | grep -q "CHAT_CONTINUATION.md"; then
    git add CHAT_CONTINUATION.md
    git commit -m "📝 Session 6完了記録更新

- OpenAI API問題完全解決の記録
- Phase 2完全達成状況の更新
- 技術仕様・動作確認結果の詳細記録
- 次回作業指示の更新

成果: 全機能100%動作確認・esa投稿成功(#955)"
    echo "✅ Commit 4 完了: Session 6完了記録更新"
else
    echo "⏭️  Commit 4 スキップ: CHAT_CONTINUATION.md に変更なし"
fi
echo ""

# 残りのファイルがあるかチェック
remaining_files=$(git diff --name-only)
if [[ -n "$remaining_files" ]]; then
    echo "⚠️  以下のファイルに未コミットの変更があります:"
    echo "$remaining_files"
    echo ""
    read -p "🤔 これらのファイルもまとめてコミットしますか？ (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "🔧 Session 6: その他の修正・調整

- 設定ファイルやその他のサポートファイルの更新
- Session 6で実施した細かな調整の反映

補完: Session 6完了時の全変更を確実にコミット"
        echo "✅ その他の変更もコミット完了"
    else
        echo "⏭️  その他の変更はスキップしました"
    fi
fi

echo ""
echo "🎉 分割コミット完了！"
echo "===================="

# 最終的なコミット履歴を表示
echo "📜 最新のコミット履歴 (直近5件):"
git log --oneline -5

echo ""
echo "📊 Session 6 成果サマリー:"
echo "- 🔧 OpenAI API デバッグログ強化"
echo "- 🤖 AIDiaryGenerator 自動生成対応"
echo "- 🚀 Slack Bot パラメータ修正"
echo "- 📝 完了記録ドキュメント更新"
echo "- 🎯 結果: フォールバック問題完全解決"
echo "- 🏆 Phase 2 完全達成: AI生成成功 + esa投稿成功"

echo ""
echo "🚀 次のステップ:"
echo "1. git push origin main  # リモートリポジトリに送信"
echo "2. Phase 3 機能実装開始"
echo "3. Google Calendar連携・MCP Server実装"

echo ""
echo "✨ Session 6: OpenAI API問題解決 - 完了！ ✨"

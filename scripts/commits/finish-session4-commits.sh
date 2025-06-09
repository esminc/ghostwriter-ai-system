#!/bin/bash

# Session 4 残りファイルのコミット
echo "🔧 Session 4 残りファイルのコミット"

cd /Users/takuya/Documents/AI-Work/GhostWriter

# 現在の状況確認
echo "📊 現在の変更ファイル:"
git status --short
echo ""

# 残りのファイルを個別にコミット
echo "📝 コミット3: データベースモデルの履歴機能強化"
git add src/database/models/history.js src/database/models/profile.js
git commit -m "feat(database): 履歴機能とプロフィール機能のモデル強化

- History モデルの getRecentHistory メソッド追加
- Profile モデルの機能強化
- Slack Bot での履歴表示機能をサポート"

echo "✅ コミット3完了"
echo ""

echo "📝 コミット4: 依存関係の更新"
git add package.json package-lock.json
git commit -m "chore: 依存関係の更新

- 必要なパッケージの追加・更新
- Slack Bot機能に必要な依存関係を整備"

echo "✅ コミット4完了"
echo ""

echo "📝 コミット5: Session 4完了記録の更新"
git add CHAT_CONTINUATION.md
git commit -m "docs: Session 4 完了状況をチャット継続情報に更新

- esa投稿機能完全動作達成の記録
- 全ての修正されたエラーと解決状況を記録
- 実際の投稿成功実績（#951, #952, #953）を記録
- Phase 3候補機能と次のステップを整理
- プロジェクト統計とマイルストーン更新"

echo "✅ コミット5完了"
echo ""

echo "🎉 Session 4 コミット完了！"
echo ""
echo "📈 最新のコミット履歴:"
git log --oneline -8
echo ""
echo "🏆 Phase 2完全達成: Slack Bot + esa投稿機能完全動作！"

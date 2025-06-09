#!/bin/bash

# Phase 2-3: テスト・設定・ドキュメント実装コミット
echo "📚 Phase 2-3: テスト・設定・ドキュメントをコミット中..."

# テスト・設定・ドキュメント関連ファイルをステージング
git add src/test-slack-bot.js
git add docs/SLACK_BOT_SETUP.md
git add package.json

# コミット実行
git commit -m "📚 Phase 2-3: テスト・設定・ドキュメント完備

🧪 テスト・設定・ドキュメント体系
==============================

🧪 テスト機能:
- Slack Bot統合テスト完全実装
- Phase 1機能との統合確認
- 統計情報表示テスト
- 実装状況の自動確認

📋 設定ガイド:
- Slack App作成手順詳細
- Bot Token・Signing Secret取得方法
- 環境変数設定手順
- ngrok使用方法 (開発用)
- クラウドデプロイ方法

📝 package.json更新:
- npm run test:slack 追加
- npm run slack 追加 
- npm run slack:dev 追加
- openai依存関係追加

🎯 運用準備:
- 完全な設定手順書
- トラブルシューティング
- 本格運用のためのガイド
- チーム展開準備

✅ 品質保証:
- 全機能のテスト確認
- エラーハンドリング確認
- 統計情報正確性確認 (7件のAI生成実績)"

if [ $? -eq 0 ]; then
    echo "✅ Phase 2-3コミット完了"
else
    echo "❌ Phase 2-3コミットでエラーが発生"
fi

#!/bin/bash

# PostgreSQL対応修正コミット
echo "🔧 PostgreSQLモデル修正をコミット中..."

git add src/database/models/
git add src/slack/app.js
git add scripts/test/test-postgresql-models.js

git commit -m "🔧 PostgreSQL対応修正完了

✅ データベースモデル修正:
- User.js: SQLite → PostgreSQL async/await対応
- Profile.js: PostgreSQL パラメータ形式対応
- History.js: PostgreSQL JOIN修正

✅ Slack Bot修正:
- static method呼び出しに修正
- データベースエラー完全解消

✅ テスト確認:
- PostgreSQLモデルテスト成功
- Slack Bot完全動作確認
- esa投稿・履歴保存正常動作

🎯 Renderデプロイ準備100%完了"

echo "✅ PostgreSQL対応修正コミット完了！"
echo "🚀 次: git push origin main でGitHubに反映後、Renderデプロイ実行"

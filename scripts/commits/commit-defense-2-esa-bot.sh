#!/bin/bash

cd /Users/takuya/Documents/AI-Work/GhostWriter

echo "🏢 コミット2: esa_bot投稿者統一 - 企業レベル権限分離システム"

# esa API とSlack App の投稿者統一をステージング
git add src/services/esa-api.js src/slack/app.js

echo "📋 変更内容確認:"
git diff --cached src/services/esa-api.js src/slack/app.js

echo ""
echo "💭 コミットメッセージプレビュー:"
echo "🏢 esa_bot投稿者統一: 企業レベル権限分離システム実装"
echo ""
echo "- esa API: user パラメータ対応でesa_bot指定機能追加"
echo "- Slack Bot: 全投稿をesa_bot統一投稿者で実行"
echo "- 権限分離: 個人アカウント→システム専用アカウント"
echo "- メッセージ統一: 🤖 AI代筆システム形式"
echo "- デバッグ強化: 投稿前後の詳細ログ追加"
echo ""
echo "企業レベルの統一投稿者システム完成"

read -p "このコミットを実行しますか? (y/N): " confirm
if [[ $confirm == [yY] ]]; then
    git commit -m "🏢 esa_bot投稿者統一: 企業レベル権限分離システム実装

- esa API: user パラメータ対応でesa_bot指定機能追加
- Slack Bot: 全投稿をesa_bot統一投稿者で実行
- 権限分離: 個人アカウント→システム専用アカウント
- メッセージ統一: 🤖 AI代筆システム形式
- デバッグ強化: 投稿前後の詳細ログ追加

企業レベルの統一投稿者システム完成"
    
    echo "✅ コミット2完了"
else
    echo "❌ コミット2をスキップ"
fi

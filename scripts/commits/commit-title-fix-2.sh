#!/bin/bash

cd /Users/takuya/Documents/AI-Work/GhostWriter

echo "🎯 コミット2: 三段階防御システム - メイン処理統合"

# 残りの変更をステージング（同じファイルの追加変更があれば）
git add src/services/ai-diary-generator.js

echo "📋 追加変更確認:"
git diff --cached

echo ""
echo "💭 コミットメッセージプレビュー:"
echo "🎯 三段階防御システム: メイン処理統合とエラーハンドリング"
echo ""
echo "- generateDiary()メソッドの統合結果処理修正"
echo "- integrationResult構造への対応実装"
echo "- エラーハンドリング強化とnull/undefined対策"
echo "- 統合結果デバッグログ追加"
echo "- 品質チェック処理の安定性向上"
echo ""
echo "三段階防御システムのメイン処理統合完了"

read -p "このコミットを実行しますか? (y/N): " confirm
if [[ $confirm == [yY] ]]; then
    git commit -m "🎯 三段階防御システム: メイン処理統合とエラーハンドリング

- generateDiary()メソッドの統合結果処理修正
- integrationResult構造への対応実装
- エラーハンドリング強化とnull/undefined対策  
- 統合結果デバッグログ追加
- 品質チェック処理の安定性向上

三段階防御システムのメイン処理統合完了"
    
    echo "✅ コミット2完了"
else
    echo "❌ コミット2をスキップ"
fi

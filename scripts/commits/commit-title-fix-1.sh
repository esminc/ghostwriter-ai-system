#!/bin/bash

cd /Users/takuya/Documents/AI-Work/GhostWriter

echo "🛡️ コミット1: 三段階防御システム - integrateDiaries()メソッド修正"

# ステージングと詳細確認
git add src/services/ai-diary-generator.js

echo "📋 変更内容確認:"
git diff --cached src/services/ai-diary-generator.js | head -50

echo ""
echo "💭 コミットメッセージプレビュー:"
echo "🛡️ 三段階防御システム: integrateDiaries()統合処理修正"
echo ""
echo "- integrateDiaries()戻り値を{content, title}オブジェクトに変更"
echo "- AI生成タイトルの統合処理内抽出を実装"
echo "- タイトル行除去タイミングの最適化"
echo "- 詳細デバッグログ追加で可視性向上"
echo "- タイトル重複問題の根本原因解決"
echo ""
echo "Phase 1三段階防御システム完成に向けた重要な統合処理修正"

read -p "このコミットを実行しますか? (y/N): " confirm
if [[ $confirm == [yY] ]]; then
    git commit -m "🛡️ 三段階防御システム: integrateDiaries()統合処理修正

- integrateDiaries()戻り値を{content, title}オブジェクトに変更
- AI生成タイトルの統合処理内抽出を実装  
- タイトル行除去タイミングの最適化
- 詳細デバッグログ追加で可視性向上
- タイトル重複問題の根本原因解決

Phase 1三段階防御システム完成に向けた重要な統合処理修正"
    
    echo "✅ コミット1完了"
else
    echo "❌ コミット1をスキップ"
    git reset HEAD src/services/ai-diary-generator.js
fi

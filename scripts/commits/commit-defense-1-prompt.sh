#!/bin/bash

cd /Users/takuya/Documents/AI-Work/GhostWriter

echo "🛡️ コミット1: AI生成プロンプト強化 - 三段階防御システム第1段階"

# AIプロンプト強化をステージング
git add src/ai/openai-client.js

echo "📋 変更内容確認:"
git diff --cached src/ai/openai-client.js

echo ""
echo "💭 コミットメッセージプレビュー:"
echo "🛡️ AI生成プロンプト強化: 三段階防御システム第1段階実装"
echo ""
echo "- 絶対的生成ルール追加: 出力1行目に\"タイトル:\"必須化"
echo "- プロンプト構造化: テンプレート形式で厳格な指示"
echo "- 温度調整: 0.8→0.6で創造性と制御のバランス改善"
echo "- フォールバック修正: 同形式での一貫性確保"
echo "- タイトル重複問題の根本対策開始"
echo ""
echo "Phase 1三段階防御システム - AIプロンプト強化完了"

read -p "このコミットを実行しますか? (y/N): " confirm
if [[ $confirm == [yY] ]]; then
    git commit -m "🛡️ AI生成プロンプト強化: 三段階防御システム第1段階実装

- 絶対的生成ルール追加: 出力1行目に\"タイトル:\"必須化
- プロンプト構造化: テンプレート形式で厳格な指示
- 温度調整: 0.8→0.6で創造性と制御のバランス改善
- フォールバック修正: 同形式での一貫性確保
- タイトル重複問題の根本対策開始

Phase 1三段階防御システム - AIプロンプト強化完了"
    
    echo "✅ コミット1完了"
else
    echo "❌ コミット1をスキップ"
    git reset HEAD src/ai/openai-client.js
fi

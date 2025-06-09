#!/bin/bash

cd /Users/takuya/Documents/AI-Work/GhostWriter

echo "🚀 Phase 1システム強化 - 三段階防御+企業レベル権限分離コミット"
echo "=================================================================="
echo ""

# スクリプトに実行権限を付与
chmod +x commit-defense-1-prompt.sh
chmod +x commit-defense-2-esa-bot.sh  
chmod +x commit-defense-3-docs.sh

echo "📋 コミット計画:"
echo "1️⃣ AI生成プロンプト強化 (三段階防御システム第1段階)"
echo "2️⃣ esa_bot投稿者統一 (企業レベル権限分離)"
echo "3️⃣ Phase 1完全自動化完成記録 (ドキュメント更新)"
echo ""

# 現在のブランチとステータス確認
echo "🔍 現在のGit状態:"
git branch
git status --short
echo ""

read -p "全てのコミットを順次実行しますか? (y/N): " confirm_all

if [[ $confirm_all == [yY] ]]; then
    echo ""
    echo "🚀 コミット実行開始..."
    echo ""
    
    # コミット1実行 - AI生成プロンプト強化
    echo "=== コミット1実行: AI生成プロンプト強化 ==="
    ./commit-defense-1-prompt.sh
    
    echo ""
    echo "=== コミット2実行: esa_bot投稿者統一 ==="  
    ./commit-defense-2-esa-bot.sh
    
    echo ""
    echo "=== コミット3実行: ドキュメント更新 ==="
    ./commit-defense-3-docs.sh
    
    echo ""
    echo "✅ 全コミット完了！"
    echo ""
    echo "📊 最終Git状態:"
    git log --oneline -5
    git status
    
    echo ""
    echo "🎉 Phase 1システム強化コミット完了！"
    echo ""
    echo "🛡️ 達成内容:"
    echo "   - 三段階防御システム第1段階実装"
    echo "   - 企業レベル権限分離システム完成"  
    echo "   - Phase 1完全自動化完成記録"
    echo ""
    echo "🚀 次のステップ: タイトル重複問題完全解決のため"
    echo "   三段階防御システム第2・第3段階実装が必要"
    
else
    echo ""
    echo "個別実行する場合:"
    echo "./commit-defense-1-prompt.sh  # AI生成プロンプト強化"
    echo "./commit-defense-2-esa-bot.sh  # esa_bot投稿者統一"  
    echo "./commit-defense-3-docs.sh     # ドキュメント更新"
fi

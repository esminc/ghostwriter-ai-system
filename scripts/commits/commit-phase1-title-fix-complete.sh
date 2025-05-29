#!/bin/bash

cd /Users/takuya/Documents/AI-Work/GhostWriter

echo "🛡️ タイトル重複問題完全解決 - 三段階防御システム完成コミット"
echo "=========================================================="
echo ""

# スクリプトに実行権限を付与
chmod +x commit-title-fix-1.sh
chmod +x commit-title-fix-2.sh  
chmod +x commit-title-fix-3.sh

echo "📋 コミット計画:"
echo "1️⃣ integrateDiaries()統合処理修正"
echo "2️⃣ メイン処理統合とエラーハンドリング"
echo "3️⃣ Phase 1完成記念・ドキュメント更新"
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
    
    # コミット1実行
    echo "=== コミット1実行 ==="
    ./commit-title-fix-1.sh
    
    echo ""
    echo "=== コミット2実行 ==="  
    ./commit-title-fix-2.sh
    
    echo ""
    echo "=== コミット3実行 ==="
    ./commit-title-fix-3.sh
    
    echo ""
    echo "✅ 全コミット完了！"
    echo ""
    echo "📊 最終Git状態:"
    git log --oneline -5
    git status
    
    echo ""
    echo "🎉 Phase 1システム完成記念コミット完了！"
    echo "🚀 Phase 2-A MCP統合比較評価の準備が整いました"
    
else
    echo ""
    echo "個別実行する場合:"
    echo "./commit-title-fix-1.sh  # 統合処理修正"
    echo "./commit-title-fix-2.sh  # メイン処理修正"  
    echo "./commit-title-fix-3.sh  # Phase 1完成記念"
fi

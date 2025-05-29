#!/bin/bash

# Phase 2全体のコミット実行スクリプト
echo "🎊 Phase 2: 全コミット実行開始"
echo "================================"

# 実行権限付与
chmod +x commit-phase2-1-database.sh
chmod +x commit-phase2-2-slackbot.sh  
chmod +x commit-phase2-3-docs.sh
chmod +x commit-phase2-4-final.sh

echo "📋 実行予定:"
echo "1. Phase 2-1: データベース・統計機能改善"
echo "2. Phase 2-2: Slack Bot基本実装"
echo "3. Phase 2-3: テスト・設定・ドキュメント"
echo "4. Phase 2-4: README・プロジェクト完成"
echo ""

read -p "全てのコミットを実行しますか? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Phase 2コミット開始..."
    echo ""
    
    # Phase 2-1実行
    echo "▶️ Phase 2-1実行中..."
    ./commit-phase2-1-database.sh
    echo ""
    
    # Phase 2-2実行
    echo "▶️ Phase 2-2実行中..."
    ./commit-phase2-2-slackbot.sh
    echo ""
    
    # Phase 2-3実行
    echo "▶️ Phase 2-3実行中..."
    ./commit-phase2-3-docs.sh
    echo ""
    
    # Phase 2-4実行
    echo "▶️ Phase 2-4実行中..."
    ./commit-phase2-4-final.sh
    echo ""
    
    echo "🎉 Phase 2全コミット完了！"
    echo "=============================="
    echo "🏆 Phase 1 + Phase 2統合完了"
    echo "🚀 革新的AI代筆システム完成"
    echo ""
    echo "📋 次のステップ:"
    echo "1. git log --oneline で実行結果確認"
    echo "2. Slack設定完了 (docs/SLACK_BOT_SETUP.md)"
    echo "3. npm run slack でBot起動"
    echo "4. /ghostwrite でAI代筆体験開始！"
    
else
    echo "❌ コミット実行をキャンセルしました"
fi

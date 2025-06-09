#!/bin/bash

# Phase 5 プロジェクト構造整理スクリプト - ファイル移動編

echo "📁 Phase 5 ファイル移動開始..."
echo "============================================================"

echo "📚 Phase関連ドキュメントを移動中..."

# Phase 4関連
if [ -f "PHASE4_COMPLETE_HANDOVER_2025_06_03.md" ]; then
    mv "PHASE4_COMPLETE_HANDOVER_2025_06_03.md" "docs/phases/phase4/handover.md"
    echo "✅ Phase 4 引き継ぎドキュメント移動"
fi

if [ -f "NEXT_SESSION_PROMPT_PHASE4_COMPLETE.md" ]; then
    mv "NEXT_SESSION_PROMPT_PHASE4_COMPLETE.md" "docs/phases/phase4/continuation-prompt.md"
    echo "✅ Phase 4 継続プロンプト移動"
fi

if [ -f "QUICK_REFERENCE_PHASE4.md" ]; then
    mv "QUICK_REFERENCE_PHASE4.md" "docs/phases/phase4/quick-reference.md"
    echo "✅ Phase 4 クイックリファレンス移動"
fi

# Phase 5関連
if [ -f "PHASE5_MCP_COMPLETE_HANDOVER_2025_06_03.md" ]; then
    mv "PHASE5_MCP_COMPLETE_HANDOVER_2025_06_03.md" "docs/phases/phase5/handover.md"
    echo "✅ Phase 5 引き継ぎドキュメント移動"
fi

if [ -f "NEXT_SESSION_PROMPT_PHASE5_COMPLETE.md" ]; then
    mv "NEXT_SESSION_PROMPT_PHASE5_COMPLETE.md" "docs/phases/phase5/continuation-prompt.md"
    echo "✅ Phase 5 継続プロンプト移動"
fi

if [ -f "QUICK_REFERENCE_PHASE5.md" ]; then
    mv "QUICK_REFERENCE_PHASE5.md" "docs/phases/phase5/quick-reference.md"
    echo "✅ Phase 5 クイックリファレンス移動"
fi

echo ""
echo "🤝 引き継ぎドキュメントを移動中..."

if [ -f "SESSION_HANDOVER_2025_06_01.md" ]; then
    mv "SESSION_HANDOVER_2025_06_01.md" "docs/handovers/session-2025-06-01.md"
    echo "✅ セッション引き継ぎ移動"
fi

if [ -f "NEW_SESSION_CONTINUATION_SCRIPT.md" ]; then
    mv "NEW_SESSION_CONTINUATION_SCRIPT.md" "docs/handovers/continuation-script.md"
    echo "✅ 継続スクリプト移動"
fi

echo ""
echo "🔧 技術ドキュメントを移動中..."

if [ -f "CURRENT_STATUS_ESA_MCP_INVESTIGATION.md" ]; then
    mv "CURRENT_STATUS_ESA_MCP_INVESTIGATION.md" "docs/technical/esa-mcp-investigation.md"
    echo "✅ MCP調査ドキュメント移動"
fi

if [ -f "SLACK_INTEGRATION_COMPLETE_REPORT.md" ]; then
    mv "SLACK_INTEGRATION_COMPLETE_REPORT.md" "docs/technical/slack-integration-report.md"
    echo "✅ Slack統合レポート移動"
fi

if [ -f "TIMEOUT_FIX_SUMMARY.md" ]; then
    mv "TIMEOUT_FIX_SUMMARY.md" "docs/technical/timeout-fix-summary.md"
    echo "✅ タイムアウト修正サマリー移動"
fi

echo ""
echo "🗂️ 古いドキュメントをアーカイブ中..."

# Phase 1関連
if [ -f "PHASE1_COMPLETION_RECORD.md" ]; then
    mv "PHASE1_COMPLETION_RECORD.md" "archive/docs/phase1-completion.md"
    echo "✅ Phase 1完了記録をアーカイブ"
fi

if [ -f "NEW_CHAT_PROMPT_INTEREST_ANALYSIS_COMPLETE.md" ]; then
    mv "NEW_CHAT_PROMPT_INTEREST_ANALYSIS_COMPLETE.md" "archive/docs/interest-analysis.md"
    echo "✅ 興味分析ドキュメントをアーカイブ"
fi

if [ -f "NEW_CHAT_PROMPT_STRATEGY_B_100_COMPLETE.md" ]; then
    mv "NEW_CHAT_PROMPT_STRATEGY_B_100_COMPLETE.md" "archive/docs/strategy-b-complete.md"
    echo "✅ Strategy B完了ドキュメントをアーカイブ"
fi

if [ -f "QUICK_REFERENCE_INTEREST_ANALYSIS_COMPLETE.md" ]; then
    mv "QUICK_REFERENCE_INTEREST_ANALYSIS_COMPLETE.md" "archive/docs/interest-analysis-ref.md"
    echo "✅ 興味分析リファレンスをアーカイブ"
fi

if [ -f "QUICK_REFERENCE_STRATEGY_B_COMPLETE.md" ]; then
    mv "QUICK_REFERENCE_STRATEGY_B_COMPLETE.md" "archive/docs/strategy-b-ref.md"
    echo "✅ Strategy Bリファレンスをアーカイブ"
fi

if [ -f "NEXT_SESSION_QUICK_REFERENCE.md" ]; then
    mv "NEXT_SESSION_QUICK_REFERENCE.md" "archive/docs/old-quick-reference.md"
    echo "✅ 古いクイックリファレンスをアーカイブ"
fi

if [ -f "COMMIT_MESSAGE.md" ]; then
    mv "COMMIT_MESSAGE.md" "archive/docs/commit-message.md"
    echo "✅ コミットメッセージをアーカイブ"
fi

echo ""
echo "✅ ドキュメント移動完了！"
echo ""
echo "📁 新しいドキュメント構造:"
echo "docs/"
echo "├── phases/"
echo "│   ├── phase4/ (3ファイル)"
echo "│   └── phase5/ (3ファイル)"
echo "├── handovers/ (2ファイル)"
echo "└── technical/ (3ファイル)"
echo ""
echo "archive/docs/ (7ファイル)"
echo ""
echo "🔄 次のステップ: スクリプトとテストファイルの移動"

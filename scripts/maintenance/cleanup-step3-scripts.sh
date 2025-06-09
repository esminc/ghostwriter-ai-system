#!/bin/bash

# Phase 5 プロジェクト構造整理スクリプト - スクリプト・テスト移動編

echo "🧪 テスト・スクリプトファイル移動開始..."
echo "============================================================"

echo "🎯 Phase 5現行テストを移動中..."

if [ -f "test-mcp-integration-phase5.js" ]; then
    mv "test-mcp-integration-phase5.js" "tests/phase-tests/test-mcp-integration-phase5.js"
    echo "✅ Phase 5 MCP統合テスト移動"
fi

echo ""
echo "🔗 統合テストを移動中..."

if [ -f "complete-integration-test.js" ]; then
    mv "complete-integration-test.js" "tests/integration/complete-integration-test.js"
    echo "✅ 完全統合テスト移動"
fi

if [ -f "test-slack-mcp-integration.js" ]; then
    mv "test-slack-mcp-integration.js" "tests/integration/slack-mcp-integration.js"
    echo "✅ Slack MCP統合テスト移動"
fi

echo ""
echo "🗃️ 古いテストをアーカイブ中..."

# 古いテストファイル群
OLD_TESTS=(
    "test-100-percent-complete.js"
    "test-all-users.js"
    "test-diary-generation.js"
    "test-esa-posting-bot.js"
    "test-esa-posting-wip.js"
    "test-esa-posting.js"
    "test-improved-ai-generation.js"
    "test-real-slack-users.js"
    "test-strategy-b-improved.js"
    "test-strategy-b-slack-integration.js"
)

for test_file in "${OLD_TESTS[@]}"; do
    if [ -f "$test_file" ]; then
        mv "$test_file" "archive/tests/$test_file"
        echo "✅ $test_file をアーカイブ"
    fi
done

echo ""
echo "🔧 メンテナンススクリプトを移動中..."

# デバッグ・メンテナンススクリプト
MAINTENANCE_SCRIPTS=(
    "debug-slack-mcp.js"
    "final-slack-test.js"
    "find-correct-user-id.js"
    "get-okamoto-slack-id.js"
    "investigate-channels.js"
    "check-slack-permissions-detailed.js"
    "urgent-permission-check.js"
    "detailed-handover-generator.js"
    "auto-handover.js"
)

for script in "${MAINTENANCE_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "scripts/maintenance/$script"
        echo "✅ $script をメンテナンススクリプトへ移動"
    fi
done

echo ""
echo "📝 コミットスクリプトを移動中..."

# 現行コミットスクリプト
if [ -f "commit-phase5-complete.sh" ]; then
    mv "commit-phase5-complete.sh" "scripts/commit/phase5-complete.sh"
    echo "✅ Phase 5コミットスクリプト移動"
fi

# 古いコミットスクリプト
OLD_COMMIT_SCRIPTS=(
    "commit-phase1-completion.sh"
    "commit-phase2a-title-fix.sh"
    "commit-strategy-b-100-percent-complete.sh"
    "commit-strategy-b.sh"
)

for script in "${OLD_COMMIT_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "scripts/commit/legacy/$script"
        echo "✅ $script を古いコミットスクリプトへ移動"
    fi
done

echo ""
echo "🚀 デプロイメントスクリプトを移動中..."

if [ -f "quick-restart.sh" ]; then
    mv "quick-restart.sh" "scripts/deployment/quick-restart.sh"
    echo "✅ クイック再起動スクリプト移動"
fi

if [ -f "run-100-percent-test.sh" ]; then
    mv "run-100-percent-test.sh" "scripts/deployment/run-tests.sh"
    echo "✅ テスト実行スクリプト移動"
fi

if [ -f "phase1-complete-test-after-approval.sh" ]; then
    mkdir -p "scripts/deployment/legacy"
    mv "phase1-complete-test-after-approval.sh" "scripts/deployment/legacy/phase1-test.sh"
    echo "✅ Phase 1テストスクリプトをレガシーへ移動"
fi

echo ""
echo "⚙️ 設定ファイルを移動中..."

if [ -f "claude_desktop_config.json" ]; then
    mv "claude_desktop_config.json" "config/claude_desktop_config.json"
    echo "✅ Claude設定ファイル移動"
fi

if [ -f ".env.mcp-integration" ]; then
    mv ".env.mcp-integration" "config/examples/env.mcp-integration.example"
    echo "✅ MCP統合環境変数例移動"
fi

echo ""
echo "✅ スクリプト・テストファイル移動完了！"
echo ""
echo "📁 新しいスクリプト・テスト構造:"
echo "tests/"
echo "├── phase-tests/ (1ファイル)"
echo "├── integration/ (2ファイル)"
echo "└── archive/tests/ (10ファイル)"
echo ""
echo "scripts/"
echo "├── commit/"
echo "│   ├── phase5-complete.sh"
echo "│   └── legacy/ (4ファイル)"
echo "├── deployment/ (2ファイル + legacy/)"
echo "└── maintenance/ (9ファイル)"
echo ""
echo "config/"
echo "├── claude_desktop_config.json"
echo "└── examples/ (1ファイル)"
echo ""
echo "🔄 次のステップ: 最終確認とREADME更新"

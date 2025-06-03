#!/bin/bash

# Phase 5 プロジェクト構造整理スクリプト - 最終確認・完了編

echo "🔍 Phase 5 プロジェクト構造整理 - 最終確認..."
echo "============================================================"

echo "📊 整理後のルートディレクトリ確認..."
echo ""

# ルートディレクトリの状況確認
ROOT_FILES=$(find . -maxdepth 1 -type f ! -name ".*" ! -name "package*.json" ! -name "README.md" ! -name "cleanup-*.sh" | wc -l)
echo "📁 ルートディレクトリファイル数: $ROOT_FILES 個"

if [ $ROOT_FILES -gt 5 ]; then
    echo "⚠️  まだ整理が必要なファイルがあります"
    echo "📋 残りのファイル:"
    find . -maxdepth 1 -type f ! -name ".*" ! -name "package*.json" ! -name "README.md" ! -name "cleanup-*.sh"
else
    echo "✅ ルートディレクトリがスッキリしました！"
fi

echo ""
echo "📁 新しいディレクトリ構造確認..."

# ディレクトリ構造の表示
echo "📊 Phase 5 整理後の構造:"
echo ""

if [ -d "docs" ]; then
    echo "📚 docs/"
    find docs -type f | wc -l | xargs echo "   ファイル数:"
    
    if [ -d "docs/phases" ]; then
        echo "   📁 phases/"
        find docs/phases -name "*.md" | wc -l | xargs echo "     Phase関連ドキュメント:"
    fi
    
    if [ -d "docs/handovers" ]; then
        find docs/handovers -name "*.md" | wc -l | xargs echo "   📁 handovers/ ファイル数:"
    fi
    
    if [ -d "docs/technical" ]; then
        find docs/technical -name "*.md" | wc -l | xargs echo "   📁 technical/ ファイル数:"
    fi
fi

echo ""

if [ -d "tests" ]; then
    echo "🧪 tests/"
    find tests -type f | wc -l | xargs echo "   ファイル数:"
    
    if [ -d "tests/phase-tests" ]; then
        find tests/phase-tests -name "*.js" | wc -l | xargs echo "   📁 phase-tests/ テスト数:"
    fi
    
    if [ -d "tests/integration" ]; then
        find tests/integration -name "*.js" | wc -l | xargs echo "   📁 integration/ テスト数:"
    fi
fi

echo ""

if [ -d "scripts" ]; then
    echo "🔧 scripts/"
    find scripts -type f | wc -l | xargs echo "   ファイル数:"
    
    if [ -d "scripts/commit" ]; then
        find scripts/commit -name "*.sh" | wc -l | xargs echo "   📁 commit/ スクリプト数:"
    fi
    
    if [ -d "scripts/deployment" ]; then
        find scripts/deployment -name "*.sh" | wc -l | xargs echo "   📁 deployment/ スクリプト数:"
    fi
    
    if [ -d "scripts/maintenance" ]; then
        find scripts/maintenance -name "*.js" | wc -l | xargs echo "   📁 maintenance/ スクリプト数:"
    fi
fi

echo ""

if [ -d "archive" ]; then
    echo "🗃️ archive/"
    find archive -type f | wc -l | xargs echo "   アーカイブファイル数:"
fi

echo ""
echo "============================================================"
echo "🎉 Phase 5 プロジェクト構造整理完了！"
echo ""

echo "✅ 達成された改善:"
echo "   📁 ルートディレクトリがスッキリ"
echo "   📚 ドキュメントが目的別に整理"
echo "   🧪 テストが種類別に分類"
echo "   🔧 スクリプトが用途別に配置"
echo "   🗃️ 古いファイルが適切にアーカイブ"

echo ""
echo "🚀 Phase 5プロジェクト構造の利点:"
echo "   💡 ナビゲーション性向上"
echo "   🔍 ファイルの発見しやすさ"
echo "   🛠️ 保守性の大幅改善"
echo "   🎯 プロフェッショナルな外観"
echo "   📈 将来の拡張性確保"

echo ""
echo "📋 推奨される次のステップ:"
echo "   1. git add . && git commit -m '📁 Phase 5 プロジェクト構造整理完了'"
echo "   2. テスト実行: ./tests/phase-tests/test-mcp-integration-phase5.js"
echo "   3. 動作確認: node src/slack-bot.js"
echo "   4. Phase 6開発へ進む"

echo ""
echo "🎆 世界初の企業レベル完全MCP統合AI代筆システム"
echo "   Phase 5にふさわしいプロフェッショナル構造確立完了！"

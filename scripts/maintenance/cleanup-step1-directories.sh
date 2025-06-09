#!/bin/bash

# Phase 5 プロジェクト構造整理スクリプト - ディレクトリ作成編

echo "📁 Phase 5 プロジェクト構造整理開始..."
echo "============================================================"

echo "🏗️ ディレクトリ構造作成中..."

# Phase別ドキュメント
mkdir -p docs/phases/phase4
mkdir -p docs/phases/phase5
echo "✅ docs/phases/ 作成完了"

# その他ドキュメント
mkdir -p docs/handovers
mkdir -p docs/technical  
mkdir -p docs/user-guides
echo "✅ docs/ サブディレクトリ作成完了"

# テスト構造
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/phase-tests
echo "✅ tests/ 構造作成完了"

# スクリプト構造
mkdir -p scripts/commit/legacy
mkdir -p scripts/deployment
mkdir -p scripts/maintenance
echo "✅ scripts/ 構造作成完了"

# 設定
mkdir -p config/examples
echo "✅ config/ 構造作成完了"

# アーカイブ
mkdir -p archive/docs
mkdir -p archive/tests
echo "✅ archive/ 構造作成完了"

echo ""
echo "🎯 作成されたディレクトリ構造:"
echo "docs/"
echo "├── phases/"
echo "│   ├── phase4/"
echo "│   └── phase5/"
echo "├── handovers/"
echo "├── technical/"
echo "└── user-guides/"
echo ""
echo "tests/"
echo "├── unit/"
echo "├── integration/"
echo "└── phase-tests/"
echo ""
echo "scripts/"
echo "├── commit/"
echo "│   └── legacy/"
echo "├── deployment/"
echo "└── maintenance/"
echo ""
echo "config/"
echo "└── examples/"
echo ""
echo "archive/"
echo "├── docs/"
echo "└── tests/"

echo ""
echo "✅ Phase 5 ディレクトリ構造作成完了！"
echo "🔄 次のステップ: ファイル移動スクリプトを実行してください"

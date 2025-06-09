#!/bin/bash

# GhostWriter プロジェクトのGit初期化スクリプト
echo "=== GhostWriter Git初期化スクリプト ==="
echo

# 現在のディレクトリ確認
echo "現在のディレクトリ: $(pwd)"
echo

# Git初期化
echo "1. Gitリポジトリ初期化中..."
git init
echo "✅ Git初期化完了"
echo

# ファイル追加
echo "2. ファイルをステージング中..."
git add .
echo "✅ ファイルステージング完了"
echo

# 初回コミット
echo "3. 初回コミット実行中..."
git commit -m "🎉 Initial commit: プロジェクト基盤とドキュメント整備

- 要件定義・技術仕様書をdocs/に整理
- Git管理用の基本ファイル作成(.gitignore, README.md, package.json)  
- 開発用ディレクトリ構造準備(src/, tests/, config/)
- Phase 1 (MCP Server) 実装準備完了"
echo "✅ 初回コミット完了"
echo

# メインブランチ設定
echo "4. メインブランチをmainに設定中..."
git branch -M main
echo "✅ メインブランチ設定完了"
echo

# 状態確認
echo "=== Git状態確認 ==="
echo "現在のブランチ:"
git branch
echo

echo "コミット履歴:"
git log --oneline
echo

echo "ファイル状態:"
git status
echo

echo "🎉 Git初期化が正常に完了しました！"
echo
echo "次のステップ:"
echo "1. リモートリポジトリを設定する場合:"
echo "   git remote add origin <repository-url>"
echo "   git push -u origin main"
echo
echo "2. 開発を開始する場合:"
echo "   npm install  # 依存関係インストール"
echo "   # Phase 1 実装開始"

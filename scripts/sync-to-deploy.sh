#!/bin/bash
# 実行権限付与: chmod +x scripts/sync-to-deploy.sh
# GhostWriter 組織リポジトリ → 個人フォークリポジトリ同期スクリプト

echo "🔄 組織リポジトリから個人デプロイリポジトリに同期開始..."

# デプロイ用ディレクトリに移動
DEPLOY_DIR="/Users/takuya/Documents/AI-Work/GhostWriter-Deploy"

if [ ! -d "$DEPLOY_DIR" ]; then
    echo "❌ デプロイディレクトリが見つかりません: $DEPLOY_DIR"
    echo "先にフォークリポジトリをクローンしてください"
    exit 1
fi

cd "$DEPLOY_DIR"

echo "📦 上流リポジトリから最新版を取得..."
git fetch upstream

echo "🔄 メインブランチに最新変更をマージ..."
git checkout main
git merge upstream/main

echo "🚀 個人リポジトリにプッシュ（Render自動デプロイトリガー）..."
git push origin main

echo "✅ 同期完了！Renderで自動デプロイが開始されます"
echo "🌐 デプロイ状況: https://dashboard.render.com/"

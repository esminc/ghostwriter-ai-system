# 📚 GhostWriter ドキュメント

GhostWriterプロジェクトの包括的ドキュメントディレクトリです。

## 📋 **ディレクトリ構成**

### 📊 **reports/** - 分析・レポート類
- `code-reviews/` - コードレビューレポート
- `project-analysis/` - プロジェクト分析結果
- `performance/` - パフォーマンス分析

### 📝 **planning/** - 計画・設計ドキュメント
- `phase-plans/` - フェーズ別実装計画
- `architecture/` - システムアーキテクチャ設計
- `PROJECT_ROOT_CLEANUP_PLAN_2025-06-18.md` - プロジェクト整理計画

### 🔧 **development/** - 開発関連ドキュメント
- `setup-guides/` - セットアップガイド
- `testing/` - テスト関連ドキュメント
- `deployment/` - デプロイメントガイド
- `git-commit-procedure.md` - Git操作手順

### 📋 **handovers/** - 引継ぎドキュメント
- `2025-06/` - 2025年6月の引継ぎ記録
- `HANDOVER_PROMPT.md` - 引継ぎ用プロンプト

### 📈 **project-info/** - プロジェクト情報
- Phase別プロジェクト情報とステータス

### ⚙️ **commit-messages/** - Git関連
- コミットメッセージテンプレート

### 💬 **chat-history/** - 開発履歴
- 開発プロセスの会話ログ

### 🔗 **その他**
- `technical/` - 技術調査結果
- `phases/` - フェーズ別ドキュメント
- `next-prompts/` - 継続開発用プロンプト

## 🔍 **主要ドキュメント**

### **最新計画・レポート**
- [`planning/phase-plans/PHASE7_IMPLEMENTATION_PLAN_2025-06-18.md`](planning/phase-plans/PHASE7_IMPLEMENTATION_PLAN_2025-06-18.md) - Phase 7実装計画
- [`reports/code-reviews/CODE_REVIEW_REPORT_2025-06-18.md`](reports/code-reviews/CODE_REVIEW_REPORT_2025-06-18.md) - 包括的コードレビュー
- [`planning/architecture/AI_CENTRIC_ARCHITECTURE_MIGRATION_PLAN_PHASE7_PLUS.md`](planning/architecture/AI_CENTRIC_ARCHITECTURE_MIGRATION_PLAN_PHASE7_PLUS.md) - AI中心アーキテクチャ移行計画

### **開発・運用ガイド**
- [`development/git-commit-procedure.md`](development/git-commit-procedure.md) - Git操作手順
- [`development/setup-guides/MCP_INTEGRATION_SETUP_GUIDE.md`](development/setup-guides/MCP_INTEGRATION_SETUP_GUIDE.md) - MCP統合セットアップ
- [`development/testing/TESTING_CHECKLIST.md`](development/testing/TESTING_CHECKLIST.md) - テストチェックリスト

### **アーキテクチャ仕様**
- [`planning/architecture/SYSTEM_SPECIFICATIONS.md`](planning/architecture/SYSTEM_SPECIFICATIONS.md) - システム仕様
- [`planning/architecture/STRATEGY_B_IMPROVED_TECHNICAL_SPECS.md`](planning/architecture/STRATEGY_B_IMPROVED_TECHNICAL_SPECS.md) - 技術仕様

## 📝 **ドキュメント作成ガイドライン**

### **新しいドキュメントの配置**

1. **分析・レポート** → `reports/` 配下の適切なサブディレクトリ
2. **計画・設計** → `planning/` 配下の適切なサブディレクトリ  
3. **開発ガイド** → `development/` 配下の適切なサブディレクトリ
4. **引継ぎ** → `handovers/` 配下（日付別ディレクトリ推奨）

### **命名規則**

- **日付付きファイル**: `DOCUMENT_NAME_YYYY-MM-DD.md`
- **バージョン付き**: `DOCUMENT_NAME_v1.0.md`
- **フェーズ別**: `PHASE{N}_DOCUMENT_NAME.md`

## 🔄 **メンテナンス**

- 古いドキュメントは適宜アーカイブディレクトリに移動
- 定期的なディレクトリ構造の見直し
- リンク切れのチェックと修正

---

**最終更新**: 2025年6月18日  
**管理者**: GhostWriter開発チーム
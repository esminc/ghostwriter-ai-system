# GhostWriter Documentation

## 📋 ドキュメント一覧

### 要件定義・仕様書
- **[要件定義_最終版.md](./要件定義_最終版.md)** - プロジェクトの最終的な要件定義書
- **[要件定義.md](./要件定義.md)** - 初期の要件定義書
- **[UI_UX要件追加.md](./UI_UX要件追加.md)** - UI/UX関連の追加要件検討

### 技術仕様・実装ガイド
- **[SQLite実装ガイド.md](./SQLite実装ガイド.md)** - SQLiteを使った基盤実装の詳細ガイド
- **[Googleカレンダー連携技術詳細.md](./Googleカレンダー連携技術詳細.md)** - Google Calendar API連携の技術詳細
- **[自動情報収集要件.md](./自動情報収集要件.md)** - おまかせモードでの自動情報収集仕様
- **[データベース配置検討.md](./データベース配置検討.md)** - データベース選択肢と配置戦略

## 🗂️ ドキュメント構成

```
docs/
├── README.md                           # このファイル
├── 要件定義_最終版.md                   # 📋 メイン要件定義
├── 要件定義.md                         # 📋 初期要件定義
├── UI_UX要件追加.md                    # 🎨 UI/UX仕様
├── SQLite実装ガイド.md                 # 🔧 実装ガイド
├── Googleカレンダー連携技術詳細.md      # 📅 Calendar API
├── 自動情報収集要件.md                 # 🤖 自動収集機能
└── データベース配置検討.md             # 🗄️ DB設計
```

## 📝 ドキュメント更新履歴

| 日付 | 更新内容 | 更新者 |
|------|----------|--------|
| 2025-05-25 | ドキュメント整理、docsフォルダに移動 | システム |
| - | 各種要件定義・技術仕様書作成 | - |

## 🚀 プロジェクト概要

**代筆さん (Ghostwriter for esa Diary)** は、ESM ITSチームメンバーの日記投稿負担を軽減し、継続的な日記文化を維持するためのSlack Botです。

### 主要機能
- 個人の文体・スタイルを学習した日記自動生成
- Slack Botによる直感的な操作
- Googleカレンダー・Slack履歴からの自動情報収集
- esa記事への自動投稿

### 開発フェーズ
- **Phase 1**: Claude Desktop + MCP Server（技術検証）
- **Phase 2**: Slack Bot（チーム展開）

## 📖 読み順ガイド

### 初めて読む場合
1. [要件定義_最終版.md](./要件定義_最終版.md) - プロジェクト全体像
2. [SQLite実装ガイド.md](./SQLite実装ガイド.md) - 基盤実装方法
3. [自動情報収集要件.md](./自動情報収集要件.md) - 主要機能仕様

### 技術実装する場合
1. [SQLite実装ガイド.md](./SQLite実装ガイド.md) - データベース設計
2. [Googleカレンダー連携技術詳細.md](./Googleカレンダー連携技術詳細.md) - API連携
3. [データベース配置検討.md](./データベース配置検討.md) - 本格運用時の選択肢

---

## 🔄 次のステップ

この文書群を基に、実際の実装フェーズに移行する準備が整いました。

1. **Git初期化** - プロジェクトルートでGitリポジトリ作成
2. **Phase 1実装** - SQLiteベースのMCPサーバー開発
3. **Phase 2準備** - Slack Bot開発環境構築

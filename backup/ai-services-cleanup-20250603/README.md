# ai・services ディレクトリ整理 - バックアップ記録

## バックアップ日時
2025年6月3日

## バックアップ内容

### ai ディレクトリ (2ファイル)
- openai-client.js (現在使用中・改良版)
- openai-client-original.js (オリジナル版・アーカイブ対象)

### services ディレクトリ (9ファイル)
使用中:
- mcp-profile-analyzer.js
- ai-diary-generator.js
- esa-api.js
- migration-manager.js

アーカイブ対象:
- auto-user-mapper.js (migration-managerに統合済み)
- user-mapping-manager.js (migration-managerに統合済み)
- diary-generator.js (ai-diary-generatorに統合済み)
- profile-analyzer.js (mcp-profile-analyzerに統合済み)

## 整理計画
- ai: 2 → 1 (50%削減)
- services: 9 → 4 (56%削減)
- 合計: 11 → 5 (55%削減)

## 実行予定
Phase 5.3完全統一版と同様の段階的整理を実行
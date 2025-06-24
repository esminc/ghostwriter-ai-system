# Phase 6 Slackユーザー情報マッピング調査レポート

## 概要
Phase 6でSlackユーザー情報（email、日本語表示名）を取得してesaユーザーとマッチングする処理の調査結果をまとめます。

## 1. Slackユーザー情報取得フロー

### 1.1 エントリーポイント (`src/slack/app.js`)

```javascript
// Line 227-230
const userInfo = await client.users.info({ user: userId });
const realName = userInfo.user.real_name;
const rawDisplayName = userInfo.user.display_name;
const email = userInfo.user.profile?.email;
```

**取得される情報:**
- `user.id`: Slack ユーザーID
- `user.name`: Slackユーザー名（英数字）
- `user.real_name`: 実名（日本語可）
- `user.display_name`: 表示名（日本語可）
- `user.profile.email`: メールアドレス（**要権限: `users:read.email`**）

### 1.2 MCP経由でのユーザー情報取得 (`src/mcp-integration/slack-mcp-wrapper-direct.js`)

```javascript
// Line 67-72
const userProfileResult = await slackMCPClient.callTool({
    name: "slack_get_user_profile",
    arguments: {
        user_id: slackUserId
    }
});
```

## 2. ユーザーマッピング処理 (`src/services/migration-manager.js`)

### 2.1 マッピング優先順位

1. **メールアドレスマッチング**（最優先）
   ```javascript
   // Line 286-324
   async mapByEmail(email, slackUserInfo) {
       const matchedMember = esaMembers.find(member => 
           member.email && member.email.toLowerCase() === email.toLowerCase()
       );
   }
   ```

2. **実名マッチング**（次優先）
   ```javascript
   // Line 329-385
   async mapByRealName(realName, slackUserInfo) {
       // 日本語名の正規化とマッチング
       const normalizedRealName = this.normalizeJapaneseName(realName);
   }
   ```

3. **ユーザー名マッチング**（最終手段）
   ```javascript
   // Line 390-466
   async mapByUsername(username, slackUserInfo) {
       // 順序逆転パターンも検出
       const reversedMatch = this.findReversedNameMatch(username, esaMembers);
   }
   ```

### 2.2 esaメンバー情報取得（MCP経由）

```javascript
// Line 469-581
async getEsaMembers() {
    const result = await esaConnection.callTool({
        name: 'esa_get_members',
        arguments: {
            page: page,
            per_page: 100
        }
    });
}
```

**取得されるesa情報:**
- `screen_name`: esaユーザー名
- `name`: 表示名（日本語）
- `email`: メールアドレス
- `icon`: アイコンURL
- `id`: esaユーザーID

## 3. 日本語名処理の特徴

### 3.1 日本語名の正規化 (`migration-manager.js`)

```javascript
// Line 586-594
normalizeJapaneseName(name) {
    return name
        .trim()
        .replace(/\s+/g, ' ')  // 複数スペースを単一スペースに
        .replace(/　/g, ' ')   // 全角スペースを半角に
        .toLowerCase();
}
```

### 3.2 部分一致ロジック

- 姓名を分割して部分一致を試行
- 2文字以上の部分文字列でマッチング
- 姓と名の順序逆転パターンにも対応

## 4. 必要なSlack API権限

### 4.1 必須権限

- `users:read`: ユーザー基本情報の読み取り
- `users:read.email`: **メールアドレスの読み取り（重要）**

### 4.2 権限確認方法

```bash
# 権限テストスクリプト
node tools/test/test-slack-permissions.js
```

## 5. マッピング成功率向上のポイント

### 5.1 メールアドレスベースマッピング

- **最も確実な方法**（信頼度: 1.0）
- SlackとesaでSSOを使用している場合は特に有効
- `users:read.email`権限が必須

### 5.2 日本語名マッピング

- **実名（real_name）**を優先使用（信頼度: 0.8）
- 表示名（display_name）はフォールバック
- 正規化処理により表記揺れに対応

### 5.3 フォールバック戦略

```javascript
// src/slack/app.js Line 232-233
const displayName = rawDisplayName || realName || userName || 'Unknown User';
```

## 6. トラブルシューティング

### 6.1 メールアドレスが取得できない場合

1. Slack App設定で`users:read.email`権限を追加
2. ワークスペースにアプリを再インストール
3. 新しいBot Tokenを環境変数に設定

### 6.2 日本語名がマッチしない場合

1. Slackの表示名設定を確認
2. esaのプロフィール名を確認
3. 手動マッピング設定を`config/user-mappings.json`に追加

### 6.3 デバッグ方法

```bash
# 自動マッピングテスト
node tools/test/test-comprehensive-auto-mapping.js

# Slackボット経由のマッピングテスト
node tools/test/test-slack-bot-auto-mapping.js
```

## 7. Phase 6の実装状態

- ✅ Slack `users.info` APIでユーザー情報取得
- ✅ メールアドレスによる自動マッピング
- ✅ 日本語実名による自動マッピング
- ✅ ユーザー名の順序逆転パターン対応
- ✅ MCP経由でのesa members API統合
- ✅ 段階的移行マネージャーによる柔軟な設定

## 8. 推奨事項

1. **`users:read.email`権限を必ず有効化**
   - メールアドレスマッチングが最も確実

2. **Slackプロフィールの整備**
   - 実名（日本語）を正しく設定
   - 表示名も日本語で統一

3. **定期的なキャッシュクリア**
   - esaメンバー情報は30分キャッシュ
   - 新規ユーザー追加時は注意

4. **ログ監視**
   - `logs/mapping-migration.log`でマッピング結果を確認
   - 失敗パターンを分析して改善
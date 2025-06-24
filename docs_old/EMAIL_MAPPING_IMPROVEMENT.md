## Email権限追加後の期待結果

### Before（現在）
```
🔄 自動ユーザーマッピング開始: {
  slackId: 'U040L7EJC0Z',
  userName: 'takuya.okamoto',
  email: undefined,           ← 取得不可
  realName: 'okamoto.takuya'
}

❌ 実名マッピング失敗: okamoto.takuya
🔤 ユーザー名でマッピング: takuya.okamoto
✅ 順序逆転マッチング成功: confidence: 0.9
```

### After（Email権限追加後）
```
🔄 自動ユーザーマッピング開始: {
  slackId: 'U040L7EJC0Z',
  userName: 'takuya.okamoto',
  email: 'takuya.okamoto@esm.co.jp',  ← 取得成功
  realName: 'okamoto.takuya'
}

📧 Emailでマッピング: takuya.okamoto@esm.co.jp
✅ Email完全マッチング成功: confidence: 1.0    ← 最高信頼度
```

### 処理フロー改善
1. Email matching ✅ (最優先・最高精度)
2. Real name matching (スキップ)
3. Username matching (スキップ)
4. Pattern matching (スキップ)

### 新ユーザー対応力向上
- y-sakai@esm.co.jp → y-sakai (確実)
- any.user@esm.co.jp → any-user (確実)
- 手動設定完全不要

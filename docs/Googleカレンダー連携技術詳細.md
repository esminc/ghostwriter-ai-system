# Googleカレンダー連携 技術詳細

## 1. 認証フロー（OAuth 2.0）

### 1.1 全体の流れ
```
[ユーザー] → [代筆さんBot] → [Google OAuth] → [Calendar API] → [データ取得]
```

### 1.2 詳細ステップ

#### Step 1: Google Cloud Consoleでの準備
```javascript
// Google Cloud Console で設定が必要
1. プロジェクト作成
2. Calendar API を有効化
3. OAuth 2.0 認証情報作成
   - Client ID
   - Client Secret
   - Redirect URI設定

// 必要なスコープ
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly'
];
```

#### Step 2: 初回認証（ユーザーがSlack Botを初回利用時）
```javascript
// Slack Botでの認証開始
@代筆さん カレンダー連携お願いします

// Bot応答
🤖「Googleカレンダーと連携します」
🤖「以下のURLで認証してください（30分間有効）」
🤖「https://accounts.google.com/oauth/authorize?client_id=...&scope=calendar.readonly&redirect_uri=...」

// ユーザーがブラウザで認証
1. Googleアカウントでログイン
2. カレンダー読み取り権限の承認
3. 認証コード発行
4. Redirect URIに認証コード送信
```

#### Step 3: アクセストークン取得
```javascript
// サーバーサイドで認証コード → アクセストークン交換
const { google } = require('googleapis');

async function exchangeCodeForTokens(authCode) {
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
  
  // 認証コードをアクセストークンに交換
  const { tokens } = await oauth2Client.getToken(authCode);
  
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date
  };
}
```

#### Step 4: ユーザー識別とトークン保存
```javascript
// ユーザー情報取得（どのGoogleアカウントか特定）
async function getUserInfo(accessToken) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  
  return {
    googleId: data.id,
    email: data.email,
    name: data.name
  };
}

// データベースに保存
async function saveUserTokens(slackUserId, googleUserInfo, tokens) {
  await db.users.upsert({
    slack_user_id: slackUserId,
    google_user_id: googleUserInfo.googleId,
    google_email: googleUserInfo.email,
    access_token: encrypt(tokens.access_token),
    refresh_token: encrypt(tokens.refresh_token),
    token_expiry: tokens.expiry_date,
    created_at: new Date()
  });
}
```

## 2. カレンダーデータ取得

### 2.1 認証済みユーザーのデータ取得
```javascript
async function getCalendarEvents(slackUserId, targetDate) {
  try {
    // 1. データベースからトークン取得
    const userTokens = await db.users.findOne({ 
      slack_user_id: slackUserId 
    });
    
    if (!userTokens) {
      throw new Error('カレンダー連携が必要です');
    }
    
    // 2. OAuth クライアント設定
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );
    
    oauth2Client.setCredentials({
      access_token: decrypt(userTokens.access_token),
      refresh_token: decrypt(userTokens.refresh_token)
    });
    
    // 3. Calendar API クライアント作成
    const calendar = google.calendar({ 
      version: 'v3', 
      auth: oauth2Client 
    });
    
    // 4. 指定日のイベント取得
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const response = await calendar.events.list({
      calendarId: 'primary', // メインカレンダー
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50
    });
    
    return response.data.items || [];
    
  } catch (error) {
    if (error.code === 401) {
      // トークン期限切れ → リフレッシュ
      await refreshAccessToken(slackUserId);
      return getCalendarEvents(slackUserId, targetDate);
    }
    throw error;
  }
}
```

### 2.2 トークンリフレッシュ
```javascript
async function refreshAccessToken(slackUserId) {
  const userTokens = await db.users.findOne({ 
    slack_user_id: slackUserId 
  });
  
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
  
  oauth2Client.setCredentials({
    refresh_token: decrypt(userTokens.refresh_token)
  });
  
  // リフレッシュ実行
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  // 新しいトークンを保存
  await db.users.update(
    { slack_user_id: slackUserId },
    {
      access_token: encrypt(credentials.access_token),
      token_expiry: credentials.expiry_date,
      updated_at: new Date()
    }
  );
}
```

## 3. データ分析・活用

### 3.1 イベント分析
```javascript
function analyzeCalendarEvents(events) {
  const analysis = {
    totalEvents: events.length,
    meetings: [],
    busyLevel: 'low',
    freeTimeSlots: [],
    eventTypes: {
      oneOnOne: 0,
      teamMeeting: 0,
      customerMeeting: 0,
      other: 0
    }
  };
  
  events.forEach(event => {
    const meeting = {
      title: event.summary,
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
      attendees: event.attendees ? event.attendees.length : 1,
      type: categorizeMeeting(event)
    };
    
    analysis.meetings.push(meeting);
    analysis.eventTypes[meeting.type]++;
  });
  
  // 忙しさレベル計算
  const totalHours = analysis.meetings.reduce((sum, meeting) => {
    return sum + (meeting.end - meeting.start) / (1000 * 60 * 60);
  }, 0);
  
  if (totalHours > 6) analysis.busyLevel = 'high';
  else if (totalHours > 3) analysis.busyLevel = 'medium';
  
  return analysis;
}

function categorizeMeeting(event) {
  const title = event.summary.toLowerCase();
  const attendeeCount = event.attendees ? event.attendees.length : 1;
  
  if (attendeeCount === 2 && title.includes('1on1')) {
    return 'oneOnOne';
  } else if (title.includes('全社') || title.includes('全体')) {
    return 'teamMeeting';
  } else if (title.includes('お客') || title.includes('customer')) {
    return 'customerMeeting';
  }
  return 'other';
}
```

### 3.2 日記生成への活用
```javascript
function generateCalendarBasedActions(analysis) {
  const actions = [];
  
  analysis.meetings.forEach(meeting => {
    let action = '';
    
    switch (meeting.type) {
      case 'oneOnOne':
        action = `${meeting.title}で${meeting.attendees}さんと振り返り`;
        break;
      case 'teamMeeting':
        action = `${meeting.title}（${Math.round((meeting.end - meeting.start) / (1000 * 60))}分の長丁場）`;
        break;
      case 'customerMeeting':
        action = `お客様との${meeting.title}で要件確認`;
        break;
      default:
        action = meeting.title;
    }
    
    actions.push(`・${action}`);
  });
  
  // 忙しさに応じた追加アクション
  if (analysis.busyLevel === 'high') {
    actions.push('・会議の合間に急ぎのタスクを処理');
  } else if (analysis.busyLevel === 'low') {
    actions.push('・集中してコーディング作業');
  }
  
  return actions;
}
```

## 4. セキュリティ・プライバシー対策

### 4.1 データ暗号化・保護
```javascript
const crypto = require('crypto');

// 暗号化
function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// 復号化
function decrypt(encryptedText) {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 4.2 権限管理
```javascript
// ユーザーの権限確認
async function checkCalendarPermission(slackUserId) {
  const user = await db.users.findOne({ slack_user_id: slackUserId });
  
  if (!user || !user.access_token) {
    return { hasPermission: false, needsAuth: true };
  }
  
  if (user.token_expiry < new Date()) {
    try {
      await refreshAccessToken(slackUserId);
      return { hasPermission: true, needsAuth: false };
    } catch (error) {
      return { hasPermission: false, needsAuth: true };
    }
  }
  
  return { hasPermission: true, needsAuth: false };
}
```

### 4.3 データ削除・プライバシー制御
```javascript
// ユーザーによるデータ削除
async function revokeCalendarAccess(slackUserId) {
  const user = await db.users.findOne({ slack_user_id: slackUserId });
  
  if (user && user.access_token) {
    try {
      // Google側でのトークン無効化
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: decrypt(user.access_token)
      });
      
      await oauth2Client.revokeCredentials();
    } catch (error) {
      console.error('Token revocation failed:', error);
    }
  }
  
  // ローカルデータ削除
  await db.users.update(
    { slack_user_id: slackUserId },
    {
      access_token: null,
      refresh_token: null,
      google_user_id: null,
      google_email: null,
      token_expiry: null
    }
  );
}
```

## 5. エラーハンドリング

### 5.1 よくあるエラーと対処
```javascript
async function handleCalendarApiError(error, slackUserId) {
  switch (error.code) {
    case 401: // Unauthorized
      return {
        message: 'カレンダーの認証が必要です。再度認証してください。',
        action: 'reauth_required'
      };
      
    case 403: // Forbidden
      if (error.message.includes('Rate Limit')) {
        return {
          message: 'アクセス制限中です。しばらく待ってから再試行してください。',
          action: 'rate_limit'
        };
      }
      break;
      
    case 404: // Not Found
      return {
        message: 'カレンダーが見つかりません。',
        action: 'calendar_not_found'
      };
      
    default:
      return {
        message: 'カレンダー情報の取得に失敗しました。',
        action: 'generic_error'
      };
  }
}
```

## 6. 実装時の注意点

### 6.1 レート制限対策
- Google Calendar API: 1秒あたり100リクエスト
- 同時実行制御とキューイング実装
- キャッシュ戦略で API 呼び出し最小化

### 6.2 ユーザー体験
- 認証フローの簡素化
- エラー時の分かりやすいメッセージ
- 段階的な権限付与（最小権限の原則）

### 6.3 運用監視
- API使用量の監視
- エラー率の追跡  
- ユーザー認証状態の管理
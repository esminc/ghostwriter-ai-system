// シンプルなChallenge Response サーバー
const express = require('express');
const app = express();

app.use(express.json());

// Challenge Response専用エンドポイント
app.post('/slack/events', (req, res) => {
    console.log('📩 Received request at /slack/events:', req.body);
    
    // URL Verification Challenge
    if (req.body && req.body.type === 'url_verification') {
        console.log('🔄 Challenge received:', req.body.challenge);
        return res.status(200).send(req.body.challenge);
    }
    
    // その他のイベント（今は無視）
    res.status(200).send('OK');
});

// Root endpoint (Slackがここにリクエストを送っている)
app.post('/', (req, res) => {
    console.log('📩 Received request at root:', req.body);
    
    // URL Verification Challenge
    if (req.body && req.body.type === 'url_verification') {
        console.log('🔄 Challenge received at root:', req.body.challenge);
        return res.status(200).send(req.body.challenge);
    }
    
    // その他のイベント（今は無視）
    res.status(200).send('OK');
});

// Health check
app.get('/', (req, res) => {
    res.status(200).send('GhostWriter Challenge Server is running!');
});

app.listen(3001, () => {
    console.log('🌐 Challenge Response server running on port 3001');
    console.log('📡 Endpoints available:');
    console.log('   - POST / (root)');
    console.log('   - POST /slack/events');
    console.log('   - GET / (health check)');
});

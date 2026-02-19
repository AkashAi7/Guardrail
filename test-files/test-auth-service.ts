// Test File 1: Authentication Service with Security Issues
// This file intentionally contains security vulnerabilities for testing

import express from 'express';
import crypto from 'crypto';

const app = express();

// ISSUE 1: Hardcoded API Keys (TEST FILE - NOT REAL KEYS)
const STRIPE_API_KEY = "sk_test_XXXXXXXXXXXXXXXXXXXXXX"; // Hardcoded secret - bad practice!
const OPENAI_API_KEY = "sk-proj-XXXXXXXXXXXXXXXXXXXXXX"; // Another hardcoded key
const JWT_SECRET = "my-super-secret-jwt-key-12345"; // Never hardcode secrets!

// ISSUE 2: Hardcoded Database Credentials
const DB_CONFIG = {
    host: 'localhost',
    user: 'admin',
    password: 'Admin123!@#',
    database: 'production_db'
};

// ISSUE 3: SQL Injection Vulnerability
app.get('/user/:id', async (req, res) => {
    const userId = req.params.id;
    
    // Vulnerable: String concatenation in SQL
    const query = "SELECT * FROM users WHERE id = '" + userId + "'";
    const result = await db.execute(query);
    
    res.json(result);
});

// ISSUE 4: Another SQL Injection
app.post('/search', async (req, res) => {
    const searchTerm = req.body.term;
    
    // Vulnerable: Template literal interpolation
    const query = `SELECT * FROM products WHERE name LIKE '%${searchTerm}%'`;
    const results = await db.query(query);
    
    res.json(results);
});

// ISSUE 5: XSS Vulnerability - Direct innerHTML Assignment
app.get('/profile/:username', (req, res) => {
    const username = req.params.username;
    const html = `
        <html>
            <body>
                <h1>Welcome ${username}</h1>
                <script>
                    // XSS: Injecting unescaped user input
                    document.getElementById('output').innerHTML = "${username}";
                </script>
            </body>
        </html>
    `;
    res.send(html);
});

// ISSUE 6: Weak Cryptography - MD5 Usage
function hashPassword(password: string): string {
    // Vulnerable: MD5 is cryptographically broken
    return crypto.createHash('md5').update(password).digest('hex');
}

// ISSUE 7: Weak Cryptography - SHA1 Usage
function generateToken(data: string): string {
    // Vulnerable: SHA1 is deprecated
    return crypto.createHash('sha1').update(data).digest('hex');
}

// ISSUE 8: eval() Usage - Code Injection
app.post('/calculate', (req, res) => {
    const expression = req.body.expression;
    
    // Extremely dangerous: evaluating user input
    const result = eval(expression);
    
    res.json({ result });
});

// ISSUE 9: Command Injection
app.get('/ping/:host', (req, res) => {
    const host = req.params.host;
    
    // Vulnerable: Shell command with user input
    const { exec } = require('child_process');
    exec(`ping -c 4 ${host}`, (error, stdout, stderr) => {
        res.send(stdout);
    });
});

// ISSUE 10: Path Traversal
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    
    // Vulnerable: No path validation
    const filePath = './uploads/' + filename;
    res.sendFile(filePath);
});

// ISSUE 11: Missing Authentication
app.delete('/admin/users/:id', (req, res) => {
    // No authentication or authorization check!
    const userId = req.params.id;
    deleteUser(userId);
    res.json({ success: true });
});

// ISSUE 12: Logging Sensitive Data
function loginUser(username: string, password: string) {
    // Vulnerable: Logging password
    console.log('Login attempt:', { username, password });
    
    // Vulnerable: Logging tokens
    const token = generateAuthToken(username);
    console.log('Generated token:', token);
    
    return token;
}

// ISSUE 13: No Input Validation
app.post('/register', async (req, res) => {
    const { email, username, age } = req.body;
    
    // No validation at all!
    const user = await createUser(email, username, age);
    res.json(user);
});

// ISSUE 14: Insecure Random Number Generation
function generateSessionId(): string {
    // Weak: Math.random() is not cryptographically secure
    return Math.random().toString(36).substring(2);
}

// ISSUE 15: Hardcoded AWS Credentials
const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export { app, DB_CONFIG };

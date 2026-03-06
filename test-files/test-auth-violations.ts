// Sample Authentication Service with GDPR Violations
// This file demonstrates code that violates GDPR compliance requirements

import express from 'express';
import { Request, Response } from 'express';

interface User {
    id: string;
    email: string;
    password: string; // ❌ Storing plaintext password
    ssn: string;
    creditCard: string;
    dateOfBirth: string;
}

// ❌ VIOLATION: Hardcoded database credentials
const DB_CONNECTION = {
    host: 'localhost',
    user: 'admin',
    password: 'SuperSecret123!', // Hardcoded password
    database: 'userDB'
};

const app = express();

// ❌ VIOLATION: SQL Injection vulnerability
app.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    // Direct string interpolation creates SQL injection risk
    const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
    
    const user = await executeQuery(query);
    
    if (user) {
        // ❌ VIOLATION: Excessive PII logging
        console.log('User logged in successfully:', {
            email: user.email,
            ssn: user.ssn,
            creditCard: user.creditCard,
            fullData: user
        });
        
        res.json({ success: true, user });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// ❌ VIOLATION: No authorization check before accessing sensitive data
app.get('/user/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    // Anyone can access any user's data - no authorization!
    const userData = await executeQuery(`SELECT * FROM users WHERE id = '${userId}'`);
    
    res.json(userData);
});

// ❌ VIOLATION: No encryption of personal data
app.post('/register', async (req: Request, res: Response) => {
    const { email, password, ssn, creditCard } = req.body;
    
    const newUser: User = {
        id: generateId(),
        email,
        password, // Storing password in plaintext
        ssn,
        creditCard, // No encryption for sensitive financial data
        dateOfBirth: req.body.dateOfBirth
    };
    
    // Insert without encryption
    await insertUser(newUser);
    
    res.json({ success: true, userId: newUser.id });
});

// ❌ VIOLATION: Session never expires
const sessions = new Map<string, User>();

app.post('/create-session', (req: Request, res: Response) => {
    const { userId } = req.body;
    const sessionToken = generateToken();
    
    // Session stored indefinitely with no expiration
    sessions.set(sessionToken, userId);
    
    res.json({ sessionToken });
});

// ❌ VIOLATION: No data minimization - collecting unnecessary data
app.post('/newsletter-signup', async (req: Request, res: Response) => {
    // Only need email for newsletter, but collecting excessive data
    const { email, fullName, address, phone, ssn, dateOfBirth, occupation } = req.body;
    
    await insertNewsletterSubscriber({
        email,
        fullName,
        address,
        phone,
        ssn, // Why collect SSN for newsletter?
        dateOfBirth,
        occupation
    });
    
    res.json({ success: true });
});

// ❌ VIOLATION: Soft delete doesn't comply with right to erasure
app.delete('/user/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    // Soft delete keeps data in database
    await executeQuery(`UPDATE users SET deleted = true WHERE id = '${userId}'`);
    
    res.json({ message: 'User deleted' });
});

// ❌ VIOLATION: No audit logging for data access
app.get('/admin/all-users', async (req: Request, res: Response) => {
    // No logging of who accessed this sensitive data
    const allUsers = await executeQuery('SELECT * FROM users');
    
    res.json(allUsers);
});

// ❌ VIOLATION: Backup files stored with personal data unencrypted
function createBackup() {
    const allData = getAllUsers();
    
    // Writing to file without encryption
    require('fs').writeFileSync('./backup.json', JSON.stringify(allData));
    
    console.log('Backup created');
}

// Helper functions (mocked)
async function executeQuery(query: string): Promise<any> {
    // Mock database query
    return {};
}

async function insertUser(user: User): Promise<void> {
    // Mock insert
}

async function insertNewsletterSubscriber(data: any): Promise<void> {
    // Mock insert
}

function generateId(): string {
    return Math.random().toString(36);
}

function generateToken(): string {
    return Math.random().toString(36);
}

function getAllUsers(): User[] {
    return [];
}

export default app;

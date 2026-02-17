// Demo File - Code Guardrail Extension
// This file has intentional security issues to demonstrate the guardrail system

// ❌ ISSUE 1: Hardcoded API Key
const API_KEY = "sk-proj-abc123def456ghi789";
const DATABASE_PASSWORD = "admin123";

// ❌ ISSUE 2: SQL Injection
function getUserData(userId: string) {
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  return database.execute(query);
}

// ❌ ISSUE 3: XSS Vulnerability
function displayMessage(userInput: string) {
  document.innerHTML = `<div>${userInput}</div>`;
}

// ❌ ISSUE 4: Missing Error Handling
async function fetchUserData() {
  const response = await fetch('/api/users');
  return response.json();
}

// ❌ ISSUE 5: PII Without Protection
const customerData = {
  email: "customer@example.com",
  ssn: "123-45-6789",
  creditCard: "4532-1234-5678-9012",
  address: "123 Main St"
};

// ✅ GOOD: Proper implementation
const SAFE_API_KEY = process.env.API_KEY;

function getSafeUserData(userId: string) {
  const query = 'SELECT * FROM users WHERE id = ?';
  return database.execute(query, [userId]);
}

async function fetchDataSafely() {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

import { Request, Response } from 'express';
import { db } from './database';

export const getUserVulnerable = async (req: Request, res: Response) => {
  const userId = req.query.id; // Input from user

  // VULNERABLE: Direct string concatenation
  // If a user sends: 1; DROP TABLE users;--
  const sql = `SELECT * FROM users WHERE id = '${userId}'`;

  try {
    const results = await db.query(sql);
    res.json(results);
  } catch (err) {
    res.status(500).send("Database error");
  }
};



const customerData = {
  email: "customer@example.com",
  ssn: "123-45-6789",
  creditCard: "4532-1234-5678-9012",
  address: "123 Main St"
};

/**
 * GUARDRAIL DEMO — Security & Compliance Showcase
 * 
 * Open this file with Code Guardrail active, then run:
 *   Ctrl+Shift+P → "Code Guardrail: Analyze Current File"
 * 
 * The AI scanner should flag every section below.
 */

// ============================================================
// 1. HARDCODED SECRETS (CWE-798)
// ============================================================
const API_KEY = "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx";
const DATABASE_PASSWORD = "SuperSecret!P@ssw0rd2026";
const AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const JWT_SECRET = "my-jwt-signing-secret-do-not-share";

// ============================================================
// 2. SQL INJECTION (CWE-89)
// ============================================================
function getUserProfile(req, res) {
    const userId = req.params.id;
    // Direct string concatenation — classic SQL injection
    const query = "SELECT * FROM users WHERE id = " + userId;
    db.query(query, (err, results) => {
        res.json(results);
    });

    // Template literal — still vulnerable
    const query2 = `DELETE FROM sessions WHERE user_id = '${req.body.userId}'`;
    db.query(query2);
}

// ============================================================
// 3. CROSS-SITE SCRIPTING / XSS (CWE-79)
// ============================================================
function renderComment(req, res) {
    const userComment = req.query.comment;
    // Reflected XSS — unsanitized input straight into HTML
    res.send("<div class='comment'>" + userComment + "</div>");

    // DOM-based XSS via innerHTML
    document.getElementById("output").innerHTML = userComment;
}

// ============================================================
// 4. COMMAND INJECTION (CWE-78)
// ============================================================
function pingHost(req, res) {
    const host = req.query.host;
    // User input flows directly into shell command
    const { exec } = require("child_process");
    exec("ping -c 4 " + host, (err, stdout) => {
        res.send(stdout);
    });
}

// ============================================================
// 5. DANGEROUS eval() (CWE-95)
// ============================================================
function runUserFormula(req, res) {
    const formula = req.body.expression;
    // Arbitrary code execution
    const result = eval(formula);
    res.json({ result });
}

// ============================================================
// 6. PATH TRAVERSAL (CWE-22)
// ============================================================
const fs = require("fs");
const path = require("path");

function downloadFile(req, res) {
    const filename = req.params.filename;
    // No sanitisation — attacker can request ../../etc/passwd
    const filePath = path.join("/uploads", filename);
    res.sendFile(filePath);
}

// ============================================================
// 7. INSECURE CRYPTO (CWE-327 / CWE-328)
// ============================================================
const crypto = require("crypto");

function hashPassword(password) {
    // MD5 is cryptographically broken
    return crypto.createHash("md5").update(password).digest("hex");
}

function encryptData(data, key) {
    // DES is obsolete — use AES-256-GCM instead
    const cipher = crypto.createCipheriv("des-ecb", key, null);
    return cipher.update(data, "utf8", "hex") + cipher.final("hex");
}

// ============================================================
// 8. PII / GDPR EXPOSURE (Personal Data Logging)
// ============================================================
function processRegistration(req, res) {
    const { email, ssn, creditCard, dateOfBirth } = req.body;
    // Logging PII — GDPR Article 5 violation
    console.log("New user:", email, "SSN:", ssn, "CC:", creditCard);

    // Storing credit card in plain text
    db.query(`INSERT INTO users (email, ssn, cc) VALUES ('${email}', '${ssn}', '${creditCard}')`);
    res.json({ status: "registered" });
}

// ============================================================
// 9. MISSING AUTH / BROKEN ACCESS CONTROL (CWE-862)
// ============================================================
function deleteUser(req, res) {
    // No authentication or authorisation check at all
    const userId = req.params.id;
    db.query("DELETE FROM users WHERE id = " + userId);
    res.json({ deleted: true });
}

// ============================================================
// 10. INSECURE DESERIALIZATION (CWE-502)
// ============================================================
function loadSession(req, res) {
    const sessionData = req.cookies.session;
    // Deserialising untrusted data
    const parsed = JSON.parse(Buffer.from(sessionData, "base64").toString());
    req.user = parsed;
}

// ============================================================
// 11. PROTOTYPE POLLUTION (CWE-1321)
// ============================================================
function mergeConfig(target, source) {
    for (const key in source) {
        // No __proto__ guard — allows prototype pollution
        target[key] = source[key];
    }
    return target;
}

// ============================================================
// 12. MISSING ERROR HANDLING
// ============================================================
async function fetchExternalData(url) {
    // No try/catch, no timeout, no validation of URL
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

// ============================================================
// 13. HARDCODED IP / INTERNAL URL (SSRF risk, CWE-918)
// ============================================================
const INTERNAL_API = "http://192.168.1.100:8080/admin/api";
const METADATA_URL = "http://169.254.169.254/latest/meta-data/";

async function proxyRequest(req, res) {
    // SSRF — user controls the target URL
    const target = req.query.url;
    const response = await fetch(target);
    const body = await response.text();
    res.send(body);
}

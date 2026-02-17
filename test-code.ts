// Test file with intentional security issues

const API_KEY = "sk-hardcoded-secret-key-12345";
const PASSWORD = "admin123";

function loginUser(username: string, password: string) {
  // SQL Injection vulnerability
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  return database.execute(query);
}

function displayUserData(userId: string) {
  // XSS vulnerability
  document.innerHTML = `<div>User ID: ${userId}</div>`;
}

// Missing error handling
async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}

// PII without proper handling
const userData = {
  email: "user@example.com",
  ssn: "123-45-6789",
  creditCard: "4532-1234-5678-9012"
};

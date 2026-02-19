# Test File 2: Python Flask API with Security Issues
# This file intentionally contains security vulnerabilities for testing

import os
import hashlib
import subprocess
from flask import Flask, request, render_template_string
import sqlite3
import pickle

app = Flask(__name__)

# ISSUE 1: Hardcoded Secret Key
app.config['SECRET_KEY'] = 'my-flask-secret-key-12345'

# ISSUE 2: Hardcoded Database Credentials  
DATABASE_URL = "postgresql://admin:TEST_PASSWORD_NOT_REAL@localhost:5432/mydb" # Bad practice!
API_KEY = "sk-test-XXXXXXXXXXXXXXXXXXXXXX" # Hardcoded - use env vars instead!

# ISSUE 3: SQL Injection in Python
@app.route('/user/<user_id>')
def get_user(user_id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # Vulnerable: String formatting in SQL
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)
    
    user = cursor.fetchone()
    conn.close()
    return {'user': user}

# ISSUE 4: Another SQL Injection Pattern
@app.route('/search')
def search():
    term = request.args.get('q')
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # Vulnerable: String concatenation
    query = "SELECT * FROM products WHERE name LIKE '%" + term + "%'"
    cursor.execute(query)
    
    results = cursor.fetchall()
    conn.close()
    return {'results': results}

# ISSUE 5: XSS via Template Injection
@app.route('/hello/<name>')
def hello(name):
    # Vulnerable: Unescaped user input in template
    template = f"<h1>Hello {name}!</h1><p>Welcome to our site</p>"
    return render_template_string(template)

# ISSUE 6: Command Injection
@app.route('/execute')
def execute_command():
    cmd = request.args.get('cmd')
    
    # Extremely dangerous: Shell command with user input
    result = subprocess.check_output(cmd, shell=True)
    return result

# ISSUE 7: Path Traversal
@app.route('/files/<path:filename>')
def get_file(filename):
    # Vulnerable: No path validation
    file_path = '/var/www/uploads/' + filename
    with open(file_path, 'r') as f:
        content = f.read()
    return content

# ISSUE 8: Weak Cryptography - MD5
def hash_password(password):
    # Vulnerable: MD5 is broken
    return hashlib.md5(password.encode()).hexdigest()

# ISSUE 9: Weak Cryptography - SHA1  
def generate_token(data):
    # Vulnerable: SHA1 is deprecated
    return hashlib.sha1(data.encode()).hexdigest()

# ISSUE 10: Insecure Deserialization
@app.route('/load_data', methods=['POST'])
def load_data():
    data = request.data
    
    # Extremely dangerous: Unpickling untrusted data
    obj = pickle.loads(data)
    return {'loaded': str(obj)}

# ISSUE 11: eval() with User Input
@app.route('/calc')
def calculate():
    expression = request.args.get('expr')
    
    # Dangerous: Evaluating user input as code
    result = eval(expression)
    return {'result': result}

# ISSUE 12: Hardcoded AWS Credentials
AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE'
AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'

# ISSUE 13: Logging Sensitive Data
@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')
    
    # Vulnerable: Logging password
    app.logger.info(f'Login attempt - Username: {username}, Password: {password}')
    
    # Authenticate user...
    token = generate_auth_token(username)
    
    # Vulnerable: Logging token
    app.logger.info(f'Generated token: {token}')
    
    return {'token': token}

# ISSUE 14: Missing Authentication
@app.route('/admin/delete_user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    # No authentication check!
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute(f"DELETE FROM users WHERE id = {user_id}")
    conn.commit()
    conn.close()
    return {'status': 'deleted'}

# ISSUE 15: Debug Mode in Production
if __name__ == '__main__':
    # Dangerous: Debug mode exposes sensitive info
    app.run(debug=True, host='0.0.0.0', port=5000)

# ISSUE 16: Hardcoded JWT Secret
JWT_SECRET = "jwt-secret-key-do-not-share"

# ISSUE 17: Weak Random Generation
import random
def generate_session_id():
    # Weak: random is not cryptographically secure
    return str(random.randint(1000000, 9999999))

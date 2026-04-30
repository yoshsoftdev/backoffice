document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  chrome.storage.local.get(['username', 'userId'], function(result) {
    if (result.username && result.userId) {
      showLoggedInView(result.username, result.userId);
    }
  });

  // Login button click handler
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  
  // Logout button click handler
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
});

function handleLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const database = document.getElementById('database').value;
  const errorMsg = document.getElementById('error-msg');

  if (!username || !password) {
    errorMsg.textContent = 'Please enter username and password';
    return;
  }

  errorMsg.textContent = 'Logging in...';

  // Call Odoo authentication API
  authenticate(database, username, password)
    .then(userId => {
      if (userId) {
        // Save credentials to chrome.storage
        chrome.storage.local.set({
          username: username,
          password: password,
          database: database,
          userId: userId
        }, function() {
          showLoggedInView(username, userId);
        });
      } else {
        errorMsg.textContent = 'Authentication failed';
      }
    })
    .catch(error => {
      errorMsg.textContent = 'Error: ' + error.message;
    });
}

function handleLogout() {
  chrome.storage.local.remove(['username', 'password', 'database', 'userId'], function() {
    showLoginForm();
  });
}

function authenticate(database, username, password) {
  return fetch(API_BASE_URL, {
    method: 'POST',
    headers: jsonRpcRequestHeaders(),
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'authenticate',
        args: [database, username, password, {}]
      },
      id: 1
    })
  })
  .then(parseJsonRpcResponse)
  .then(data => {
    if (data.error) {
      throw new Error(data.error.message || 'Authentication failed');
    }
    return data.result; // Returns user ID (number)
  });
}

function showLoggedInView(username, userId) {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('logged-in-view').style.display = 'block';
  document.getElementById('username-display').value = username;
  document.getElementById('user-id-display').value = userId;
  document.getElementById('error-msg').textContent = '';
}

function showLoginForm() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('logged-in-view').style.display = 'none';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('error-msg').textContent = '';
}

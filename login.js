document.addEventListener('DOMContentLoaded', function () {
  // Initialize the login form
  document.getElementById('login-form').reset();
  document.getElementById('response-message').innerText = '';
});
// Login form submission handler  

document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  if (!username) {
    document.getElementById('response-message').innerText = 'Username is required';
    return;
  }
  const password = document.getElementById('password').value.trim();
  if (!password) {
    document.getElementById('response-message').innerText = 'Password is required';
    return;
  }
  document.getElementById('response-message').innerText = 'Logging in...';
  // Send login request to the server

  fetch('http://127.0.0.1:8000/api/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password })
  })
    .then(response => response.json())
    .then(data => {
      document.getElementById('response-message').innerText = data.message;
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('response-message').innerText = 'An error occurred';
    });
});
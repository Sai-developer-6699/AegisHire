document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent form from submitting

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // Example hardcoded credentials
  const validUsername = 'admin';
  const validPassword = '1234';

  if (username === validUsername && password === validPassword) {
    alert('Login successful!');
    // Redirect to dashboard.html or next page
    window.location.href = 'dashboard.html';
  } else {
    document.getElementById('login-status').classList.remove('hidden');
  }
});

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

 fetch("http://127.0.0.1:8000/api/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Invalid credentials");
      }
      return response.json();
    })
    .then(data => {
      console.log(data.message); // Optional: Debug log
      // ✅ Redirect to dashboard
      window.location.href = "dashboard.html";
    })
    .catch(error => {
      console.error("Login failed:", error);
      document.getElementById("response-message").innerText = "Login failed: " + error.message;
    });
});
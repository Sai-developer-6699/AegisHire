document.addEventListener('DOMContentLoaded', function () {
  // Initialize the login form
  document.getElementById('login-form').reset();
  document.getElementById('response-message').innerText = '';
});

document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    document.getElementById('response-message').innerText = 'Username and Password are required';
    return;
  }

  document.getElementById('response-message').innerText = 'Logging in...';

  fetch("http://127.0.0.1:8000/api/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Invalid credentials");
      }
      return response.json();
    })
    .then(data => {
      // ✅ Save to localStorage for access control
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("username", username);
      localStorage.setItem("roleid", data.roleid);

      // ✅ Redirect based on role
      switch (data.roleid) {
        case 1:
          window.location.href = "dashboard.html";        
          break;
        case 2:
          window.location.href = "manager_dashboard.html";
          break;
        case 3:
          window.location.href = "resumeupload.html";
          break;
        case 4:
          window.location.href = "candidate_dashboard.html";
          break;
        default:
          document.getElementById("response-message").innerText = "Unknown role. Please contact support.";
          console.error("Unknown role ID:", data.roleid);
          return;
        
      }
    })
    .catch(error => {
      console.error("Login failed:", error);
      document.getElementById("response-message").innerText = "Login failed: " + error.message;
    });
});
// Redirect if already logged in
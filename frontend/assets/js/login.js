// Overlay helpers
function showOverlay() {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.remove('hidden');
  overlay.style.visibility = 'visible'; // ADD THIS
  anime({
    targets: overlay,
    opacity: [0, 1],
    duration: 400,
    easing: 'easeOutQuad'
  });
}

function hideOverlay(immediate = false) {
  const overlay = document.getElementById('loading-overlay');
  if (immediate) {
    overlay.classList.add('hidden');
    overlay.style.opacity = 0;
    overlay.style.visibility = 'hidden'; // ADD THIS
    return;
  }
  anime({
    targets: overlay,
    opacity: [1, 0],
    duration: 400,
    easing: 'easeInQuad',
    complete: () => {
      overlay.classList.add('hidden');
      overlay.style.visibility = 'hidden'; // ADD THIS
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const responseMessage = document.getElementById('response-message');

  // Initial reset/cleanup
  form.reset();
  responseMessage.textContent = '';
  hideOverlay(true);

  form.addEventListener('submit', async event => {
    event.preventDefault();

    // grab & validate
    const username = form.username.value.trim();
    const password = form.password.value.trim();
    if (!username || !password) {
      responseMessage.textContent = 'Username and Password are required';
      return;
    }

    try {
      showOverlay();

      // Use simple POST request
      const data = await simplePost('/login/', { username, password });

      responseMessage.textContent = 'Login successful!';

      // Validate roleid exists
      if (!data.roleid) {
        responseMessage.textContent = 'Invalid user role. Please contact support.';
        return;
      }

      // role-based redirect
      switch (data.roleid) {
        case 1: 
          console.log('Redirecting Admin to dashboard');
          return window.location.href = 'pages/dashboard.html';
        case 2: 
          console.log('Redirecting Manager to manager dashboard');
          return window.location.href = 'pages/manager_dashboard.html';
        case 3: 
          console.log('Redirecting HR to resume upload');
          return window.location.href = 'pages/hr_resumeupload.html';
        case 4: 
          console.log('Redirecting Candidate to candidate dashboard');
          return window.location.href = 'pages/candidate_dashboard.html';
        default:
          console.error('Unknown role ID:', data.roleid);
          responseMessage.textContent = `Unknown role (ID: ${data.roleid}). Please contact support.`;
      }
    }
    catch (err) {
      console.error('Login failed:', err);
      responseMessage.textContent = `Login failed: ${err.message}`;
    }
    finally {
      hideOverlay();
    }
  });
});
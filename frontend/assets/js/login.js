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

      const res = await fetch(`${apiConfig.getURL('api/login/')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();

      responseMessage.textContent = 'Login successful!';

      // role-based redirect
      switch (data.roleid) {
        case 1: return window.location.href = '../pages/dashboard.html';
        case 2: return window.location.href = '../pages/manager_dashboard.html';
        case 3: return window.location.href = '../pages/hr_resumeupload.html';
        case 4: return window.location.href = '../pages/candidate_dashboard.html';
        default:
          responseMessage.textContent = 'Unknown role. Please contact support.';
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
import { loginAdmin, resetPasswordEmail, onAuthChange } from "./firebase-service.js";

const loginForm = document.getElementById('loginForm');
const resetForm = document.getElementById('resetForm');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');
const resetMsg = document.getElementById('resetMsg');
const forgotPassBtn = document.getElementById('forgotPassBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const submitBtn = document.getElementById('submitBtn');
const resetSubmitBtn = document.getElementById('resetSubmitBtn');

// If already logged in, go to admin
onAuthChange((user) => {
  if (user) {
    window.location.href = '/admin.html';
  }
});

// Toggle between Login & Reset
if (forgotPassBtn) {
  forgotPassBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    resetForm.style.display = 'block';
    const emailVal = document.getElementById('email').value.trim();
    if (emailVal) document.getElementById('resetEmail').value = emailVal;
    resetMsg.hidden = true;
  });
}

if (backToLoginBtn) {
  backToLoginBtn.addEventListener('click', () => {
    resetForm.style.display = 'none';
    loginForm.style.display = 'block';
    errorMsg.hidden = true;
  });
}

// Handle Admin Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  errorMsg.hidden = true;
  if (successMsg) successMsg.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  try {
    const result = await loginAdmin(email, password);
    if (result.success) {
      // onAuthChange will handle redirect
    } else {
      errorMsg.textContent = result.error || "Invalid email or password. Please try again.";
      errorMsg.hidden = false;
    }
  } catch (err) {
    errorMsg.textContent = "Sign in error. Please check your internet connection.";
    errorMsg.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In to Admin';
  }
});

// Handle Password Reset Request
if (resetForm) {
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const resetEmail = document.getElementById('resetEmail').value.trim();
    resetMsg.hidden = true;
    resetSubmitBtn.disabled = true;
    resetSubmitBtn.textContent = 'Sending link...';

    try {
      const res = await resetPasswordEmail(resetEmail);
      if (res.success) {
        resetMsg.textContent = `Password reset link sent to ${resetEmail}. Check your inbox!`;
        resetMsg.style.color = '#10b981';
        resetMsg.hidden = false;
      } else {
        resetMsg.textContent = res.error || 'Failed to send reset link. Verify email address.';
        resetMsg.style.color = '#ef4444';
        resetMsg.hidden = false;
      }
    } catch (err) {
      resetMsg.textContent = 'An error occurred. Please try again.';
      resetMsg.style.color = '#ef4444';
      resetMsg.hidden = false;
    } finally {
      resetSubmitBtn.disabled = false;
      resetSubmitBtn.textContent = 'Send Reset Email';
    }
  });
}

import { loginAdmin, onAuthChange } from "./firebase-service.js";

const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

// If already logged in, go to admin
onAuthChange((user) => {
  if (user) {
    window.location.href = '/admin.html';
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  errorMsg.hidden = true;
  const result = await loginAdmin(email, password);

  if (result.success) {
    // window.location.href = '/admin.html'; // onAuthChange will handle redirect
  } else {
    errorMsg.textContent = "Invalid email or password. Please try again.";
    errorMsg.hidden = false;
  }
});

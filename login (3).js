let isLoginMode = true;

// 1. Toggle between Login and Registration UI
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const authTitle = document.getElementById('auth-title');
    const authBtn = document.getElementById('auth-btn');
    const toggleLink = document.getElementById('auth-toggle-link');

    if (isLoginMode) {
        authTitle.innerText = "Account Login";
        authBtn.innerText = "Sign In";
        toggleLink.innerText = "Need an account? Register here";
    } else {
        authTitle.innerText = "Create Account";
        authBtn.innerText = "Register";
        toggleLink.innerText = "Have an account? Login here";
    }
}

// 2. Handle Login/Registration logic
async function handleAuth() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        return alert("Please enter both email and password.");
    }

    try {
        if (isLoginMode) {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            alert("Logged in successfully!");
        } else {
            await firebase.auth().createUserWithEmailAndPassword(email, password);
            alert("Account created successfully!");
        }

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('session')) {
            showSection('student-zone');
        } else {
            showSection('teacher-zone');
        }
    } catch (error) {
        alert("Auth Error: " + error.message);
    }
}

// 3. Handle Logout
function logoutUser() {
    firebase.auth().signOut().then(() => {
        alert("Logged out successfully.");
        showSection('auth-zone');
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
}

// 4. Global Auth State Observer
firebase.auth().onAuthStateChanged((user) => {
    const userDisplay = document.getElementById('user-display');
    const loginLink = document.getElementById('auth-nav-item');
    const logoutLink = document.getElementById('logout-nav-item');

    if (user) {
        userDisplay.innerText = user.email.split('@')[0].toUpperCase();
        loginLink.style.display = 'none';
        logoutLink.style.display = 'block';
    } else {
        userDisplay.innerText = "GUEST";
        loginLink.style.display = 'block';
        logoutLink.style.display = 'none';

        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('session')) {
            showSection('auth-zone');
        }
    }
});

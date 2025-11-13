document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('adminRegisterForm');
    const messageDiv = document.getElementById('registerMessage');

    // Hard-coded admin registration code (in production, this should be more secure)
    const ADMIN_REGISTRATION_CODE = "MUNI2024";

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const adminCode = document.getElementById('adminCode').value;
        
        const submitBtn = registerForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;

        // Validation
        if (password !== confirmPassword) {
            showMessage("Passwords do not match!", "error");
            return;
        }

        if (password.length < 6) {
            showMessage("Password must be at least 6 characters long!", "error");
            return;
        }

        if (adminCode !== ADMIN_REGISTRATION_CODE) {
            showMessage("Invalid admin registration code!", "error");
            return;
        }

        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitBtn.disabled = true;

        try {
            // Create user in Firebase Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Store admin details in Firestore
            await db.collection(USERS_COLLECTION).doc(user.uid).set({
                name: fullName,
                email: email,
                role: 'admin',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            });

            // Store user in localStorage and redirect
            localStorage.setItem('adminUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                name: fullName
            }));

            showMessage("Admin account created successfully! Redirecting...", "success");
            
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            let errorMessage = 'Account creation failed. ';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage += 'This email is already registered.';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'Invalid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage += 'Password is too weak.';
                    break;
                default:
                    errorMessage += 'Please try again.';
            }
            
            showMessage(errorMessage, "error");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        if (type === 'success') {
            messageDiv.style.background = 'rgba(0, 128, 0, 0.1)';
            messageDiv.style.color = '#2E8B57';
            messageDiv.style.border = '1px solid rgba(0, 128, 0, 0.2)';
        } else {
            messageDiv.style.background = 'rgba(128, 0, 0, 0.1)';
            messageDiv.style.color = 'var(--maroon)';
            messageDiv.style.border = '1px solid rgba(128, 0, 0, 0.2)';
        }
    }

    // Real-time password confirmation validation
    document.getElementById('confirmPassword').addEventListener('input', function() {
        const password = document.getElementById('password').value;
        const confirmPassword = this.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.style.borderColor = 'var(--maroon)';
        } else {
            this.style.borderColor = 'var(--cream-dark)';
        }
    });
});
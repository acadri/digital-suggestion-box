document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('adminLoginForm');
    const errorMessage = document.getElementById('loginError');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Check if user is admin
            const userDoc = await db.collection(USERS_COLLECTION).doc(user.uid).get();
            
            if (userDoc.exists && userDoc.data().role === 'admin') {
                localStorage.setItem('adminUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name: userDoc.data().name
                }));
                window.location.href = 'admin-dashboard.html';
            } else {
                throw new Error('Not an admin user');
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.style.display = 'block';
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Check if already logged in
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
        window.location.href = 'admin-dashboard.html';
    }
});
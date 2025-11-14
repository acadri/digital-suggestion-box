document.addEventListener('DOMContentLoaded', function() {
    const inviteForm = document.getElementById('adminInviteForm');
    const messageDiv = document.getElementById('inviteMessage');

    // Redirect if not logged in
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'admin-login.html';
        } else {
            // Check if user is an admin
            db.collection(USERS_COLLECTION).doc(user.uid).get().then(doc => {
                if (!doc.exists || doc.data().role !== 'admin') {
                    window.location.href = 'admin-login.html';
                }
            });
        }
    });

    inviteForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const submitBtn = inviteForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;

        if (!email) {
            showMessage("Please enter a valid email address.", "error");
            return;
        }

        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Invitation...';
        submitBtn.disabled = true;

        try {
            // 1. Check if a user with this email already exists and is an admin
            const userQuery = await db.collection(USERS_COLLECTION).where('email', '==', email).get();
            let existingAdmin = false;
            userQuery.forEach(doc => {
                if (doc.data().role === 'admin') {
                    existingAdmin = true;
                }
            });

            if (existingAdmin) {
                throw { code: 'auth/admin-already-exists' };
            }

            // 2. Check if an invitation for this email already exists
            const invitationQuery = await db.collection(INVITED_ADMINS_COLLECTION).where('email', '==', email).get();
            if (!invitationQuery.empty) {
                throw { code: 'auth/invitation-already-sent' };
            }

            // 3. If no issues, add the email to the invitedAdmins collection
            await db.collection(INVITED_ADMINS_COLLECTION).add({
                email: email,
                invitedAt: new Date().toISOString()
            });

            showMessage(`Invitation sent to ${email}. They can now register as an admin.`, 'success');
            inviteForm.reset();

        } catch (error) {
            console.error('Invitation error:', error);
            let errorMessage = 'Failed to send invitation. ';
            
            switch (error.code) {
                case 'auth/admin-already-exists':
                    errorMessage += 'A user with this email is already an administrator.';
                    break;
                case 'auth/invitation-already-sent':
                    errorMessage += 'An invitation has already been sent to this email address.';
                    break;
                default:
                    errorMessage += 'Please try again.';
            }
            
            showMessage(errorMessage, "error");
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        const color = type === 'success' ? '#2E8B57' : 'var(--maroon)';
        const background = type === 'success' ? 'rgba(0, 128, 0, 0.1)' : 'rgba(128, 0, 0, 0.1)';
        const border = type === 'success' ? '1px solid rgba(0, 128, 0, 0.2)' : '1px solid rgba(128, 0, 0, 0.2)';

        messageDiv.style.color = color;
        messageDiv.style.background = background;
        messageDiv.style.border = border;
    }
});
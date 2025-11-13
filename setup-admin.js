// This helper can be used to create the first admin account from the browser console.
// IMPORTANT: Creating admin accounts from client-side code is risky in production. Prefer to create users
// via a secure server-side admin process. Use this only for initial development/testing in a safe environment.

async function createFirstAdmin(email, password, fullName) {
    if (!email || !password || !fullName) {
        throw new Error('email, password and fullName are required. Example: createFirstAdmin("you@domain", "SecureP@ss1", "Admin Name")');
    }

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
            lastLogin: new Date().toISOString(),
            isSuperAdmin: true
        });

        console.log('First admin account created successfully for', email);
        console.log('Please change the password after first login.');

    } catch (error) {
        console.error('Error creating admin account:', error);
        throw error;
    }
}

// To use (ONLY IN DEV): open browser console and run, e.g.
// createFirstAdmin('admin@muni.ac.ug', 'A_strong_password_here', 'System Administrator');

function createFirstAdmin(email, password, fullName) {
    // Basic validation
    if (!email || !password || !fullName) {
        const missing = [];
        if (!email) missing.push("email");
        if (!password) missing.push("password");
        if (!fullName) missing.push("fullName");
        
        return Promise.reject(new Error(`Missing required fields: ${missing.join(", ")}. Example: createFirstAdmin("you@domain", "SecureP@ss1", "Admin Name")`));
    }

    // Password complexity check (example)
    if (password.length < 8) {
        return Promise.reject(new Error("Password must be at least 8 characters long."));
    }

    let createdUser;

    // Use Firebase Auth to create the user
    return firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            createdUser = userCredential.user;
            console.log("Step 1: Firebase Auth user created successfully:", createdUser.uid);

            // Now, add admin role and name to Firestore
            return db.collection("admins").doc(createdUser.uid).set({
                email: email,
                fullName: fullName,
                role: "superadmin", // Assign a role for access control
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            console.log("Step 2: Admin role and details successfully written to Firestore for user:", createdUser.uid);
            console.log(`SUCCESS: Admin user '${fullName}' created with email '${email}'. You can now log in.`);
            return { uid: createdUser.uid, email: email, fullName: fullName };
        })
        .catch(error => {
            // Handle specific errors
            if (error.code === 'auth/email-already-in-use') {
                console.error("Error: This email is already in use. If you need to reset permissions, please do so in the Firebase console.");
            } else {
                console.error("An error occurred during admin creation:", error);
            }
            // Reject the promise with the original error
            return Promise.reject(error);
        });
}

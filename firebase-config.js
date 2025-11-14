// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDclDdmlczR8RQY8kLy8lRZa6ujQyT3iEQ",
    authDomain: "digital-suggestion-26466-14b6b.firebaseapp.com",
    projectId: "digital-suggestion-26466-14b6b",
    storageBucket: "digital-suggestion-26466-14b6b.appspot.com",
    messagingSenderId: "923828375132",
    appId: "1:923828375132:web:bcf89cf1036dd9404ba099"
};

// Initialize Firebase (guarded)
try {
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded');
    }
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Set auth persistence to SESSION to work in incognito mode
    auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .then(() => {
            console.log("Firebase auth persistence set to session. Initializing services.");
            // After persistence is set, run the seeding function
            seedInitialAdmin();
        })
        .catch((error) => {
            console.error("Error setting Firebase auth persistence:", error);
        });

    // Firebase collections
    const SUGGESTIONS_COLLECTION = "suggestions";
    const ADMIN_RESPONSES_COLLECTION = "adminResponses";
    const USERS_COLLECTION = "users";
    const INVITED_ADMINS_COLLECTION = "invitedAdmins";

    // --- Initial Admin Seeding ---
    async function seedInitialAdmin() {
        try {
            // 1. Check if any admins already exist in the USERS_COLLECTION
            const adminSnapshot = await db.collection(USERS_COLLECTION).where('role', '==', 'admin').limit(1).get();
            
            // If there are no admins, proceed with seeding
            if (adminSnapshot.empty) {
                const initialAdminEmail = "abetinichlas@gmail.com";

                // 2. Check if an invitation for this email already exists
                const invitationSnapshot = await db.collection(INVITED_ADMINS_COLLECTION).where('email', '==', initialAdminEmail).limit(1).get();

                // 3. If no invitation exists, create one
                if (invitationSnapshot.empty) {
                    await db.collection(INVITED_ADMINS_COLLECTION).add({
                        email: initialAdminEmail,
                        invitedAt: new Date().toISOString(),
                        isInitialSeed: true // Flag to indicate this was a seeded invitation
                    });
                    console.log(`Initial admin invitation seeded for ${initialAdminEmail}.`);
                } else {
                    console.log('Initial admin invitation already exists.');
                }
            } else {
                console.log('An admin account already exists. Skipping initial admin seed.');
            }
        } catch (error) {
            console.error("Error seeding initial admin:", error);
        }
    }

    // Export required globals for the other scripts (browser-global style used in this project)
    window.db = db;
    window.auth = auth;
    window.SUGGESTIONS_COLLECTION = SUGGESTIONS_COLLECTION;
    window.ADMIN_RESPONSES_COLLECTION = ADMIN_RESPONSES_COLLECTION;
    window.USERS_COLLECTION = USERS_COLLECTION;
    window.INVITED_ADMINS_COLLECTION = INVITED_ADMINS_COLLECTION;
} catch (err) {
    console.error('Firebase initialization failed:', err);
}

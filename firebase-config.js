console.log("--- Loading Config Version 2.0 ---");

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB7ejWggTEpQESj9AGihaQqKmNsbWM3kuQ",
    authDomain: "muni-suggestion-box.firebaseapp.com",
    projectId: "muni-suggestion-box",
    storageBucket: "muni-suggestion-box.firebasestorage.app",
    messagingSenderId: "125965916988",
    appId: "1:125965916988:web:5209d201562c50e6de1c39"
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
        })
        .catch((error) => {
            console.error("Error setting Firebase auth persistence:", error);
        });

    // Firebase collections
    const SUGGESTIONS_COLLECTION = "suggestions";
    const ADMIN_RESPONSES_COLLECTION = "adminResponses";
    const USERS_COLLECTION = "users";
    const INVITED_ADMINS_COLLECTION = "invitedAdmins";

    // Export required globals for the other scripts
    window.db = db;
    window.auth = auth;
    window.SUGGESTIONS_COLLECTION = SUGGESTIONS_COLLECTION;
    window.ADMIN_RESPONSES_COLLECTION = ADMIN_RESPONSES_COLLECTION;
    window.USERS_COLLECTION = USERS_COLLECTION;
    window.INVITED_ADMINS_COLLECTION = INVITED_ADMINS_COLLECTION;
} catch (err) {
    console.error('Firebase initialization failed:', err);
}

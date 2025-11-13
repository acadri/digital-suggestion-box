// Firebase configuration
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
// Basic safety-check: ensure placeholders are replaced before initializing in production
if (firebaseConfig.apiKey && firebaseConfig.apiKey.includes('your-')) {
    console.warn('firebase-config.js: It looks like Firebase config values are placeholders. Replace them with your project config before deploying.');
}

// Initialize Firebase (guarded)
try {
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded');
    }
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    // Firebase collections
    const SUGGESTIONS_COLLECTION = "suggestions";
    const ADMIN_RESPONSES_COLLECTION = "adminResponses";
    const USERS_COLLECTION = "users";

    // Export required globals for the other scripts (browser-global style used in this project)
    window.db = db;
    window.auth = auth;
    window.SUGGESTIONS_COLLECTION = SUGGESTIONS_COLLECTION;
    window.ADMIN_RESPONSES_COLLECTION = ADMIN_RESPONSES_COLLECTION;
    window.USERS_COLLECTION = USERS_COLLECTION;
} catch (err) {
    console.error('Firebase initialization failed:', err);
}
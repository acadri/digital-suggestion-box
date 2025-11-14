// Firebase configuration (v3.0 - Modular Compat)
const firebaseConfig = {
    apiKey: "AIzaSyB7ejWggTEpQESj9AGihaQqKmNsbWM3kuQ",
    authDomain: "muni-suggestion-box.firebaseapp.com",
    projectId: "muni-suggestion-box",
    storageBucket: "muni-suggestion-box.appspot.com",
    messagingSenderId: "125965916988",
    appId: "1:125965916988:web:5209d201562c50e6de1c39"
};

// Initialize Firebase using the compat libraries
// These will be available globally because we loaded the scripts in index.html
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Make services globally available for other scripts to use
window.app = app;
window.auth = auth;
window.db = db;

// Set auth persistence to SESSION (recommended for this app)
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(() => {
        console.log("Firebase auth persistence set to session.");
    })
    .catch((error) => {
        console.error("Error setting Firebase auth persistence:", error);
    });

// Define collection names globally so they can be used in other scripts
window.SUGGESTIONS_COLLECTION = "suggestions";
window.ADMIN_RESPONSES_COLLECTION = "adminResponses";
window.USERS_COLLECTION = "users";
window.INVITED_ADMINS_COLLECTION = "invitedAdmins";

console.log("--- Firebase Config Loaded (v3.0) ---");

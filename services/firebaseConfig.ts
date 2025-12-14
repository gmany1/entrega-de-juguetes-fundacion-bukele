// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// PASO OBLIGATORIO: Reemplaza estos valores con los de tu proyecto en Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyDW3_So3zeTCygPmGOS5cK5tMqYPMLcVbs",
    authDomain: "juguetes-elsalvador.firebaseapp.com",
    projectId: "juguetes-elsalvador",
    storageBucket: "juguetes-elsalvador.firebasestorage.app",
    messagingSenderId: "1053892239602",
    appId: "1:1053892239602:web:d2ef67fba7a9552de8706b",
    measurementId: "G-9XP4KMBGGL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Auth and sign in anonymously to satisfy security rules
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

export const auth = getAuth(app);

// Helper to wait for auth before making requests
export const waitForAuth = new Promise<void>((resolve) => {
    // If already signed in
    if (auth.currentUser) {
        resolve();
        return;
    }

    // Wait for change
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            resolve();
            unsubscribe();
        }
    });

    // Attempt sign-in if needed (for anonymous)
    signInAnonymously(auth).catch((error) => {
        console.warn("Autenticación Anónima falló. Habilita 'Anonymous' en Firebase Console.", error);
        // We resolve anyway so the app doesn't hang forever, 
        // but requests might fail if rules strictly require auth.
        resolve();
    });
});

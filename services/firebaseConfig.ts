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

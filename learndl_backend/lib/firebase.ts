// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFBjVuldO-2UPjB6b6zwm_Z7aoT9TQkCo",
  authDomain: "learndl-4427b.firebaseapp.com",
  projectId: "learndl-4427b",
  storageBucket: "learndl-4427b.firebasestorage.app",
  messagingSenderId: "719465754687",
  appId: "1:719465754687:web:39380314020d0ccdc5888a",
  measurementId: "G-GY4TLB77SP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6Arlm9AtOH0MztTaY-dfHWFqFuxMLWRs",
  authDomain: "forum-e06cc.firebaseapp.com",
  databaseURL: "https://forum-e06cc-default-rtdb.firebaseio.com",
  projectId: "forum-e06cc",
  storageBucket: "forum-e06cc.firebasestorage.app",
  messagingSenderId: "183754251786",
  appId: "1:183754251786:web:3ddfba5835aec64676c9f3",
  measurementId: "G-0KYPB0WRFK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Слушатель изменения состояния аутентификации
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Пользователь вошел в систему
    console.log('User is signed in:', user.email);
  } else {
    // Пользователь вышел из системы
    console.log('User is signed out');
  }
});

export { app, auth, database };
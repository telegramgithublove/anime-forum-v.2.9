// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, enableLogging } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-vJAy9Adce0C4ixxZPsuEdJLcmxJMB6k",
  authDomain: "forum-a36e8.firebaseapp.com",
  projectId: "forum-a36e8",
  storageBucket: "forum-a36e8.firebasestorage.app",
  messagingSenderId: "783823450857",
  appId: "1:783823450857:web:0984ea46bb8d195c943678",
  databaseURL: "https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Отключаем логирование в продакшене
if (process.env.NODE_ENV !== 'production') {
  enableLogging(false, { warn: false });
}

export { app, auth, database };
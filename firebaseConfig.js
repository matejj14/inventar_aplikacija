import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAjVNQQpnWSFQaS4XGxNz8MKVkKxmmeKVE",
  authDomain: "inventar-aplikacija.firebaseapp.com",
  projectId: "inventar-aplikacija",
  storageBucket: "inventar-aplikacija.firebasestorage.app",
  messagingSenderId: "50089258920",
  appId: "1:50089258920:web:469186e87d4a1d1a44b79d",
  measurementId: "G-Y4P9GTK8G2"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
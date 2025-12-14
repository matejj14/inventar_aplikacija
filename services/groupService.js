// services/groupService.js
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import * as Crypto from 'expo-crypto'; // za hash gesla

// npm install expo-crypto
// (Expo projekt to podpira out-of-the-box)

async function hashPassword(password) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
}

export async function createGroup(name, password, owner) {
  console.log("Hashing password...");
  const passwordHash = await hashPassword(password);
  console.log("Hashed:", passwordHash);

  console.log("Preparing ref...");
  const groupsRef = collection(db, 'groups');
  console.log("groupsRef:", groupsRef);

  console.log("Adding doc...");
  const docRef = await addDoc(groupsRef, {
    name,
    passwordHash,
    ownerUid: owner.uid,
    members: [owner.uid],
    createdAt: Date.now(),
  });
  console.log("addDoc DONE:", docRef.id);

  return { id: docRef.id };
}

export async function findGroupByName(name) {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('name', '==', name));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

export async function joinGroup(groupId, password, user) {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);

  if (!groupSnap.exists()) {
    throw new Error('Skupina ne obstaja');
  }

  const data = groupSnap.data();
  const hash = await hashPassword(password);

  if (data.passwordHash !== hash) {
    throw new Error('Napačno geslo');
  }

  // dodaj userja v members, če ga še ni
  await updateDoc(groupRef, {
    members: arrayUnion(user.uid),
  });
}

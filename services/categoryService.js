// services/categoryService.js
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export async function addCategory(groupId, data) {
  const ref = collection(db, `groups/${groupId}/categories`);
  const doc = await addDoc(ref, {
    ...data,
    createdAt: Date.now(),
  });
  return doc.id;
}

export async function getCategories(groupId) {
  const ref = collection(db, `groups/${groupId}/categories`);
  const snapshot = await getDocs(ref);

  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }));
}

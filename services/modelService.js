import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export async function addModel(groupId, categoryId, name) {
  const ref = collection(
    db,
    `groups/${groupId}/categories/${categoryId}/models`
  );

  const doc = await addDoc(ref, {
    name,
    createdAt: Date.now(),
  });

  return doc.id;
}

export async function getModels(groupId, categoryId) {
  const ref = collection(
    db,
    `groups/${groupId}/categories/${categoryId}/models`
  );

  const snap = await getDocs(ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

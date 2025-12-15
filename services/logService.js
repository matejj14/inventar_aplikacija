import { db } from '../firebaseConfig';
import { collection, addDoc, orderBy, query, getDocs } from 'firebase/firestore';

export async function addLog(groupId, data) {
  const ref = collection(db, `groups/${groupId}/logs`);
  await addDoc(ref, {
    ...data,
    createdAt: Date.now(),
  });
}

export async function getLogs(groupId) {
  const q = query(
    collection(db, `groups/${groupId}/logs`),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

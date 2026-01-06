import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';

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

export async function recalcModelStats(groupId, categoryId, modelId) {
  const machinesRef = collection(
    db,
    `groups/${groupId}/categories/${categoryId}/models/${modelId}/machines`
  );

  const snap = await getDocs(machinesRef);

  const stats = {
    total: 0,
    stock: 0,
    reserved: 0,
    sold: 0,
    assembled: 0,
    disassembled: 0,
  };

  snap.forEach(d => {
    const m = d.data();
    stats.total++;

    if (m.status === 'stock') stats.stock++;
    if (m.status === 'reserved') stats.reserved++;
    if (m.status === 'sold') stats.sold++;

    if (m.status !== 'sold') {
      if (m.assembled === true) stats.assembled++;
      if (m.assembled === false) stats.disassembled++;
    }
  });

  const modelRef = doc(
    db,
    `groups/${groupId}/categories/${categoryId}/models/${modelId}`
  );

  await updateDoc(modelRef, { stats });
}

//za stroje znotraj modelov
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';

export async function addMachine(groupId, categoryId, modelId, data) {
  const ref = collection(
    db,
    `groups/${groupId}/categories/${categoryId}/models/${modelId}/machines`
  );

  await addDoc(ref, {
    ...data,
    createdAt: Date.now(),
  });
}

export async function getMachines(groupId, categoryId, modelId) {
  const ref = collection(
    db,
    `groups/${groupId}/categories/${categoryId}/models/${modelId}/machines`
  );

  const snap = await getDocs(ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateMachineStatus(
  groupId,
  categoryId,
  modelId,
  machineId,
  data
) {
  const ref = doc(
    db,
    `groups/${groupId}/categories/${categoryId}/models/${modelId}/machines/${machineId}`
  );

  await updateDoc(ref, data);
}

export async function deleteMachine(
  groupId,
  categoryId,
  modelId,
  machineId
) {
  const ref = doc(
    db,
    `groups/${groupId}/categories/${categoryId}/models/${modelId}/machines/${machineId}`
  );

  await deleteDoc(ref);
}

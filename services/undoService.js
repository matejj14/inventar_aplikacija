import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { addLog } from './logService';
import { recalcModelStats } from './modelService';
import { recalcCategoryStats } from './categoryService';

export async function undoLog(groupId, log) {
  const { machineId, categoryId, modelId, type } = log;

  const machineRef = doc(
    db,
    `groups/${groupId}/categories/${categoryId}/models/${modelId}/machines/${machineId}`
  );

  if (type === 'SOLD') {
    await updateDoc(machineRef, {
      status: 'stock',
    });

    await addLog(groupId, {
      type: 'UNDO_SOLD',
      machineId,
      categoryId,
      modelId,
    });
  }

  if (type === 'RESERVED') {
    await updateDoc(machineRef, {
      status: 'stock',
      customerName: null,
      customerPhone: null,
      reservedAt: null,
    });

    await addLog(groupId, {
      type: 'UNDO_RESERVED',
      machineId,
      categoryId,
      modelId,
    });
  }

  await recalcModelStats(groupId, categoryId, modelId);
  await recalcCategoryStats(groupId, categoryId);
}

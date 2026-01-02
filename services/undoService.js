import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { addLog } from './logService';
import { recalcModelStats } from './modelService';
import { recalcCategoryStats } from './categoryService';

export async function undoLog(groupId, log, reason = null, user) {
  const {
    machineId,
    categoryId,
    modelId,
    modelName,
    machineLabel,
    type,
  } = log;

  // označimo originalni log kot razveljavljen
  const logRef = doc(db, `groups/${groupId}/logs/${log.id}`);
  await updateDoc(logRef, { undone: true });

  const machineRef = doc(
    db,
    `groups/${groupId}/categories/${categoryId}/models/${modelId}/machines/${machineId}`
  );

  if (type === 'SOLD') {
    await updateDoc(machineRef, {
      status: 'stock',
      customerName: null,
      customerPhone: null,
      soldAt: null,
    });

    await addLog(groupId, {
      type: 'UNDO_SOLD',
      machineId,
      categoryId,
      modelId,
      modelName,
      machineLabel,
      reason, // lahko null
      userId: user.uid,
      username: user.username,
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
      modelName,
      machineLabel,
      reason,
      userId: user.uid,
      username: user.username,
    });
  }

  await recalcModelStats(groupId, categoryId, modelId);
  await recalcCategoryStats(groupId, categoryId);
}

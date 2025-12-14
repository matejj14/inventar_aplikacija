import { storage, db } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

export async function uploadCategoryImage(groupId, categoryId, uri) {
  const response = await fetch(uri);
  const blob = await response.blob();

  const imageRef = ref(
    storage,
    `groups/${groupId}/categories/${categoryId}.jpg`
  );

  await uploadBytes(imageRef, blob);
  const url = await getDownloadURL(imageRef);

  const docRef = doc(db, `groups/${groupId}/categories/${categoryId}`);
  await updateDoc(docRef, { imageUrl: url });

  return url;
}

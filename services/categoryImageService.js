import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebaseConfig';

export async function uploadCategoryImage(groupId, categoryId, uri) {
  const response = await fetch(uri);
  const blob = await response.blob();

  const imageRef = ref(storage, `groups/${groupId}/categories/${categoryId}.jpg`);
  await uploadBytes(imageRef, blob);

  const downloadURL = await getDownloadURL(imageRef);

  await updateDoc(doc(db, `groups/${groupId}/categories/${categoryId}`), {
    image: downloadURL,
  });

  return downloadURL;
}

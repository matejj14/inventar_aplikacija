import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export async function pickFromGallery() {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (!res.canceled) return res.assets[0].uri;
}

export async function takePhoto() {
  const res = await ImagePicker.launchCameraAsync({
    quality: 0.7,
  });
  if (!res.canceled) return res.assets[0].uri;
}

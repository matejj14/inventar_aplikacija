//da se shrani v kateri skupini si pridružen, da se ne rabiš vsakič ka not prideš vpisovat v skupino
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'LAST_GROUP_ID';

export async function saveLastGroup(groupId) {
  await AsyncStorage.setItem(KEY, groupId);
}

export async function getLastGroup() {
  return await AsyncStorage.getItem(KEY);
}

export async function clearLastGroup() {
  await AsyncStorage.removeItem(KEY);
}

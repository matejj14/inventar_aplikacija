// services/userService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Če še nimaš uuid, namesti: npm install uuid

const USER_KEY = 'local_user';

export async function getLocalUser() {
  try {
    const json = await AsyncStorage.getItem(USER_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.log('Error reading user', e);
    return null;
  }
}

export async function saveLocalUser(username) {
  const user = {
    uid: uuidv4(),
    username,
    createdAt: Date.now(),
  };
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch (e) {
    console.log('Error saving user', e);
    throw e;
  }
}

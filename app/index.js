// app/index.js
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getLocalUser, saveLocalUser } from '../services/userService';
import { createGroup, findGroupByName, joinGroup } from '../services/groupService';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [usernameInput, setUsernameInput] = useState('');

  // za skupine
  const [groupName, setGroupName] = useState('');
  const [groupPassword, setGroupPassword] = useState('');

  useEffect(() => {
    (async () => {
      const u = await getLocalUser();
      if (u) {
        setUser(u);
      }
      setLoading(false);
    })();
  }, []);

  async function handleSaveUsername() {
    if (!usernameInput.trim()) {
      Alert.alert('Napaka', 'Vnesi uporabniško ime.');
      return;
    }
    try {
      const u = await saveLocalUser(usernameInput.trim());
      setUser(u);
    } catch (e) {
      Alert.alert('Napaka', 'Neuspešno shranjevanje uporabnika.');
    }
  }

  async function handleCreateGroup() {
    if (!groupName.trim() || !groupPassword) {
      Alert.alert('Napaka', 'Vnesi ime skupine in geslo.');
      return;
    }
    try {
      const res = await createGroup(groupName.trim(), groupPassword, user);
      router.push(`/group/${res.id}`);
      setGroupName('');
      setGroupPassword('');
      // kasneje: navigacija na dashboard skupine
    } catch (e) {
      console.log(e);
      Alert.alert('Napaka', 'Neuspešno ustvarjanje skupine.');
    }
  }

  async function handleJoinGroup() {
    console.log("USTVARJAM SKUPINO...");
    if (!groupName.trim() || !groupPassword) {
      Alert.alert('Napaka', 'Vnesi ime skupine in geslo.');
      return;
    }
    try {
      const group = await findGroupByName(groupName.trim());
      if (!group) {
        Alert.alert('Napaka', 'Skupina ne obstaja.');
        return;
      }
      await joinGroup(group.id, groupPassword, user);
      router.push(`/group/${group.id}`);
      setGroupName('');
      setGroupPassword('');
      // kasneje: navigacija na dashboard skupine
    } catch (e) {
      console.log(e);
      Alert.alert('Napaka', e.message || 'Neuspešna pridružitev skupini.');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Nalaganje...</Text>
      </View>
    );
  }

  if (!user) {
    console.log("USER:", user);
    // ekran za izbiro uporabniškega imena
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Dobrodošel!</Text>
        <Text style={styles.subtitle}>Najprej si izberi uporabniško ime.</Text>

        <TextInput
          style={styles.input}
          placeholder="Uporabniško ime"
          value={usernameInput}
          onChangeText={setUsernameInput}
        />

        <Button title="Shrani" onPress={handleSaveUsername} />
      </View>
    );
  }

  // glavni ekran s skupinami (zaenkrat samo create/join)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pozdravljen, {user.username}!</Text>
      <Text style={styles.subtitle}>Ustvari ali se pridruži skupini (podjetju).</Text>

      <Text style={styles.sectionTitle}>Ime skupine</Text>
      <TextInput
        style={styles.input}
        placeholder="npr. Naša skupina"
        value={groupName}
        onChangeText={setGroupName}
      />

      <Text style={styles.sectionTitle}>Geslo skupine</Text>
      <TextInput
        style={styles.input}
        placeholder="Geslo"
        secureTextEntry
        value={groupPassword}
        onChangeText={setGroupPassword}
      />

      <View style={styles.buttonRow}>
        <View style={styles.buttonWrapper}>
          <Button title="Ustvari skupino" onPress={handleCreateGroup} color="#2e7d32" />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Pridruži se" onPress={handleJoinGroup} color="#1565c0" />
        </View>
      </View>

      {/* Kasneje: tu bo seznam skupin, katerim pripada user */}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fafafa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1b5e20',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
  },
  sectionTitle: {
    fontSize: 14,
    marginTop: 16,
    marginBottom: 4,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 6,
  },
});

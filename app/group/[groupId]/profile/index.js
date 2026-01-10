import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,     
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { router, useFocusEffect, useGlobalSearchParams } from 'expo-router';

import { getLocalUser } from '../../../../services/userService';
import {
  createGroup,
  findGroupByName,
  joinGroup,
  getUserGroups,
} from '../../../../services/groupService';
import { saveLastGroup } from '../../../../services/groupSessionService';

import { fetchRandomDog } from '../../../../services/dogApiService';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function ProfileScreen() {
  const params = useGlobalSearchParams();
  const activeGroupId = params.groupId 
    ? String(Array.isArray(params.groupId) ? params.groupId[0] : params.groupId)
    : null;

  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);

  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);

  const [groupName, setGroupName] = useState('');
  const [groupPassword, setGroupPassword] = useState('');

  const [error, setError] = useState('');

  const [dogImage, setDogImage] = useState(null);
  const [dogLoading, setDogLoading] = useState(false);


  useFocusEffect(
    useCallback(() => {
      load();
    }, [activeGroupId])
  );

  async function load() {
    const u = await getLocalUser();
    setUser(u);

    const data = await getUserGroups(u.uid);
    setGroups(data);
  }

  async function switchGroup(groupId) {
    // 1. Shranimo ID
    await saveLastGroup(groupId);
    
    router.replace({
      pathname: `/group/[groupId]`,
      params: { groupId: groupId }
    });
  }


  async function handleJoinGroup() {
    setError('');

    if (!groupName.trim() || !groupPassword.trim()) {
      setError('Vnesi ime skupine in geslo.');
      return;
    }

    try {
      const group = await findGroupByName(groupName.trim());
      if (!group) {
        setError('Skupina ne obstaja.');
        return;
      }

      await joinGroup(group.id, groupPassword, user);
      await saveLastGroup(group.id);

      setJoinVisible(false);
      router.replace(`/group/${group.id}`);
    } catch (e) {
      setError(e.message || 'Neuspešna pridružitev.');
    }
  }

  async function handleCreateGroup() {
    setError('');

    if (!groupName.trim() || !groupPassword.trim()) {
      setError('Vnesi ime skupine in geslo.');
      return;
    }

    try {
      const res = await createGroup(groupName.trim(), groupPassword, user);
      await saveLastGroup(res.id);

      setCreateVisible(false);
      setGroupName('');
      setGroupPassword('');
      router.replace(`/group/${res.id}`);
    } catch {
      setError('Skupine ni bilo mogoče ustvariti.');
    }
  }

  function resetForm() {
    setGroupName('');
    setGroupPassword('');
    setError('');
  }

  async function handleDog() {
    try {
      setDogLoading(true);
      const url = await fetchRandomDog();
      setDogImage(url);
    } catch (e) {
      Alert.alert('Napaka', 'Ni bilo mogoče pridobiti slike kužka.');
    } finally {
      setDogLoading(false);
    }
  }


  return (
    <>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Profil</Text>

        {user && (
          <Text style={styles.subtitle}>
            Uporabnik: {user.username}
          </Text>
        )}

        <Text style={styles.section}>Moje skupine</Text>

        <FlatList
          data={groups}
          extraData={activeGroupId}
          keyExtractor={i => i.id}
          renderItem={({ item }) => {
            const isActive = String(item.id) === activeGroupId;

            return (
              <TouchableOpacity
                style={[
                  styles.groupCard,
                  isActive && styles.activeGroup,
                ]}
                onPress={() => switchGroup(item.id)}
              >
                <Text
                  style={[
                    styles.groupName,
                    isActive && styles.activeGroupText,
                  ]}
                >
                  {item.name}
                </Text>

                {isActive && (
                  <Text style={styles.activeBadge}>AKTIVNA</Text>
                )}
              </TouchableOpacity>
            );
          }}

        />

        {dogImage && (
          <Image
            source={{ uri: dogImage }}
            style={styles.dogImage}
          />
        )}

        <TouchableOpacity
          style={styles.dogButton}
          onPress={handleDog}
        >
          <Text style={styles.actionText}>
            {dogLoading ? '🐶 Nalagam...' : '🐶'}
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 16 }}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setCreateVisible(true)}
          >
            <Text style={styles.actionText}>➕ Ustvari novo skupino</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setJoinVisible(true)}
          >
            <Text style={styles.actionText}>🔍 Pridruži se skupini</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      

      <Modal visible={createVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nova skupina</Text>

            <TextInput
              placeholder="Ime skupine"
              value={groupName}
              onChangeText={setGroupName}
              style={styles.input}
            />

            <TextInput
              placeholder="Geslo"
              secureTextEntry
              value={groupPassword}
              onChangeText={setGroupPassword}
              style={styles.input}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  setCreateVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.buttonText}>Prekliči</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleCreateGroup}
              >
                <Text style={styles.buttonText}>Ustvari</Text>
              </TouchableOpacity>
            </View>
            
          </View>
        </View>
      </Modal>

      <Modal visible={joinVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Pridruži se skupini</Text>

            {error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.label}>Ime skupine</Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              style={styles.input}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Geslo</Text>
            <TextInput
              value={groupPassword}
              onChangeText={setGroupPassword}
              style={styles.input}
              secureTextEntry
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => {
                setJoinVisible(false);
                resetForm();}
              }>
                <Text style={styles.primaryText}>Prekliči</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleJoinGroup}
              >
                <Text style={styles.primaryText}>Pridruži se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f2f4f7',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#555',
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  groupCard: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
  },
  groupName: {
    fontSize: 16,
  },
  actionButton: {
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    color: '#1565c0',
    fontWeight: '600',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565c0',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },

  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },

  error: {
    color: '#d32f2f',
    marginBottom: 8,
    fontSize: 14,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  primaryText: {
    fontWeight: 'bold',
    color: '#1565c0',
  },
  activeGroup: {
    borderWidth: 2,
    borderColor: '#1565c0',
    backgroundColor: '#e3f2fd',
  },
  activeGroupText: {
    fontWeight: 'bold',
  },
  activeBadge: {
    marginTop: 4,
    fontSize: 12,
    color: '#1565c0',
    fontWeight: '600',
  },

  dogButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    marginBottom: 12,
  },

  dogButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565c0',
  },
  dogImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 12,
    resizeMode: 'contain',
  },

});
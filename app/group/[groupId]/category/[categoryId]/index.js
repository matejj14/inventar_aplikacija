//zaslon za modele
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { addModel, getModels } from '../../../../../services/modelService';

import { router } from 'expo-router';

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { db } from '../../../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function CategoryModels() {
  const { groupId, categoryId } = useLocalSearchParams();

  const [models, setModels] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modelName, setModelName] = useState('');

  const [hasAssembly, setHasAssembly] = useState(false);

  useFocusEffect(
    useCallback(() => {
        loadModels();
    }, [categoryId])
  );

  async function loadModels() {
    const data = await getModels(groupId, categoryId);
    setModels(data);

    const catRef = doc(db, `groups/${groupId}/categories/${categoryId}`);
    const catSnap = await getDoc(catRef);

    if (catSnap.exists()) {
      const canAssemble = catSnap.data().hasAssembly;
      setHasAssembly(canAssemble);
    }
  }

  async function handleAdd() {
    if (!modelName.trim()) return;
    await addModel(groupId, categoryId, modelName.trim());
    setModelName('');
    setModalVisible(false);
    loadModels();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={models}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
            <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
                router.push(
                `/group/${groupId}/category/${categoryId}/model/${item.id}`
                )
            }
            >
            <View style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              <Text>
                <Text style={styles.modelStatLabel}>Na zalogi: </Text>
                <Text style={styles.stockNumber}>
                  {item.stats?.stock ?? 0}
                </Text>
              </Text>

              <Text>
                <Text style={styles.modelStatLabel}>Ara: </Text>
                <Text style={styles.reservedNumber}>
                  {item.stats?.reserved ?? 0}
                </Text>
              </Text>

              {hasAssembly && (
                <Text>
                  <Text style={styles.modelStatLabel}>Razstavljeni: </Text>
                  <Text style={styles.disassembledNumber}>
                    {item.stats?.disassembled ?? 0}
                  </Text>
                </Text>
              )}
            </View>
            </TouchableOpacity>
        )}
        />

      {/* + gumb */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nov model</Text>
            <TextInput
              placeholder="Ime modela (npr. 122)"
              style={styles.input}
              value={modelName}
              onChangeText={setModelName}
            />
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text>Prekliči</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd}>
                <Text style={{ fontWeight: 'bold' }}>Shrani</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 6, },
  sub: { color: '#555', marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6cb6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { fontSize: 36 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  modelStat: {
    marginTop: 4,
  },

  modelStatLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },

  stockNumber: {
    fontSize: 18,
    color: '#2e7d32',
    fontWeight: 'bold',
  },

  reservedNumber: {
    fontSize: 18,
    color: '#f9a825',
    fontWeight: 'bold',
  },

  disassembledNumber: {
    fontSize: 18,
    color: '#5e5e5eff',
  },
});

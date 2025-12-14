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

export default function CategoryModels() {
  const { groupId, categoryId } = useLocalSearchParams();

  const [models, setModels] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modelName, setModelName] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await getModels(groupId, categoryId);
    setModels(data);
  }

  async function handleAdd() {
    if (!modelName.trim()) return;
    await addModel(groupId, categoryId, modelName.trim());
    setModelName('');
    setModalVisible(false);
    load();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={models}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.sub}>Na zalogi: 0 · Ara: 0</Text>
          </View>
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
  title: { fontSize: 18, fontWeight: 'bold' },
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
});

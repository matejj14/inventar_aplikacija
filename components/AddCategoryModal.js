import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';

export default function AddCategoryModal({ visible, onClose, onSave }) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [hasAssembly, setHasAssembly] = useState(false);

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      brand: brand.trim(),
      hasAssembly,
    });
    setName('');
    setBrand('');
    setHasAssembly(false);
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Nova kategorija</Text>

          <TextInput
            placeholder="Ime kategorije"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            placeholder="Znamka"
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
          />

          <View style={styles.row}>
            <Text>Razstavljeni stroji</Text>
            <Switch value={hasAssembly} onValueChange={setHasAssembly} />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancel}>Prekliči</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.save}>Shrani</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
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
    alignItems: 'center',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  cancel: {
    color: '#666',
    fontSize: 16,
  },
  save: {
    color: '#1565c0',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

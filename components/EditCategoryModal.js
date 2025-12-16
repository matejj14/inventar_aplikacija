import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';

import { pickFromGallery, takePhoto } from './ImagePickerSheet';

export default function EditCategoryModal({
  visible,
  category,
  onClose,
  onSave,
}) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setBrand(category.brand);
      setImage(category.image || null);
    }
  }, [category]);

  async function chooseImage() {
    Alert.alert(
      'Slika kategorije',
      'Izberi vir',
      [
        {
          text: 'Galerija',
          onPress: async () => {
            const uri = await pickFromGallery();
            if (uri) setImage(uri);
          },
        },
        {
          text: 'Kamera',
          onPress: async () => {
            const uri = await takePhoto();
            if (uri) setImage(uri);
          },
        },
        { text: 'Prekliči', style: 'cancel' },
      ]
    );
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Napaka', 'Ime kategorije je obvezno.');
      return;
    }

    onSave({
      name: name.trim(),
      brand: brand.trim(),
      image,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Uredi kategorijo</Text>

          <TouchableOpacity
            style={styles.imageBox}
            onPress={chooseImage}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <Text style={styles.imagePlaceholder}>📷</Text>
            )}
          </TouchableOpacity>

          <TextInput
            placeholder="Ime kategorije"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <TextInput
            placeholder="Znamka"
            value={brand}
            onChangeText={setBrand}
            style={styles.input}
          />

          <View style={styles.row}>
            <TouchableOpacity onPress={onClose}>
              <Text>Prekliči</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSave}>
              <Text style={{ fontWeight: 'bold' }}>Shrani</Text>
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
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  imageBox: {
    height: 120,
    borderRadius: 12,
    backgroundColor: '#e6f2fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imagePlaceholder: {
    fontSize: 36,
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
  },
});

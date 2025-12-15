import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import AddCategoryModal from '../../../components/AddCategoryModal';
import { addCategory, getCategories } from '../../../services/categoryService';

//za slike
import { uploadCategoryImage } from '../../../services/categoryImageService';
import { pickFromGallery, takePhoto } from '../../../components/ImagePickerSheet';
import { Alert, Image } from 'react-native';

//import { Alert } from 'react-native';
import { toggleFavorite, deleteCategory } from '../../../services/categoryService';

import { router } from 'expo-router';

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';


export default function GroupDashboard() {
  const params = useLocalSearchParams();
  const groupId = params?.groupId;

  // STATE
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  // LOAD CATEGORIES
  useFocusEffect(
    useCallback(() => {
      if (groupId) {
        loadCategories();
      }
    }, [groupId])
  );

  async function loadCategories() {
    const data = await getCategories(groupId);

    const sorted = [...data].sort((a, b) => {
      if (a.favorite === b.favorite) return 0;
      return a.favorite ? -1 : 1;
    });

    setCategories(sorted);
  }

  async function handleAddCategory(data) {
    await addCategory(groupId, data);
    setModalVisible(false);
    loadCategories();
  }

  //funkcija za izbiro slike
  async function handleImagePick(category) {
    Alert.alert(
      'Slika kategorije',
      'Izberi vir',
      [
        {
          text: 'Galerija',
          onPress: async () => {
            const uri = await pickFromGallery();
            if (uri) {
              await uploadCategoryImage(groupId, category.id, uri);
              loadCategories();
            }
          },
        },
        {
          text: 'Kamera',
          onPress: async () => {
            const uri = await takePhoto();
            if (uri) {
              await uploadCategoryImage(groupId, category.id, uri);
              loadCategories();
            }
          },
        },
        { text: 'Prekliči', style: 'cancel' },
      ]
    );
  }


  function openMenu(category) {
    Alert.alert(
      category.name,
      'Izberi možnost',
      [
        {
          text: category.favorite ? 'Odstrani iz priljubljenih' : 'Označi kot priljubljeno',
          onPress: async () => {
            await toggleFavorite(groupId, category.id, !category.favorite);
            loadCategories();
          },
        },
        {
          text: 'Uredi',
          onPress: () => {
            Alert.alert('Info', 'Urejanje pride v naslednjem koraku.');
          },
        },
        {
          text: 'Izbriši',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Potrditev',
              'Res želiš izbrisati to kategorijo?',
              [
                { text: 'Prekliči', style: 'cancel' },
                {
                  text: 'Izbriši',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteCategory(groupId, category.id);
                    loadCategories();
                  },
                },
              ]
            );
          },
        },
        { text: 'Prekliči', style: 'cancel' },
      ]
    );
  }


  function renderCategory({ item }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() =>
        router.push(`/group/${groupId}/category/${item.id}`)
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kategorije</Text>

        <TouchableOpacity
          onPress={() => router.push(`/group/${groupId}/log`)}
        >
          <Text style={styles.logButton}>Log</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {/* zgornja vrstica */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {item.favorite ? '⭐ ' : ''}
            {item.name}
          </Text>

          <TouchableOpacity
            onPress={() => openMenu(item)}
          >
            <Text style={styles.menu}>⋮</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.brand}>{item.brand}</Text>

        <View style={styles.cardBody}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageText}>📷</Text>
          </View>

          <View style={styles.stats}>
            {item.hasAssembly ? (
              <>
                <Text>Sestavljeni: {item.stats?.assembled || 0}</Text>
                <Text>Nesestavljeni: {item.stats?.disassembled || 0}</Text>
                <Text>Plačana ara: {item.stats?.reserved || 0}</Text>
              </>
            ) : (
              <>
                <Text>Na zalogi: {item.stats?.stock || 0}</Text>
                <Text>Plačana ara: {item.stats?.reserved || 0}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}


  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* + gumb */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* modal */}
      <AddCategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    padding: 16,
  },
  card: {
    backgroundColor: '#bfe4ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
  },
  menu: {
    fontSize: 22,
    color: '#003366',
  },
  brand: {
    fontSize: 14,
    color: '#003366',
    marginBottom: 12,
  },
  cardBody: {
    flexDirection: 'row',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#e6f2fb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  imageText: {
    fontSize: 28,
  },
  stats: {
    flex: 1,
    justifyContent: 'center',
  },
  stat: {
    fontSize: 14,
    color: '#003366',
  },
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
    elevation: 4,
  },
  fabText: {
    fontSize: 36,
    color: '#003366',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  logButton: {
    fontSize: 16,
    color: '#1565c0',
    fontWeight: '600',
  },

});

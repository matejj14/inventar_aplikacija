import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import AddCategoryModal from '../../../components/AddCategoryModal';
import EditCategoryModal from '../../../components/EditCategoryModal';
import { addCategory, getCategories, updateCategory } from '../../../services/categoryService';

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

  const [editVisible, setEditVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  //state za filtre
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [onlyStock, setOnlyStock] = useState(false);
  const [onlyReserved, setOnlyReserved] = useState(false);

  useEffect(() => {
    setFiltered(applyFilters(categories));
  }, [search, onlyStock, onlyReserved, categories]);


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
    setFiltered(applyFilters(data));
  }

  function applyFilters(data) {
    let result = [...data];

    if (search.trim()) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (onlyStock) {
      result = result.filter(c => (c.stats?.stock || 0) > 0);
    }

    if (onlyReserved) {
      result = result.filter(c => (c.stats?.reserved || 0) > 0);
    }

    return result;
  }

  async function handleAddCategory(data) {
    await addCategory(groupId, data);
    setModalVisible(false);
    loadCategories();
  }

  async function handleEditSave(data) {
    await updateCategory(groupId, editingCategory.id, {
      name: data.name,
      brand: data.brand,
    });

    if (data.image && data.image !== editingCategory.image) {
      await uploadCategoryImage(
        groupId,
        editingCategory.id,
        data.image
      );
    }

    setEditVisible(false);
    setEditingCategory(null);
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
            setEditingCategory(category);
            setEditVisible(true);
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
      activeOpacity={0.85}
      style={styles.card}
      onPress={() =>
        router.push(`/group/${groupId}/category/${item.id}`)
      }
    >
      {/* LEVA STRAN – slika */}
      <View style={styles.imageWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <Text style={styles.imagePlaceholder}>📷</Text>
        )}
      </View>

      {/* DESNA STRAN */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>
              {item.favorite ? '⭐ ' : ''}
              {item.name}
            </Text>
            <Text style={styles.brand}>{item.brand}</Text>
          </View>

          <TouchableOpacity
            onPress={() => openMenu(item)}
            hitSlop={10}
          >
            <Text style={styles.menu}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* STATISTIKA – V STOLPCU */}
        <View style={styles.statsColumn}>
          <Text style={styles.stock}>
            Na zalogi:{' '}
            <Text style={styles.stockNumber}>
              {item.stats?.stock ?? 0}
            </Text>
          </Text>

          <Text style={styles.reserved}>
            Ara:{' '}
            <Text style={styles.reservedNumber}>
              {item.stats?.reserved ?? 0}
            </Text>
          </Text>

          {item.hasAssembly && (
            <Text style={styles.disassembled}>
              Nesestavljeni:{' '}
              {item.stats?.disassembled ?? 0}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}



  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TextInput
          placeholder="Išči kategorijo..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />

        <TouchableOpacity
          style={[styles.filterBtn, onlyStock && styles.active]}
          onPress={() => setOnlyStock(!onlyStock)}
        >
          <Text>Na zalogi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, onlyReserved && styles.active]}
          onPress={() => setOnlyReserved(!onlyReserved)}
        >
          <Text>Ara</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
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
      <EditCategoryModal
        visible={editVisible}
        category={editingCategory}
        onClose={() => {
          setEditVisible(false);
          setEditingCategory(null);
        }}
        onSave={handleEditSave}
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
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
  },

  brand: {
    fontSize: 14,
    color: '#555', // NE odebeljeno
  },
  cardBody: {
    flexDirection: 'row',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  imageWrap: {
    width: '32%',
    aspectRatio: 1,
    backgroundColor: '#e6f2fb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },

  imagePlaceholder: {
    fontSize: 36,
    color: '#003366',
  },
  /*
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#e6f2fb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  */
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

  statsColumn: {
    marginTop: 8,
  },

  stock: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },

  stockNumber: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },

  reserved: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },

  reservedNumber: {
    color: '#f9a825',
    fontWeight: 'bold',
  },

  disassembled: {
    fontSize: 15,
    color: '#757575',
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
  filterRow: {
  marginBottom: 12,
  },
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  filterBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  active: {
    backgroundColor: '#cfe8ff',
  },

});

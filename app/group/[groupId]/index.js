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
import AnchorMenu from '../../../components/AnchorMenu';
import { Alert, Image } from 'react-native';

//import { Alert } from 'react-native';
import { toggleFavorite, deleteCategory } from '../../../services/categoryService';

import { router } from 'expo-router';

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [activeFilter, setActiveFilter] = useState(null);// možne vrednosti: 'stock' | 'reserved' | 'nostock' | null
  const [filtersVisible, setFiltersVisible] = useState(false);


  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    setFiltered(applyFilters(categories));
  }, [search, activeFilter, categories]);


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

    if (activeFilter === 'stock') {
      result = result.filter(c => (c.stats?.stock || 0) > 0);
    }

    if (activeFilter === 'reserved') {
      result = result.filter(c => (c.stats?.reserved || 0) > 0);
    }

    if (activeFilter === 'nostock') {
      result = result.filter(c => (c.stats?.stock || 0) === 0);
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

  function categoryHasItems(category) {
    const stock = category?.stats?.stock ?? 0;
    const reserved = category?.stats?.reserved ?? 0;
    return stock > 0 || reserved > 0;
  }


  function openMenu(category, event) {
    event.target.measureInWindow((x, y, width, height) => {
      setMenuAnchor({
        x: x + width,
        y: y + height,
      });
      setSelectedCategory(category);
      setMenuVisible(true);
    });
  }

  function confirmDelete(category) {
    if (categoryHasItems(category)) {
        Alert.alert(
          'Brisanje ni dovoljeno',
          'Kategorije z zalogo ali aro ni mogoče izbrisati.'
        );
        return;
    }

    Alert.alert(
      'Potrditev brisanja',
      `Res želiš izbrisati kategorijo "${category.name}"?`,
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
      ],
      { cancelable: true }
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
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} />
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
            onPress={(e) => openMenu(item, e)}
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
    <SafeAreaView style={styles.container}>
     <View style={styles.searchRow}>
      <TextInput
        placeholder="Išči kategorijo..."
        placeholderTextColor="#2c2c2c" 
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setFiltersVisible(prev => !prev)}
      >
        <Text style={styles.filterToggleText}>
          Filtri▼
        </Text>
      </TouchableOpacity>
    </View>
    {filtersVisible && (
      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeFilter === 'stock' && styles.active,
          ]}
          onPress={() =>
            setActiveFilter(prev => (prev === 'stock' ? null : 'stock'))
          }
        >
          <Text>Na zalogi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeFilter === 'reserved' && styles.active,
          ]}
          onPress={() =>
            setActiveFilter(prev => (prev === 'reserved' ? null : 'reserved'))
          }
        >
          <Text>Ara</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeFilter === 'nostock' && styles.active,
          ]}
          onPress={() =>
            setActiveFilter(prev => (prev === 'nostock' ? null : 'nostock'))
          }
        >
          <Text>Brez zaloge</Text>
        </TouchableOpacity>
      </View>
    )}

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

    <AnchorMenu
      visible={menuVisible}
      anchor={menuAnchor}
      onClose={() => setMenuVisible(false)}
      items={[
        {
          label: selectedCategory?.favorite
            ? 'Odstrani iz priljubljenih'
            : 'Označi kot priljubljeno',
          onPress: async () => {
            await toggleFavorite(
              groupId,
              selectedCategory.id,
              !selectedCategory.favorite
            );
            loadCategories();
          },
        },
        {
          label: 'Uredi',
          onPress: () => {
            setEditingCategory(selectedCategory);
            setEditVisible(true);
          },
        },
        {
          label: 'Izbriši',
          destructive: true,
          disabled: categoryHasItems(selectedCategory),
          onPress: () => {
            confirmDelete(selectedCategory);
          },
        },
      ]}
    />
    </SafeAreaView>
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
 searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },

  filterToggle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#e6f2fb',
    borderWidth:1,
    borderColor: "rgb(175, 199, 224)",
  },

  filterToggleText: {
    color: '#003366',
    fontWeight: '600',
  },

  filtersRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  filterBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#bbbaba',
  },
  active: {
    backgroundColor: '#cfe8ff',
    borderColor: '#014e9b',
  },

});

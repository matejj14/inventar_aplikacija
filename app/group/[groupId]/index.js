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

export default function GroupDashboard() {
  const params = useLocalSearchParams();
  const groupId = params?.groupId;

  // STATE
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  // LOAD CATEGORIES
  useEffect(() => {
    if (groupId) {
      loadCategories();
    }
  }, [groupId]);

  async function loadCategories() {
    const data = await getCategories(groupId);
    setCategories(data);
  }

  async function handleAddCategory(data) {
    await addCategory(groupId, data);
    setModalVisible(false);
    loadCategories();
  }

  function renderCategory({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <TouchableOpacity>
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
                <Text style={styles.stat}>Sestavljeni: 0</Text>
                <Text style={styles.stat}>Nesestavljeni: 0</Text>
                <Text style={styles.stat}>Plačana ara: 0</Text>
              </>
            ) : (
              <>
                <Text style={styles.stat}>Na zalogi: 0</Text>
                <Text style={styles.stat}>Plačana ara: 0</Text>
              </>
            )}
          </View>
        </View>
      </View>
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
});

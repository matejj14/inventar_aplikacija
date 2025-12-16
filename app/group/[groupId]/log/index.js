import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getLogs } from '../../../../services/logService';

import { undoLog } from '../../../../services/undoService';

export default function LogScreen() {
  const { groupId } = useLocalSearchParams();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await getLogs(groupId);
    setLogs(data);
  }

  function label(log) {
    switch (log.type) {
        case 'ADD_MACHINE':
        return `Dodano: ${log.machineLabel}`;
        case 'RESERVED':
        return `Ara: ${log.machineLabel} (${log.meta?.customerName})`;
        case 'SOLD':
        return `Prodano: ${log.machineLabel}`;
        case 'RETURNED':
        return `Vrnjeno na zalogo: ${log.machineLabel}`;
        case 'UNDO_SOLD':
        return `Razveljavljena prodaja`;
        case 'UNDO_RESERVED':
        return `Razveljavljena ara`;
        default:
        return log.type;
      }
    }

    function canUndo(log) {
        return log.type === 'SOLD' || log.type === 'RESERVED';
    }

    function confirmUndo(log) {
    Alert.alert(
        'Razveljavi spremembo',
        'Ali res želiš razveljaviti to dejanje?',
        [
        { text: 'Prekliči', style: 'cancel' },
        {
            text: 'UNDO',
            style: 'destructive',
            onPress: async () => {
            await undoLog(groupId, log);
            load();
            },
        },
        ]
      );
    }

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(i) => i.id}
       renderItem={({ item }) => (
        <View style={styles.card}>
            <Text style={styles.title}>{label(item)}</Text>
            <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleString()}
            </Text>

            {canUndo(item) && (
            <TouchableOpacity
                style={styles.undoButton}
                onPress={() => confirmUndo(item)}
            >
                <Text style={styles.undoText}>UNDO</Text>
            </TouchableOpacity>
            )}
        </View>
       )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  undoButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  undoText: {
    color: '#1565c0',
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
});

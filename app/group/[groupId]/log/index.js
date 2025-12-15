import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getLogs } from '../../../../services/logService';

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
        default:
        return log.type;
      }
    }

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{label(item)}</Text>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
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
});

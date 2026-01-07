import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useGlobalSearchParams, useFocusEffect } from 'expo-router';

import { getLogs } from '../../../../services/logService';
import { undoLog } from '../../../../services/undoService';
import { getLocalUser } from '../../../../services/userService';

export default function LogScreen() {
  const params = useGlobalSearchParams();

  // 🔑 EDINI pravilen vir resnice
  const groupId = params.groupId
    ? String(Array.isArray(params.groupId) ? params.groupId[0] : params.groupId)
    : null;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [undoLoading, setUndoLoading] = useState(false);

  const [undoModal, setUndoModal] = useState(false);
  const [undoReason, setUndoReason] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const [user, setUser] = useState(null);
  
  const [sections, setSections] = useState([]);


  useEffect(() => {
    getLocalUser().then(setUser);
  }, []);


  const loadLogs = useCallback(async () => {
    if (!groupId) return;

    setLoading(true);
    try {
      const data = await getLogs(groupId);
      const grouped = groupLogsByDate(data || []);
      setSections(grouped);
      
      setLogs(data || []);
    } catch (e) {
      console.error('Napaka pri nalaganju logov:', e);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // vedno znova, ko:
  // - se zamenja skupina
  // - se vrneš na tab Log
  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs])
  );

  function label(log) {
    switch (log.type) {
      case 'ADD_MACHINE':
        return `DODAN ${log.modelName ?? 'Model'} – ${log.machineLabel}`;
      case 'RESERVED':
        return `ARA: ${log.meta?.customerName} - ${log.modelName ?? 'Model'} – ${log.machineLabel}`;
      case 'SOLD':
        return `PRODANO - ${log.modelName ?? 'Model'} – ${log.machineLabel}`;
      case 'RETURNED':
        return `Vrnjeno na zalogo: ${log.machineLabel}`;
      case 'UNDO_SOLD':
        return `NAZAJ NA ZALOGI - ${log.modelName ?? 'Model'} – ${log.machineLabel} ${log.reason ? ` (${log.reason})` : ''}`;
      case 'UNDO_RESERVED':
        return `RAZVELJAVLJENA ARA - ${log.modelName ?? 'Model'} - ${log.machineLabel} ${log.reason ? ` (${log.reason})` : ''}`;
      case 'DELETE_MACHINE':
        return `IZBRISAN - ${log.modelName} - ${log.machineLabel}`;
      case 'SESTAVLJEN':
        return `SESTAVLJEN - ${log.modelName} - ${log.machineLabel}`;    
      case 'RAZSTAVLJEN':
        return `RAZSTAVLJEN - ${log.modelName} - ${log.machineLabel}`;  
      default:
        return log.type;
    }
  }

  function canUndo(log) {
    return log.type === 'SOLD' || log.type === 'RESERVED';
  }


  function confirmUndo(log) {
    setSelectedLog(log);
    setUndoReason('');
    setUndoModal(true);
  } 

function groupLogsByDate(logs) {
  const map = {};

  logs.forEach(log => {
    const dateKey = new Date(log.createdAt).toLocaleDateString('sl-SI');

    if (!map[dateKey]) {
      map[dateKey] = [];
    }
    map[dateKey].push(log);
  });

  return Object.keys(map).map(date => ({
    date,
    data: map[date],
  }));
}

return (
    <>
      <View style={styles.container}>
        <FlatList
          data={sections}
          keyExtractor={(item) => item.date}
          refreshing={loading}
          onRefresh={loadLogs}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {loading ? 'Nalagam…' : 'Ni logov za to skupino.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.sectionWrapper}>
              {/* ===== DATUM ===== */}
              <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>{item.date}</Text>
              </View>

              {/* ===== LOGI ZA TA DATUM ===== */}
              {item.data.map(log => (
                <View
                  key={log.id}   // ⬅️ TO MANJKA
                  style={[
                    styles.card,
                    log.type === 'DELETE_MACHINE' && { backgroundColor: '#ffebee' },
                  ]}
                >
                  <Text style={styles.title}>{label(log)}</Text>

                  <Text style={styles.meta}>
                    {new Date(log.createdAt).toLocaleTimeString('sl-SI', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {log.username ? ` · ${log.username}` : ''}
                  </Text>

                  {canUndo(log) && (
                    <TouchableOpacity
                      style={styles.undoButton}
                      onPress={() => confirmUndo(log)}
                    >
                      <Text style={styles.undoText}>UNDO</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        />
      </View>

      {/* ===== UNDO MODAL ===== */}
      <Modal visible={undoModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Razlog za vrnitev</Text>

            <TextInput
              value={undoReason}
              onChangeText={setUndoReason}
              placeholder="Npr. preklic nakupa"
              style={styles.input}
              multiline
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => setUndoModal(false)}>
                <Text>Prekliči</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={undoLoading}
                onPress={async () => {
                  if (undoLoading) return; // ⬅️ TUKAJ

                  setUndoLoading(true);

                  try {
                    await undoLog(
                      groupId,
                      selectedLog,
                      undoReason?.trim() || null,
                      user
                    );

                    setUndoModal(false);
                    setUndoReason('');
                    setSelectedLog(null);

                    loadLogs();
                  } finally {
                    setUndoLoading(false);
                  }
                }}
              >
                <Text style={{ fontWeight: 'bold' }}>
                  {undoLoading ? 'Shranjujem…' : 'Potrdi'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  meta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sectionWrapper: {
    marginBottom: 16,
  },
  dateHeader: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#bbb',
    paddingVertical: 6,
    marginBottom: 6,
    backgroundColor: '#f5f5f5',
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
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
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#777',
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dateHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderColor: '#bbb',
    marginTop: 16,
  },

  dateHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
});

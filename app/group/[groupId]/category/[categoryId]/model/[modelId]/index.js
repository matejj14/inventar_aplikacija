import React, { useEffect, useState } from 'react';
import {
  Alert,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Switch,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { addMachine, getMachines, updateMachineStatus } from '../../../../../../../services/machineService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../../../firebaseConfig';

export default function ModelMachines() {
  const { groupId, categoryId, modelId } = useLocalSearchParams();

  const [machines, setMachines] = useState([]);
  const [hasAssembly, setHasAssembly] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [reserveModal, setReserveModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);

  const [serial, setSerial] = useState('');
  const [year, setYear] = useState('');
  const [notes, setNotes] = useState('');

  const [assembled, setAssembled] = useState(true);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    load();
  }, [groupId, categoryId, modelId]);

  async function load() {
    const catRef = doc(db, `groups/${groupId}/categories/${categoryId}`);
    const catSnap = await getDoc(catRef);

    if (catSnap.exists()) {
      const canAssemble = catSnap.data().hasAssembly;
      setHasAssembly(canAssemble);
      setAssembled(!canAssemble); // če so razstavljeni → false
    }

    const data = await getMachines(groupId, categoryId, modelId);
    setMachines(data);
  }

  async function handleAdd() {
    await addMachine(groupId, categoryId, modelId, {
      serialNumber: serial || null,
      year,
      notes,
      status: 'stock',
      assembled,
    });

    setSerial('');
    setYear('');
    setNotes('');
    setModalVisible(false);
    load();
  }

 function statusLabel(status) {
    if (status === 'stock') return 'Na zalogi';
    if (status === 'reserved') return 'Plačana ara';
    if (status === 'sold') return 'Prodano';
    return status;
    }

    function openStatusMenu(machine) {
        Alert.alert(
            'Spremeni status',
            'Izberi novo stanje',
            [
            {
                text: 'Na zalogi',
                onPress: async () => {
                await updateMachineStatus(
                    groupId,
                    categoryId,
                    modelId,
                    machine.id,
                    {
                    status: 'stock',
                    customerName: null,
                    customerPhone: null,
                    reservedAt: null,
                    }
                );
                load();
                },
            },
            {
                text: 'Plačana ara',
                onPress: () => openReserveModal(machine),
            },
            {
                text: 'Prodano',
                onPress: async () => {
                await updateMachineStatus(
                    groupId,
                    categoryId,
                    modelId,
                    machine.id,
                    { status: 'sold' }
                );
                load();
                },
            },
            { text: 'Prekliči', style: 'cancel' },
            ]
        );
    }


   async function updateStatus(machineId, newStatus) {
    await updateMachineStatus(
        groupId,
        categoryId,
        modelId,
        machineId,
        { status: newStatus }
    );
    load();
    }

    function openReserveModal(machine) {
        setSelectedMachine(machine);
        setCustomerName('');
        setCustomerPhone('');
        setReserveModal(true);
    }



  return (
    <View style={styles.container}>
       <FlatList
            data={machines}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
            <View style={styles.card}>
                <Text style={styles.title}>
                {item.serialNumber || 'Brez serijske'}
                </Text>

                <Text>Letnik: {item.year}</Text>

                {item.notes ? <Text>Opombe: {item.notes}</Text> : null}

                <Text>Status: {statusLabel(item.status)}</Text>

                {hasAssembly && (
                <Text>
                    {item.assembled ? 'Sestavljen' : 'Razstavljen'}
                </Text>
                )}

                {item.status === 'reserved' && (
                <>
                    <Text>Kupec: {item.customerName}</Text>
                    <Text>
                    Datum are:{' '}
                    {item.reservedAt
                        ? new Date(item.reservedAt).toLocaleDateString()
                        : '—'}
                    </Text>
                </>
                )}

                <TouchableOpacity
                style={styles.statusButton}
                onPress={() => openStatusMenu(item)}
                >
                <Text style={styles.statusButtonText}>
                    Spremeni status
                </Text>
                </TouchableOpacity>
            </View>
            )}
        />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nov stroj</Text>

            <TextInput
              placeholder="Serijska številka (opcijsko)"
              value={serial}
              onChangeText={setSerial}
              style={styles.input}
            />

            <TextInput
              placeholder="Letnik"
              value={year}
              onChangeText={setYear}
              style={styles.input}
              keyboardType="numeric"
            />

            <TextInput
              placeholder="Opombe"
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
            />

            {hasAssembly && (
              <View style={styles.row}>
                <Text>Razstavljen</Text>
                <Switch
                  value={!assembled}
                  onValueChange={(v) => setAssembled(!v)}
                />
              </View>
            )}

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

      <Modal visible={reserveModal} transparent animationType="slide">
        <View style={styles.overlay}>
            <View style={styles.modal}>
            <Text style={styles.modalTitle}>Plačana ara</Text>

            <TextInput
                placeholder="Ime kupca"
                value={customerName}
                onChangeText={setCustomerName}
                style={styles.input}
            />

            <TextInput
                placeholder="Telefon (opcijsko)"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                style={styles.input}
                keyboardType="phone-pad"
            />

            <View style={styles.row}>
                <TouchableOpacity onPress={() => setReserveModal(false)}>
                <Text>Prekliči</Text>
                </TouchableOpacity>

                <TouchableOpacity
                onPress={async () => {
                    await updateMachineStatus(
                    groupId,
                    categoryId,
                    modelId,
                    selectedMachine.id,
                    {
                        status: 'reserved',
                        customerName,
                        customerPhone,
                        reservedAt: Date.now(),
                    }
                    );
                    setReserveModal(false);
                    load();
                }}
                >
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
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f2f4f7',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  fabText: {
    fontSize: 36,
    color: '#003366',
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
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    },

    statusButtonText: {
    color: '#fff',
    fontSize: 16,
    },
});

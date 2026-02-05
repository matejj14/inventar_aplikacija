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
import { addMachine, getMachines, updateMachineStatus, deleteMachine } from '../../../../../../../services/machineService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../../../firebaseConfig';

import { recalcModelStats } from '../../../../../../../services/modelService';
import { recalcCategoryStats } from '../../../../../../../services/categoryService';

import { addLog } from '../../../../../../../services/logService';
import { getLocalUser } from '../../../../../../../services/userService';

import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnchorMenu from '../../../../../../../components/AnchorMenu';



function Notes({ text }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const isShort = text.length <= 120;

  return (
    <View style={{ marginVertical: 8, }}>
      <Text style={styles.textBase} numberOfLines={expanded || isShort ? undefined : 2}>
        <Text style={styles.label}>Opombe: </Text>
        {text}
      </Text>

      {!isShort && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={{ color: '#1565c0', marginTop: 2, marginBottom: 2, }}>
            {expanded ? 'Pokaži manj' : 'Pokaži več'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}





export default function ModelMachines() {
  const params = useLocalSearchParams();
  const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId;
  const categoryId = Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId;
  const modelId = Array.isArray(params.modelId) ? params.modelId[0] : params.modelId;

  const [user, setUser] = useState(null);

  const [modelName, setModelName] = useState(null);

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

  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editReservedAt, setEditReservedAt] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editMachine, setEditMachine] = useState(null);
  const [editAssembled, setEditAssembled] = useState(false);

  const [editSerial, setEditSerial] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editNotes, setEditNotes] = useState('');

  //meni pri treh pikicah
  const [machineMenuVisible, setMachineMenuVisible] = useState(false);
  const [machineMenuAnchor, setMachineMenuAnchor] = useState({ x: 0, y: 0 });
  const [menuMachine, setMenuMachine] = useState(null);

  const visibleMachines = machines.filter(
    m => m.status !== 'sold'
  );  

  useEffect(() => {
    if (!groupId || !categoryId || !modelId) return;
    load();
  }, [groupId, categoryId, modelId]);

  async function load() {
    try {
      const u = await getLocalUser();
      setUser(u);

      const catRef = doc(db, `groups/${groupId}/categories/${categoryId}`);
      const catSnap = await getDoc(catRef);

      if (catSnap.exists()) {
        const canAssemble = catSnap.data().hasAssembly;
        setHasAssembly(canAssemble);
        setAssembled(!canAssemble);
      }

      const modelRef = doc(
        db,
        `groups/${groupId}/categories/${categoryId}/models/${modelId}`
      );

      const modelSnap = await getDoc(modelRef);
      if (modelSnap.exists()) {
        setModelName(modelSnap.data().name);
      }

      const data = await getMachines(groupId, categoryId, modelId);
      setMachines(data);
    } catch (e) {
      console.error('NAPAKA PRI LOAD:', e);
      Alert.alert('Napaka', 'Pri nalaganju strojev je prišlo do napake.');
    }
  }

 async function handleAdd() {
    await addMachine(groupId, categoryId, modelId, {
        serialNumber: serial || null,
        year,
        notes,
        status: 'stock',
        assembled,
    });
    await recalcModelStats(groupId, categoryId, modelId);
    await recalcCategoryStats(groupId, categoryId);

    await addLog(groupId, {
        type: 'ADD_MACHINE',
        machineLabel: serial || 'Brez serijske',
        categoryId,
        modelId,
        modelName,
        username: user?.username,
        userId: user?.uid,
    });

    setSerial('');
    setYear('');
    setNotes('');
    setModalVisible(false);
    load();
  }

  //funkcija za odpiranje menija strojev (3 pikice)
  function openMachineMenu(machine, event) {
    event.target.measureInWindow((x, y, width, height) => {
      setMachineMenuAnchor({
        x: x + width,
        y: y + height,
      });
      setMenuMachine(machine);
      setMachineMenuVisible(true);
    });
  }

  function openEditMachine(machine) {
    setEditMachine(machine);
    setEditSerial(machine.serialNumber || '');
    setEditYear(machine.year || '');
    setEditNotes(machine.notes || '');
    setEditAssembled(!!machine.assembled);

    /*pri ari*/
    setEditCustomerName(machine.customerName || '');
    setEditCustomerPhone(machine.customerPhone || '');
    setEditReservedAt(machine.reservedAt || Date.now());

    setEditModal(true);
  }

  function confirmDeleteMachine(machine) {
    Alert.alert(
      'Izbriši stroj',
      `Ali res želiš izbrisati stroj:\n${machine.serialNumber || 'Brez serijske'}?\n\nTega dejanja ni mogoče razveljaviti.`,
      [
        { text: 'Prekliči', style: 'cancel' },
        {
          text: 'Izbriši',
          style: 'destructive',
          onPress: async () => {
            if (machine.status === 'sold') {
              Alert.alert(
                'Ni dovoljeno',
                'Prodanega stroja ni mogoče izbrisati.'
              );
              return;
            }

            await deleteMachine(groupId, categoryId, modelId, machine.id);

            await addLog(groupId, {
              type: 'DELETE_MACHINE',
              machineId: machine.id,
              machineLabel: machine.serialNumber || 'Brez serijske',
              categoryId,
              modelId,
              modelName,
              userId: user.uid,
              username: user.username,
            });

            await recalcModelStats(groupId, categoryId, modelId);
            await recalcCategoryStats(groupId, categoryId);

            load();
          },
        },
      ]
    );
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
                  //Če je že na zalogi se ne zgodi nič
                  if (machine.status === 'stock') {
                    return;
                  }

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

                  await recalcModelStats(groupId, categoryId, modelId);
                  await recalcCategoryStats(groupId, categoryId);

                  await addLog(groupId, {
                  type: 'RETURNED',
                  machineId: machine.id,
                  machineLabel: machine.serialNumber || 'Brez serijske',
                  categoryId,
                  modelId,
                  modelName,
                  username: user?.username,
                  userId: user?.uid,
                  });

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

                  await recalcModelStats(groupId, categoryId, modelId);
                  await recalcCategoryStats(groupId, categoryId);

                  await addLog(groupId, {
                  type: 'SOLD',
                  machineId: machine.id,
                  machineLabel: machine.serialNumber || 'Brez serijske',
                  categoryId,
                  modelId,
                  modelName,
                  username: user?.username,
                  userId: user?.uid,
                  });

                  load();
              },
          },
          { text: 'Prekliči', style: 'cancel' },
          ]
      );
  }


  function openReserveModal(machine) {
      setSelectedMachine(machine);
      setCustomerName(machine.customerName || '');
      setCustomerPhone(machine.customerPhone || '');
      setReserveModal(true);
  }

  /*function openMachineMenu(machine) {
    Alert.alert(
      'Možnosti',
      machine.serialNumber || 'Stroj',
      [
        {
          text: 'Uredi',
          onPress: () => openEditMachine(machine),
        },
        {
          text: 'Spremeni status',
          onPress: () => openStatusMenu(machine),
        },
        {
          text: 'Izbriši stroj',
          style: 'destructive',
          onPress: () => confirmDeleteMachine(machine),
        },
        {
          text: 'Prekliči',
          style: 'cancel',
        },
      ]
    );
  }
*/


  return (
    <SafeAreaView style={styles.container}>
       <FlatList
           data={visibleMachines}
           keyExtractor={(i) => i.id}
           renderItem={({ item }) => (
           <View
            key={item.id}
            style={[
              styles.card,
              { borderLeftColor: item.status === 'reserved' ? '#f9a825' : '#2e7d32' },
            ]}
          >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text
                  style={[
                    styles.title,
                    item.status === 'stock' && styles.stockText,
                    item.status === 'reserved' && styles.reservedText,
                  ]}
                >
                  {item.serialNumber || 'Brez serijske'}
                </Text>

                <TouchableOpacity
                  onPress={(e) => openMachineMenu(item, e)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.moreButton}
                >
                  <Text style={styles.moreText}>⋮</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.textBase}>
                <Text style={styles.label}>Letnik:</Text> {item.year}
              </Text>

              <Notes text={item.notes} />

              <Text style={styles.textBase}>
                <Text style={styles.label}>Status:</Text> {statusLabel(item.status)}
              </Text>

              {hasAssembly && (
                <Text style={styles.textBase}>
                  <Text style={styles.label}>Stanje:</Text>{' '}
                  {item.assembled ? 'Sestavljen' : 'Razstavljen'}
                </Text>
              )}

              {item.status === 'reserved' && (
                <>
                  <Text style={styles.textBase}>
                    <Text style={styles.label}>Kupec: </Text>
                    {item.customerName}
                  </Text>
                  
                  <Text style={styles.textBase}>
                    <Text style={styles.label}>Telefon: </Text>
                    {item.customerPhone || '/'}
                  </Text>

                  <Text style={styles.textBase}>
                    <Text style={styles.label}>Datum are:</Text>{' '}
                    {item.reservedAt
                      ? new Date(item.reservedAt).toLocaleDateString()
                      : '—'}
                  </Text>
                </>
              )}
            </View>
          )}

        />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
      

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nov stroj</Text>

            <TextInput
              placeholder="Serijska številka"
              placeholderTextColor="#6e6e6e" 
              value={serial}
              onChangeText={setSerial}
              style={styles.input}
            />

            <TextInput
              placeholder="Letnik"
              placeholderTextColor="#6e6e6e" 
              value={year}
              onChangeText={setYear}
              style={styles.input}
              keyboardType="numeric"
            />

            <TextInput
              placeholder="Opombe"
              placeholderTextColor="#6e6e6e" 
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
                placeholderTextColor="#6e6e6e" 
                value={customerName}
                onChangeText={setCustomerName}
                style={styles.input}
            />

            <TextInput
                placeholder="Telefon (opcijsko)"
                placeholderTextColor="#6e6e6e" 
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

                    await recalcModelStats(groupId, categoryId, modelId);
                    await recalcCategoryStats(groupId, categoryId);

                    await addLog(groupId, {
                      type: 'RESERVED',
                      machineId: selectedMachine.id,
                      machineLabel: selectedMachine.serialNumber || 'Brez serijske',
                      categoryId,
                      modelId,
                      modelName,
                      meta: {
                          customerName,
                      },
                      username: user?.username,
                      userId: user?.uid,
                    });

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

        <Modal visible={editModal} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Uredi stroj</Text>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Serijska št:</Text>
                <TextInput
                  value={editSerial}
                  onChangeText={setEditSerial}
                  style={styles.editInputInline}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Letnik:</Text>
                <TextInput
                  value={editYear}
                  onChangeText={setEditYear}
                  keyboardType="numeric"
                  style={styles.editInputInline}
                />
              </View>

              {editMachine?.status === 'reserved' && (
                <>
                  {/* KUPEC */}
                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Kupec:</Text>
                    <TextInput
                      value={editCustomerName}
                      onChangeText={setEditCustomerName}
                      style={styles.editInputInline}
                    />
                  </View>

                  {/* TELEFON */}
                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Telefon:</Text>
                    <TextInput
                      value={editCustomerPhone}
                      onChangeText={setEditCustomerPhone}
                      keyboardType="phone-pad"
                      style={styles.editInputInline}
                    />
                  </View>

                   {/* DATUM ARE */}
                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Datum are:</Text>

                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.dateText}>
                        {editReservedAt
                          ? new Date(editReservedAt).toLocaleDateString('sl-SI')
                          : '—'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}


              {hasAssembly && (
                <View style={styles.row}>
                  <Text style={styles.editLabel}>{editAssembled ? 'Sestavljen' : 'Razstavljen'}</Text>
                  <Switch
                    value={editAssembled}
                    onValueChange={setEditAssembled}
                  />
                </View>
              )}

              <TextInput
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Opombe"
                placeholderTextColor="#6e6e6e" 
                multiline
                style={[styles.input, { minHeight: 80, marginBottom: 4, }]}
              />


              <View style={styles.row}>
                <TouchableOpacity onPress={() => setEditModal(false)}>
                  <Text>Prekliči</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    await updateMachineStatus(
                      groupId,
                      categoryId,
                      modelId,
                      editMachine.id,
                      {
                        serialNumber: editSerial || null,
                        year: editYear,
                        notes: editNotes,
                        ...(hasAssembly && { assembled: editAssembled }),

                        ...(editMachine.status === 'reserved' && {
                          customerName: editCustomerName || null,
                          customerPhone: editCustomerPhone || null,
                          reservedAt: editReservedAt,
                        }),
                      }
                    );

                    if (hasAssembly && editAssembled !== editMachine.assembled) {
                      await addLog(groupId, {
                        type: editAssembled ? 'SESTAVLJEN' : 'RAZSTAVLJEN',
                        machineId: editMachine.id,
                        machineLabel:
                          editSerial || editMachine.serialNumber || 'Brez serijske',
                        categoryId,
                        modelId,
                        modelName,
                        userId: user.uid,
                        username: user.username,
                      });
                    }

                    await recalcModelStats(groupId, categoryId, modelId);
                    recalcCategoryStats(groupId, categoryId);
                    setEditModal(false);
                    load();
                  }}
                >
                  <Text style={{ fontWeight: 'bold' }}>Shrani</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(editReservedAt || Date.now())}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);

              if (selectedDate) {
                setEditReservedAt(selectedDate.getTime());
              }
            }}
          />
        )}

      <AnchorMenu
        visible={machineMenuVisible}
        anchor={machineMenuAnchor}
        onClose={() => setMachineMenuVisible(false)}
        items={[
          {
            label: 'Uredi',
            onPress: () => openEditMachine(menuMachine),
          },
          {
            label: 'Spremeni status',
            onPress: () => openStatusMenu(menuMachine),
          },
          {
            label: 'Izbriši stroj',
            destructive: true,
            onPress: () => confirmDeleteMachine(menuMachine),
          },
        ]}
      />


    </SafeAreaView>
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
    borderLeftWidth: 4,
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
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  editLabel: {
    width: 90,
    fontWeight: '500',
    fontSize: 16,
    color: '#1a1a1a',
  },

  editInputInline: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    paddingVertical: 4,
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

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginVertical: 4,
  },
  textBase: {
    fontSize: 16,
    color: '#222',
  },
  dateInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 6,
  },

  dateText: {
    fontSize: 16,
    color: '#000',
  },

  moreButton: {  //3 pikice za urejanje
    padding: 6,
    borderRadius: 20,
  },
  moreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  stockText: {
    color: '#2e7d32', // zelena
  },

  reservedText: {
    color: '#f9a825', // rumena
  },
});

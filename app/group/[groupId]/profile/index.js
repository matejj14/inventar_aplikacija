import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getLocalUser } from '../../../../services/userService';
import { clearLastGroup } from '../../../../services/groupSessionService';
import { useEffect, useState } from 'react';

export default function ProfileScreen() {
  const { groupId } = useLocalSearchParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await getLocalUser();
      setUser(u);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Uporabnik</Text>

      {user && (
        <>
          <Text style={styles.label}>Uporabniško ime</Text>
          <Text style={styles.value}>{user.username}</Text>
        </>
      )}

      <Text style={styles.label}>Trenutna skupina</Text>
      <Text style={styles.value}>{groupId}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={async () => {
          await clearLastGroup();
          router.replace('/');
        }}
      >
        <Text style={styles.buttonText}>Zamenjaj skupino</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f2f4f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    marginTop: 32,
    backgroundColor: '#1565c0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

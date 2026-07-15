/*
import { Tabs, useLocalSearchParams } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function GroupLayout() {
  const { groupId } = useLocalSearchParams();
  const currentGroupId = Array.isArray(groupId) ? groupId[0] : groupId;

  return (
    <Tabs
      key={currentGroupId}
      screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1565c0' }}
    >
      <Tabs.Screen name="index" options={{ title: 'Domov' }} />
      <Tabs.Screen name="log" options={{ title: 'Log' }} /> 
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="category" options={{ href: null }} />
    </Tabs>
  );
}
  */

import { Tabs, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function GroupLayout() {
  const { groupId } = useLocalSearchParams();
  const currentGroupId = Array.isArray(groupId) ? groupId[0] : groupId;

  return (
    <Tabs
      key={currentGroupId}
      screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1565c0' }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Domov',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="category" options={{ href: null }} />
    </Tabs>
  );
}
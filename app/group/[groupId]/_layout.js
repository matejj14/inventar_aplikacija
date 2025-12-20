import { Tabs } from 'expo-router';

export default function GroupLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Domov' }}
      />
      <Tabs.Screen
        name="log"
        options={{ title: 'Log' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil' }}
      />

      {/* skrij vse ostalo */}
      <Tabs.Screen name="category" options={{ href: null }} />
    </Tabs>
  );
}

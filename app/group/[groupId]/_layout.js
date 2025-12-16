import { Tabs } from 'expo-router';

export default function GroupLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1565c0',
      }}
    >
      {/* DOMOV */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Domov',
          tabBarLabel: 'Domov',
        }}
      />

      {/* LOG */}
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarLabel: 'Log',
        }}
      />

      {/* PROFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
        }}
      />

      {/* 🔴 VSE OSTALO SKRIJ */}
      <Tabs.Screen
        name="category"
        options={{ href: null }}
      />
    </Tabs>
  );
}

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
import db from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

function BadgeIcon({ name, color, count }: { name: any; color: string; count?: number }) {
  return (
    <View>
      <Ionicons name={name} size={24} color={color} />
      {count != null && count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const [expiringCount, setExpiringSoon] = useState(0);

  const loadExpiring = useCallback(() => {
    const result = db.getAllSync(
      `SELECT COUNT(*) as count FROM pasos 
       WHERE status != 'done' AND fecha_fin != '' 
       AND fecha_fin <= date('now', '+2 days')`
    ) as any[];
    setExpiringSoon(result[0]?.count || 0);
  }, []);

  useFocusEffect(loadExpiring);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7BAE7F',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#F4F1EA',
          borderTopColor: '#E8E3D9',
        },
        headerStyle: { backgroundColor: '#F4F1EA' },
        headerTintColor: '#3D5A3E',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tareas"
        options={{
          title: 'Tareas',
          tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="proyectos"
        options={{
          title: 'Proyectos',
          tabBarIcon: ({ color }) => <BadgeIcon name="folder" color={color} count={expiringCount} />,
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="papelera"
        options={{
          title: 'Papelera',
          tabBarIcon: ({ color }) => <Ionicons name="trash" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
});
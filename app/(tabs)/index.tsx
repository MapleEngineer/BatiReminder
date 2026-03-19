import db from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function InicioScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({ done: 0, in_progress: 0, pendiente: 0 });
  const [upcoming, setUpcoming] = useState<any[]>([]);

  const loadData = useCallback(() => {
    const all = db.getAllSync(`SELECT status FROM events WHERE deleted = 0`);
    const done = all.filter((t: any) => t.status === 'done').length;
    const in_progress = all.filter((t: any) => t.status === 'in_progress').length;
    const pendiente = all.filter((t: any) => t.status === 'pendiente').length;
    setStats({ done, in_progress, pendiente });

    const next = db.getAllSync(`
      SELECT titulo, categoria, importance, fecha 
      FROM events 
      WHERE done = 0 AND deleted = 0 
      ORDER BY fecha ASC 
      LIMIT 5
    `);
    setUpcoming(next);
  }, []);

  useFocusEffect(loadData);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Image
        source={{ uri: 'https://i.redd.it/y8djj6h6l8041.gif' }}
        style={styles.headerGif}
        resizeMode="cover"
      />

      <Text style={styles.title}>🦇 Reminders</Text>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#A5CB90' }]}>
          <Text style={styles.statNumber}>{stats.done}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFE5A0' }]}>
          <Text style={styles.statNumber}>{stats.in_progress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFB3C6' }]}>
          <Text style={styles.statNumber}>{stats.pendiente}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Proximas tareas</Text>
        {upcoming.length === 0 ? (
          <Text style={styles.empty}>No hay tareas pendientes!</Text>
        ) : (
          upcoming.map((task: any, i: number) => (
            <View key={i} style={styles.taskRow}>
              <View style={styles.taskDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle}>{task.titulo}</Text>
                <Text style={styles.taskMeta}>{task.categoria} · {task.importance} · {task.fecha}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acciones rapidas</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/tareas')}>
            <Ionicons name="add-circle" size={28} color="#7BAE7F" />
            <Text style={styles.actionLabel}>Nueva tarea</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/proyectos')}>
            <Ionicons name="folder-open" size={28} color="#7BAE7F" />
            <Text style={styles.actionLabel}>Proyectos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/calendario')}>
            <Ionicons name="calendar" size={28} color="#7BAE7F" />
            <Text style={styles.actionLabel}>Calendario</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F1EA' },
  content: { paddingBottom: 40 },
  headerGif: { width: '100%', height: 180, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#3D5A3E', marginBottom: 16, paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16, paddingHorizontal: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#3D5A3E' },
  statLabel: { fontSize: 10, color: '#3D5A3E', marginTop: 2, textAlign: 'center' },
  card: { backgroundColor: '#DFF0D8', borderRadius: 14, padding: 16, marginBottom: 16, marginHorizontal: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#3D5A3E', marginBottom: 12 },
  empty: { color: '#888', fontStyle: 'italic' },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  taskDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7BAE7F', marginTop: 5 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#3D5A3E' },
  taskMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionLabel: { fontSize: 12, color: '#3D5A3E', fontWeight: '500' },
});
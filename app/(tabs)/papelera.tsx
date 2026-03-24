import { getDeletedEvents, updateEvent } from '@/lib/api';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PapeleraScreen() {
  const [tareas, setTareas] = useState<any[]>([]);

  const loadTareas = useCallback(() => {
    getDeletedEvents().then((data: any[]) => setTareas(data)).catch(console.error);
  }, []);

  useFocusEffect(loadTareas);

  const restore = (id: string) => {
    updateEvent(id, { deleted: 0 }).then(() => loadTareas()).catch(console.error);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Papelera</Text>
        </View>
        {tareas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🗑️</Text>
            <Text style={styles.empty}>La papelera esta vacia</Text>
          </View>
        ) : (
          tareas.map((task: any) => (
            <View key={task._id} style={styles.taskCard}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.titulo}</Text>
                <Text style={styles.taskMeta}>{task.categoria} · {task.importance}</Text>
                <Text style={styles.taskFecha}>{task.fecha}</Text>
              </View>
              <View style={styles.taskActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#A5CB90' }]} onPress={() => restore(task._id)}>
                  <Text style={styles.actionBtnText}>Restaurar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F1EA' },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#3D5A3E' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  empty: { color: '#888', fontStyle: 'italic', fontSize: 16 },
  taskCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  taskInfo: { marginBottom: 10 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: '#999', textDecorationLine: 'line-through' },
  taskMeta: { fontSize: 12, color: '#aaa', marginTop: 2 },
  taskFecha: { fontSize: 12, color: '#aaa', marginTop: 2 },
  taskActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#3D5A3E' },
});
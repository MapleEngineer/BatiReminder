import db from '@/lib/database';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PapeleraScreen() {
  const [tareas, setTareas] = useState<any[]>([]);

  const loadTareas = useCallback(() => {
    const data = db.getAllSync(
      `SELECT * FROM events WHERE deleted = 1 ORDER BY fecha ASC`
    );
    setTareas(data as any[]);
  }, []);

  useFocusEffect(loadTareas);

  const restore = (id: number) => {
    db.runSync('UPDATE events SET deleted = 0 WHERE id = ?', [id]);
    loadTareas();
  };

  const deletePermanent = (id: number, titulo: string) => {
    Alert.alert('Eliminar permanentemente', `¿Eliminar "${titulo}" para siempre?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => {
          db.runSync('DELETE FROM events WHERE id = ?', [id]);
          loadTareas();
        }
      }
    ]);
  };

  const clearAll = () => {
    Alert.alert('Vaciar papelera', '¿Eliminar todas las tareas borradas permanentemente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Vaciar', style: 'destructive',
        onPress: () => {
          db.runSync('DELETE FROM events WHERE deleted = 1');
          loadTareas();
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Papelera</Text>
          {tareas.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <Text style={styles.clearBtnText}>Vaciar todo</Text>
            </TouchableOpacity>
          )}
        </View>

        {tareas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🗑️</Text>
            <Text style={styles.empty}>La papelera esta vacia</Text>
          </View>
        ) : (
          tareas.map((task: any) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.titulo}</Text>
                <Text style={styles.taskMeta}>{task.categoria} · {task.importance}</Text>
                <Text style={styles.taskFecha}>{task.fecha}</Text>
              </View>
              <View style={styles.taskActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#A5CB90' }]} onPress={() => restore(task.id)}>
                  <Text style={styles.actionBtnText}>Restaurar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFB3C6' }]} onPress={() => deletePermanent(task.id, task.titulo)}>
                  <Text style={styles.actionBtnText}>Eliminar</Text>
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
  clearBtn: { backgroundColor: '#FFB3C6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  clearBtnText: { color: '#3D5A3E', fontWeight: '600', fontSize: 13 },
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
import db from '@/lib/database';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function CalendarioScreen() {
  const router = useRouter();
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tasksByDate, setTasksByDate] = useState<any[]>([]);

  const loadDates = useCallback(() => {
    const tasks = db.getAllSync(
      `SELECT titulo, categoria, importance, fecha, status FROM events WHERE deleted = 0 AND fecha != ''`
    ) as any[];

    const marks: any = {};
    tasks.forEach((task: any) => {
      if (!task.fecha) return;
      const color = task.status === 'done' ? '#A5CB90' : task.status === 'in_progress' ? '#F4A261' : '#7BAE7F';
      if (!marks[task.fecha]) marks[task.fecha] = { dots: [] };
      if (marks[task.fecha].dots.length < 3) marks[task.fecha].dots.push({ color });
    });
    setMarkedDates(marks);
  }, []);

  const loadTasksForDate = useCallback((date: string) => {
    const tasks = db.getAllSync(
      `SELECT titulo, categoria, importance, status FROM events WHERE deleted = 0 AND fecha = ?`,
      [date]
    ) as any[];
    setTasksByDate(tasks);
  }, []);

  useFocusEffect(useCallback(() => { loadDates(); }, []));

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    loadTasksForDate(day.dateString);
  };

  const statusColor = (status: string) => {
    if (status === 'done') return '#A5CB90';
    if (status === 'in_progress') return '#FFE5A0';
    return '#E8E3D9';
  };

  const statusLabel = (status: string) => {
    if (status === 'done') return 'Completada';
    if (status === 'in_progress') return 'En progreso';
    return 'Pendiente';
  };

  const selectedMarks = selectedDate ? {
    ...markedDates,
    [selectedDate]: { ...(markedDates[selectedDate] || {}), selected: true, selectedColor: '#7BAE7F' }
  } : markedDates;

  return (
    <View style={styles.container}>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)')}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.calendarCard}>
          <Calendar
            markingType="multi-dot"
            markedDates={selectedMarks}
            onDayPress={onDayPress}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              todayTextColor: '#7BAE7F',
              selectedDayBackgroundColor: '#7BAE7F',
              selectedDayTextColor: 'white',
              arrowColor: '#7BAE7F',
              monthTextColor: '#3D5A3E',
              textMonthFontWeight: 'bold',
              textMonthFontSize: 16,
              dayTextColor: '#3D5A3E',
              textDisabledColor: '#ccc',
              dotColor: '#7BAE7F',
            }}
          />
        </View>

        {selectedDate && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tareas para {selectedDate}</Text>
            {tasksByDate.length === 0 ? (
              <Text style={styles.empty}>No hay tareas para este dia.</Text>
            ) : (
              tasksByDate.map((task: any, i: number) => (
                <View key={i} style={[styles.taskCard, { borderLeftColor: statusColor(task.status), borderLeftWidth: 4 }]}>
                  <View style={styles.taskHeader}>
                    <Text style={[styles.taskTitle, task.status === 'done' && styles.taskDone]}>{task.titulo}</Text>
                    <Text style={[styles.badge, {
                      backgroundColor: task.importance === 'Alta' ? '#FFB3C6' : task.importance === 'Media' ? '#FFE5A0' : '#A5CB90'
                    }]}>{task.importance}</Text>
                  </View>
                  <Text style={styles.taskMeta}>{task.categoria}</Text>
                  <Text style={[styles.statusText, { color: task.status === 'done' ? '#7BAE7F' : task.status === 'in_progress' ? '#F4A261' : '#999' }]}>
                    {statusLabel(task.status)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {!selectedDate && (
          <View style={styles.card}>
            <Text style={styles.empty}>Toca un dia para ver las tareas.</Text>
          </View>
        )}

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Referencia de colores</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#7BAE7F' }]} />
            <Text style={styles.legendText}>Pendiente</Text>
            <View style={[styles.legendDot, { backgroundColor: '#F4A261' }]} />
            <Text style={styles.legendText}>En progreso</Text>
            <View style={[styles.legendDot, { backgroundColor: '#A5CB90' }]} />
            <Text style={styles.legendText}>Completada</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F1EA' },
  backBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  backBtnText: { fontSize: 15, color: '#7BAE7F', fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  calendarCard: { backgroundColor: '#DFF0D8', borderRadius: 14, padding: 8, marginBottom: 16 },
  card: { backgroundColor: '#DFF0D8', borderRadius: 14, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#3D5A3E', marginBottom: 12 },
  empty: { color: '#888', fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  taskCard: { backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 8 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#3D5A3E', flex: 1 },
  taskDone: { textDecorationLine: 'line-through', color: '#999' },
  taskMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  statusText: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, fontSize: 11, fontWeight: '600', overflow: 'hidden' },
  legend: { backgroundColor: 'white', borderRadius: 12, padding: 12 },
  legendTitle: { fontSize: 12, fontWeight: '600', color: '#3D5A3E', marginBottom: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#666', marginRight: 8 },
});
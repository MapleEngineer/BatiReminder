import { createEvent, getCategorias, getEvents, updateEvent } from '@/lib/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const IMPORTANCIA = ['Alta', 'Media', 'Baja'];
const COLORS: Record<string, string> = {
  Escuela: '#C9B8E8', Personal: '#A8D8EA', Casa: '#FFE5A0',
  Medico: '#FFB3C6', Gym: '#A5CB90', Social: '#F4A261',
};

export default function TareasScreen() {
  const router = useRouter();
  const confettiRef = useRef<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [tareas, setTareas] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [importancia, setImportancia] = useState('Media');
  const [fecha, setFecha] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadCategorias = useCallback(() => {
    getCategorias().then((cats: any[]) => {
      setCategorias(cats);
      if (!selectedCat && cats.length > 0) setSelectedCat(cats[0].nombre);
    }).catch(console.error);
  }, []);

  const loadTareas = useCallback(() => {
    if (!selectedCat) return;
    getEvents(selectedCat).then((tasks: any[]) => setTareas(tasks)).catch(console.error);
  }, [selectedCat]);

  useFocusEffect(useCallback(() => { loadCategorias(); }, []));
  useFocusEffect(useCallback(() => { loadTareas(); }, [selectedCat]));

  const saveTask = () => {
    if (!titulo.trim()) { Alert.alert('Error', 'El titulo es obligatorio'); return; }
    createEvent({ titulo, descripcion, importance: importancia, categoria: selectedCat, fecha, status: 'pendiente', done: 0, deleted: 0 })
      .then(() => { setTitulo(''); setDescripcion(''); setImportancia('Media'); setFecha(''); setModalVisible(false); loadTareas(); })
      .catch(console.error);
  };

  const markDone = (id: string) => {
    updateEvent(id, { done: 1, status: 'done' }).then(() => { confettiRef.current?.start(); loadTareas(); }).catch(console.error);
  };

  const markOngoing = (id: string) => {
    updateEvent(id, { status: 'in_progress' }).then(() => loadTareas()).catch(console.error);
  };

  const deleteTask = (id: string, titulo: string) => {
    Alert.alert('Eliminar tarea', `¿Eliminar "${titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => updateEvent(id, { deleted: 1 }).then(() => loadTareas()) }
    ]);
  };

  const catColor = (nombre: string) => COLORS[nombre] || '#DFF0D8';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)')}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContainer}>
        {categorias.map((cat: any) => (
          <TouchableOpacity key={cat._id} style={[styles.catPill, { backgroundColor: selectedCat === cat.nombre ? '#7BAE7F' : '#E8E3D9' }]} onPress={() => setSelectedCat(cat.nombre)}>
            <Text style={[styles.catPillText, { color: selectedCat === cat.nombre ? 'white' : '#3D3D3D' }]}>{cat.nombre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.taskList} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {tareas.length === 0 ? (
          <Text style={styles.empty}>No hay tareas en {selectedCat} todavia.</Text>
        ) : (
          tareas.map((task: any) => (
            <View key={task._id} style={[styles.taskCard, { borderLeftColor: catColor(selectedCat || ''), borderLeftWidth: 4 }]}>
              <View style={styles.taskHeader}>
                <Text style={[styles.taskTitle, task.status === 'done' && styles.taskDone]}>{task.titulo}</Text>
                <Text style={[styles.badge, { backgroundColor: task.importance === 'Alta' ? '#FFB3C6' : task.importance === 'Media' ? '#FFE5A0' : '#A5CB90' }]}>{task.importance}</Text>
              </View>
              {task.descripcion ? <Text style={styles.taskDesc}>{task.descripcion}</Text> : null}
              <Text style={styles.taskFecha}>{task.fecha}</Text>
              {task.status === 'done' && <View style={styles.doneBadge}><Text style={styles.doneBadgeText}>✓ Done</Text></View>}
              {task.status === 'in_progress' && <Text style={styles.progressTag}>En progreso</Text>}
              <View style={styles.taskActions}>
                {task.status !== 'done' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#A5CB90' }]} onPress={() => markDone(task._id)}>
                    <Text style={styles.actionBtnText}>Completar</Text>
                  </TouchableOpacity>
                )}
                {task.status === 'pendiente' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFE5A0' }]} onPress={() => markOngoing(task._id)}>
                    <Text style={styles.actionBtnText}>En progreso</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFB3C6' }]} onPress={() => deleteTask(task._id, task.titulo)}>
                  <Text style={styles.actionBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ Nueva tarea</Text>
      </TouchableOpacity>

      <ConfettiCannon ref={confettiRef} count={80} origin={{ x: 200, y: 0 }} autoStart={false} fadeOut={true} colors={['#7BAE7F', '#A5CB90', '#FFE5A0', '#FFB3C6', '#C9B8E8']} />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nueva tarea en {selectedCat}</Text>
          <Text style={styles.label}>Titulo</Text>
          <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="Nombre de la tarea" />
          <Text style={styles.label}>Descripcion</Text>
          <TextInput style={styles.input} value={descripcion} onChangeText={setDescripcion} placeholder="Opcional" />
          <Text style={styles.label}>Importancia</Text>
          <View style={styles.pillRow}>
            {IMPORTANCIA.map(imp => (
              <TouchableOpacity key={imp} style={[styles.impPill, { backgroundColor: importancia === imp ? '#7BAE7F' : '#E8E3D9' }]} onPress={() => setImportancia(imp)}>
                <Text style={{ color: importancia === imp ? 'white' : '#3D3D3D', fontWeight: '600' }}>{imp}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Fecha</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: fecha ? '#3D5A3E' : '#aaa', fontSize: 15 }}>{fecha || 'Seleccionar fecha'}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <View style={{ backgroundColor: 'white', borderRadius: 12 }}>
              <DateTimePicker value={fecha ? new Date(fecha) : new Date()} mode="date" display="spinner" themeVariant="light"
                onChange={(e, date) => { if (date) setFecha(date.toISOString().split('T')[0]); }} />
              <TouchableOpacity style={{ backgroundColor: '#7BAE7F', padding: 10, borderRadius: 8, alignItems: 'center', margin: 8 }} onPress={() => setShowDatePicker(false)}>
                <Text style={{ color: 'white', fontWeight: '600' }}>Listo</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E8E3D9' }]} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#3D3D3D', fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#7BAE7F' }]} onPress={saveTask}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F1EA' },
  backBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  backBtnText: { fontSize: 15, color: '#7BAE7F', fontWeight: '600' },
  catScroll: { maxHeight: 60, borderBottomWidth: 1, borderBottomColor: '#E8E3D9' },
  catContainer: { padding: 10, gap: 8, flexDirection: 'row' },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  catPillText: { fontWeight: '600', fontSize: 13 },
  taskList: { flex: 1 },
  empty: { color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  taskCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: '#3D5A3E', flex: 1 },
  taskDone: { textDecorationLine: 'line-through', color: '#999' },
  taskDesc: { fontSize: 13, color: '#666', marginBottom: 4 },
  taskFecha: { fontSize: 12, color: '#888' },
  progressTag: { fontSize: 11, color: '#F4A261', fontWeight: '600', marginTop: 4 },
  doneBadge: { backgroundColor: '#A5CB90', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  doneBadgeText: { color: '#3D5A3E', fontSize: 11, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, fontSize: 11, fontWeight: '600', overflow: 'hidden' },
  taskActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#3D5A3E' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#7BAE7F', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 5 },
  fabText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  modal: { flex: 1, padding: 24, backgroundColor: '#F4F1EA' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#3D5A3E', marginBottom: 24, marginTop: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#3D5A3E', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: 'white', borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#E8E3D9' },
  pillRow: { flexDirection: 'row', gap: 10 },
  impPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
});
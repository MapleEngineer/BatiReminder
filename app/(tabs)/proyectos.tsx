import db from '@/lib/database';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GANTT_COLORS = ['#7BAE7F', '#F4A261', '#E07A5F', '#C9B8E8', '#FFE5A0', '#A8D8EA', '#FFB3C6'];

function GanttChart({ pasos }: { pasos: any[] }) {
  if (pasos.length === 0) return <Text style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>No hay pasos para mostrar.</Text>;

  const validPasos = pasos.filter(p => p.fecha_inicio && p.fecha_fin);
  if (validPasos.length === 0) return <Text style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>Agrega fechas a los pasos para ver el Gantt.</Text>;

  const allDates = validPasos.flatMap(p => [new Date(p.fecha_inicio), new Date(p.fecha_fin)]);
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))) + 1;

  const LABEL_WIDTH = 100;
  const DAY_WIDTH = 36;
  const chartWidth = totalDays * DAY_WIDTH;

  // Generate date labels every few days
  const dateLabels: { day: number; label: string }[] = [];
  for (let i = 0; i <= totalDays; i += Math.max(1, Math.floor(totalDays / 8))) {
    const d = new Date(minDate);
    d.setDate(d.getDate() + i);
    dateLabels.push({ day: i, label: `${d.getMonth() + 1}/${d.getDate()}` });
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
      <View style={{ width: LABEL_WIDTH + chartWidth }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <View style={{ width: LABEL_WIDTH }} />
          <View style={{ width: chartWidth, position: 'relative', height: 20 }}>
            {dateLabels.map((dl, i) => (
              <Text key={i} style={{
                position: 'absolute',
                left: dl.day * DAY_WIDTH,
                fontSize: 9,
                color: '#888',
                width: 40,
              }}>{dl.label}</Text>
            ))}
          </View>
        </View>

        {/* Today line */}
        {(() => {
          const today = new Date();
          const todayOffset = Math.ceil((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
          if (todayOffset >= 0 && todayOffset <= totalDays) {
            return (
              <View style={{
                position: 'absolute',
                left: LABEL_WIDTH + todayOffset * DAY_WIDTH,
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: '#FF3B30',
                opacity: 0.5,
                zIndex: 10,
              }} />
            );
          }
          return null;
        })()}

        {/* Paso rows */}
        {validPasos.map((paso, i) => {
          const start = new Date(paso.fecha_inicio);
          const end = new Date(paso.fecha_fin);
          const startDay = Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
          const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          const barColor = GANTT_COLORS[i % GANTT_COLORS.length];
          const isDone = paso.status === 'done';

          return (
            <View key={paso.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ width: LABEL_WIDTH, paddingRight: 8 }}>
                <Text style={{ fontSize: 11, color: '#3D5A3E', fontWeight: '600' }} numberOfLines={2}>{paso.nombre}</Text>
                <Text style={{ fontSize: 9, color: isDone ? '#7BAE7F' : paso.status === 'in_progress' ? '#F4A261' : '#999' }}>
                  {isDone ? 'Completado' : paso.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                </Text>
              </View>
              <View style={{ width: chartWidth, height: 28, position: 'relative' }}>
                {/* Background grid */}
                {Array.from({ length: totalDays }).map((_, d) => (
                  <View key={d} style={{
                    position: 'absolute',
                    left: d * DAY_WIDTH,
                    width: DAY_WIDTH,
                    height: 28,
                    borderRightWidth: 0.5,
                    borderRightColor: '#E8E3D9',
                    backgroundColor: d % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                  }} />
                ))}
                {/* Bar */}
                <View style={{
                  position: 'absolute',
                  left: startDay * DAY_WIDTH,
                  width: duration * DAY_WIDTH - 2,
                  height: 22,
                  top: 3,
                  backgroundColor: barColor,
                  borderRadius: 6,
                  opacity: isDone ? 0.5 : 1,
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                }}>
                  {duration > 2 && (
                    <Text style={{ fontSize: 9, color: 'white', fontWeight: '600' }} numberOfLines={1}>
                      {paso.nombre}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function ProyectosScreen() {
  const router = useRouter();
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState<any>(null);
  const [pasos, setPasos] = useState<any[]>([]);
  const [modalProyecto, setModalProyecto] = useState(false);
  const [modalPaso, setModalPaso] = useState(false);
  const [modalGantt, setModalGantt] = useState(false);
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [nombrePaso, setNombrePaso] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFin, setShowPickerFin] = useState(false);

  const loadProyectos = useCallback(() => {
    const data = db.getAllSync('SELECT * FROM proyectos ORDER BY id DESC') as any[];

    const proyectosConFecha = data.map((p: any) => {
      const pasosExpiring = db.getAllSync(
        `SELECT COUNT(*) as count FROM pasos 
         WHERE proyecto_id = ? AND status != 'done' 
         AND fecha_fin != '' AND fecha_fin <= date('now', '+2 days')`,
        [p.id]
      ) as any[];
      return { ...p, expiringSoon: pasosExpiring[0]?.count || 0 };
    });

    setProyectos(proyectosConFecha);
    if (!selectedProyecto && proyectosConFecha.length > 0) {
      setSelectedProyecto(proyectosConFecha[0]);
    }
  }, []);

  const loadPasos = useCallback(() => {
    if (!selectedProyecto) return;
    const data = db.getAllSync(
      'SELECT * FROM pasos WHERE proyecto_id = ? ORDER BY fecha_inicio ASC',
      [selectedProyecto.id]
    );
    setPasos(data as any[]);
  }, [selectedProyecto]);

  useFocusEffect(useCallback(() => { loadProyectos(); }, []));
  useFocusEffect(useCallback(() => { loadPasos(); }, [selectedProyecto]));

  const saveProyecto = () => {
    if (!nombreProyecto.trim()) return;
    db.runSync('INSERT INTO proyectos (nombre) VALUES (?)', [nombreProyecto]);
    setNombreProyecto('');
    setModalProyecto(false);
    loadProyectos();
  };

  const deleteProyecto = (id: number, nombre: string) => {
    Alert.alert('Eliminar proyecto', `¿Eliminar "${nombre}" y todos sus pasos?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => {
          db.runSync('DELETE FROM proyectos WHERE id = ?', [id]);
          db.runSync('DELETE FROM pasos WHERE proyecto_id = ?', [id]);
          setSelectedProyecto(null);
          loadProyectos();
        }
      }
    ]);
  };

  const savePaso = () => {
    if (!nombrePaso.trim()) return;
    db.runSync(
      'INSERT INTO pasos (proyecto_id, nombre, fecha_inicio, fecha_fin, status) VALUES (?, ?, ?, ?, ?)',
      [selectedProyecto.id, nombrePaso, fechaInicio, fechaFin, 'pendiente']
    );
    setNombrePaso('');
    setFechaInicio('');
    setFechaFin('');
    setModalPaso(false);
    loadPasos();
  };

  const updatePasoStatus = (id: number, status: string) => {
    db.runSync('UPDATE pasos SET status = ? WHERE id = ?', [status, id]);
    loadPasos();
  };

  const deletePaso = (id: number) => {
    db.runSync('DELETE FROM pasos WHERE id = ?', [id]);
    loadPasos();
  };

  const statusColor = (status: string) => {
    if (status === 'done') return '#A5CB90';
    if (status === 'in_progress') return '#FFE5A0';
    return '#E8E3D9';
  };

  return (
    <View style={styles.container}>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)')}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalProyecto(true)}>
            <Text style={styles.addBtnText}>+ Nuevo proyecto</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projScroll} contentContainerStyle={styles.projContainer}>
          {proyectos.map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.projPill, { backgroundColor: selectedProyecto?.id === p.id ? '#7BAE7F' : '#E8E3D9' }]}
              onPress={() => setSelectedProyecto(p)}
            >
              <Text style={[styles.projPillText, { color: selectedProyecto?.id === p.id ? 'white' : '#3D3D3D' }]}>
                {p.nombre}
              </Text>
              {p.expiringSoon > 0 && (
                <View style={styles.expireBubble}>
                  <Text style={styles.expireBubbleText}>{p.expiringSoon}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {proyectos.length === 0 && (
          <Text style={styles.empty}>No hay proyectos aun. Crea uno!</Text>
        )}

        {selectedProyecto && (
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.ganttBtn} onPress={() => setModalGantt(true)}>
              <Text style={styles.ganttBtnText}>Ver Gantt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteProyecto(selectedProyecto.id, selectedProyecto.nombre)}>
              <Text style={styles.deleteBtnText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedProyecto && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{selectedProyecto.nombre}</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => setModalPaso(true)}>
                <Text style={styles.addBtnText}>+ Paso</Text>
              </TouchableOpacity>
            </View>

            {pasos.length === 0 ? (
              <Text style={styles.empty}>No hay pasos aun.</Text>
            ) : (
              pasos.map((paso: any) => (
                <View key={paso.id} style={[styles.pasoCard, { borderLeftColor: statusColor(paso.status), borderLeftWidth: 4 }]}>
                  <View style={styles.pasoHeader}>
                    <Text style={[styles.pasoNombre, paso.status === 'done' && styles.pasoDone]}>
                      {paso.nombre}
                    </Text>
                    <TouchableOpacity onPress={() => deletePaso(paso.id)}>
                      <Text style={styles.deleteX}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.pasoFecha}>{paso.fecha_inicio} → {paso.fecha_fin}</Text>
                  <Text style={[styles.pasoStatus, { color: paso.status === 'done' ? '#7BAE7F' : paso.status === 'in_progress' ? '#F4A261' : '#999' }]}>
                    {paso.status === 'done' ? 'Completado' : paso.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                  </Text>
                  <View style={styles.pasoActions}>
                    {paso.status !== 'done' && (
                      <TouchableOpacity style={[styles.pasoBtn, { backgroundColor: '#A5CB90' }]} onPress={() => updatePasoStatus(paso.id, 'done')}>
                        <Text style={styles.pasoBtnText}>Completar</Text>
                      </TouchableOpacity>
                    )}
                    {paso.status === 'pendiente' && (
                      <TouchableOpacity style={[styles.pasoBtn, { backgroundColor: '#FFE5A0' }]} onPress={() => updatePasoStatus(paso.id, 'in_progress')}>
                        <Text style={styles.pasoBtnText}>En progreso</Text>
                      </TouchableOpacity>
                    )}
                    {paso.status !== 'pendiente' && (
                      <TouchableOpacity style={[styles.pasoBtn, { backgroundColor: '#E8E3D9' }]} onPress={() => updatePasoStatus(paso.id, 'pendiente')}>
                        <Text style={styles.pasoBtnText}>Resetear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Gantt Modal */}
      <Modal visible={modalGantt} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.ganttModal}>
          <View style={styles.ganttModalHeader}>
            <Text style={styles.ganttModalTitle}>Gantt — {selectedProyecto?.nombre}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalGantt(false)}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.ganttHint}>Desliza horizontalmente para ver toda la timeline</Text>
          <View style={{ flex: 1, padding: 16 }}>
            <GanttChart pasos={pasos} />
          </View>
        </View>
      </Modal>

      {/* New Project Modal */}
      <Modal visible={modalProyecto} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nuevo proyecto</Text>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={nombreProyecto} onChangeText={setNombreProyecto} placeholder="Nombre del proyecto" />
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E8E3D9' }]} onPress={() => setModalProyecto(false)}>
              <Text style={{ color: '#3D3D3D', fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#7BAE7F' }]} onPress={saveProyecto}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Step Modal */}
      <Modal visible={modalPaso} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nuevo paso</Text>
          <Text style={styles.label}>Nombre del paso</Text>
          <TextInput style={styles.input} value={nombrePaso} onChangeText={setNombrePaso} placeholder="Ej: Investigacion" />

          <Text style={styles.label}>Fecha inicio</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowPickerInicio(true)}>
            <Text style={{ color: fechaInicio ? '#3D5A3E' : '#aaa', fontSize: 15 }}>{fechaInicio || 'Seleccionar fecha'}</Text>
          </TouchableOpacity>
          {showPickerInicio && (
            <View style={{ backgroundColor: 'white', borderRadius: 12 }}>
              <DateTimePicker
                value={fechaInicio ? new Date(fechaInicio) : new Date()}
                mode="date" display="spinner" themeVariant="light"
                onChange={(e, date) => { if (date) setFechaInicio(date.toISOString().split('T')[0]); }}
              />
              <TouchableOpacity style={{ backgroundColor: '#7BAE7F', padding: 10, borderRadius: 8, alignItems: 'center', margin: 8 }} onPress={() => setShowPickerInicio(false)}>
                <Text style={{ color: 'white', fontWeight: '600' }}>Listo</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.label}>Fecha fin</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowPickerFin(true)}>
            <Text style={{ color: fechaFin ? '#3D5A3E' : '#aaa', fontSize: 15 }}>{fechaFin || 'Seleccionar fecha'}</Text>
          </TouchableOpacity>
          {showPickerFin && (
            <View style={{ backgroundColor: 'white', borderRadius: 12 }}>
              <DateTimePicker
                value={fechaFin ? new Date(fechaFin) : new Date()}
                mode="date" display="spinner" themeVariant="light"
                onChange={(e, date) => { if (date) setFechaFin(date.toISOString().split('T')[0]); }}
              />
              <TouchableOpacity style={{ backgroundColor: '#7BAE7F', padding: 10, borderRadius: 8, alignItems: 'center', margin: 8 }} onPress={() => setShowPickerFin(false)}>
                <Text style={{ color: 'white', fontWeight: '600' }}>Listo</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E8E3D9' }]} onPress={() => setModalPaso(false)}>
              <Text style={{ color: '#3D3D3D', fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#7BAE7F' }]} onPress={savePaso}>
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
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  addBtn: { backgroundColor: '#7BAE7F', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: 'white', fontWeight: '600', fontSize: 13 },
  projScroll: { maxHeight: 60, marginBottom: 8 },
  projContainer: { gap: 8, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  projPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'visible' },
  projPillText: { fontWeight: '600', fontSize: 13 },
  expireBubble: { position: 'absolute', top: -6, right: -6, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2, minWidth: 20, alignItems: 'center', backgroundColor: '#FF3B30' },
  expireBubbleText: { color: 'white', fontSize: 9, fontWeight: '700' },
  actionBar: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  ganttBtn: { flex: 7, backgroundColor: '#DFF0D8', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#7BAE7F' },
  ganttBtnText: { color: '#3D5A3E', fontWeight: '600', fontSize: 13 },
  deleteBtn: { flex: 2, backgroundColor: '#FFB3C6', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  deleteBtnText: { color: '#3D5A3E', fontWeight: '600', fontSize: 11 },
  empty: { color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  card: { backgroundColor: '#DFF0D8', borderRadius: 14, padding: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#3D5A3E' },
  pasoCard: { backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 10 },
  pasoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pasoNombre: { fontSize: 14, fontWeight: '600', color: '#3D5A3E', flex: 1 },
  pasoDone: { textDecorationLine: 'line-through', color: '#999' },
  pasoFecha: { fontSize: 12, color: '#888', marginTop: 4 },
  pasoStatus: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  pasoActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  pasoBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  pasoBtnText: { fontSize: 12, fontWeight: '600', color: '#3D5A3E' },
  deleteX: { color: '#FFB3C6', fontSize: 16, fontWeight: 'bold', padding: 4 },
  ganttModal: { flex: 1, backgroundColor: '#F4F1EA' },
  ganttModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: '#E8E3D9' },
  ganttModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#3D5A3E', flex: 1 },
  ganttHint: { fontSize: 11, color: '#888', paddingHorizontal: 16, paddingTop: 8, fontStyle: 'italic' },
  closeBtn: { backgroundColor: '#7BAE7F', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  closeBtnText: { color: 'white', fontWeight: '600', fontSize: 13 },
  modal: { flex: 1, padding: 24, backgroundColor: '#F4F1EA' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#3D5A3E', marginBottom: 24, marginTop: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#3D5A3E', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: 'white', borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#E8E3D9' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
});
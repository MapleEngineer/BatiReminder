import { getAllEvents, getAnalytics, getProyectos } from '@/lib/api';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const CAT_COLORS = ['#C9B8E8', '#A8D8EA', '#FFE5A0', '#FFB3C6', '#A5CB90', '#F4A261', '#7BAE7F'];

function BarChart({ data, colorKey }: { data: { label: string; value: number; color?: string }[]; colorKey?: string[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={{ gap: 8 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 11, color: '#3D5A3E', width: 90 }} numberOfLines={1}>{d.label}</Text>
          <View style={{ flex: 1, backgroundColor: '#E8E3D9', borderRadius: 6, height: 14, overflow: 'hidden' }}>
            <View style={{ width: `${Math.round(d.value / max * 100)}%` as any, height: 14, borderRadius: 6, backgroundColor: d.color || (colorKey ? colorKey[i % colorKey.length] : '#7BAE7F') }} />
          </View>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#3D5A3E', width: 24, textAlign: 'right' }}>{d.value}</Text>
        </View>
      ))}
    </View>
  );
}

function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  return (
    <View>
      <View style={{ flexDirection: 'row', height: 20, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
        {slices.filter(s => s.value > 0).map((s, i) => <View key={i} style={{ flex: s.value, backgroundColor: s.color }} />)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {slices.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
            <Text style={{ fontSize: 11, color: '#3D5A3E' }}>{s.label}: {s.value} ({total > 0 ? Math.round(s.value / total * 100) : 0}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const [stats, setStats] = useState<any>({});
  const [catStats, setCatStats] = useState<any[]>([]);
  const [importanceStats, setImportanceStats] = useState<any[]>([]);
  const [topEvents, setTopEvents] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  const loadData = useCallback(() => {
    getAllEvents().then((all: any[]) => {
      const done = all.filter(t => t.status === 'done').length;
      const inprog = all.filter(t => t.status === 'in_progress').length;
      const pending = all.filter(t => t.status === 'pendiente').length;
      setStats({ total: all.length, done, inprog, pending });

      const catMap: Record<string, number> = {};
      all.forEach(t => { if (t.categoria) catMap[t.categoria] = (catMap[t.categoria] || 0) + 1; });
      setCatStats(Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({ label, value, color: CAT_COLORS[i % CAT_COLORS.length] })));

      const impMap: Record<string, number> = {};
      all.filter(t => t.status !== 'done').forEach(t => { if (t.importance) impMap[t.importance] = (impMap[t.importance] || 0) + 1; });
      setImportanceStats(Object.entries(impMap).map(([label, value]) => ({ label, value, color: label === 'Alta' ? '#FF3B30' : label === 'Media' ? '#FF9500' : '#A5CB90' })));
    }).catch(console.error);

    getProyectos().then((projs: any[]) => {
      setStats((prev: any) => ({ ...prev, projs: projs.length }));
    }).catch(console.error);

    getAnalytics().then((events: any[]) => {
      setRecentEvents(events.slice(0, 20));
      const eventMap: Record<string, number> = {};
      events.forEach(e => { eventMap[e.event] = (eventMap[e.event] || 0) + 1; });
      setTopEvents(Object.entries(eventMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value })));
    }).catch(() => { setRecentEvents([]); setTopEvents([]); });
  }, []);

  useFocusEffect(loadData);

  const pct = stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Stats</Text>
      <Text style={styles.subtitle}>Dashboard de uso — BatiReminder</Text>

      <View style={styles.grid}>
        <View style={[styles.statCard, { backgroundColor: '#DFF0D8' }]}><Text style={styles.statNum}>{stats.total || 0}</Text><Text style={styles.statLbl}>Total tareas</Text></View>
        <View style={[styles.statCard, { backgroundColor: '#A5CB90' }]}><Text style={styles.statNum}>{stats.done || 0}</Text><Text style={styles.statLbl}>Completadas</Text></View>
        <View style={[styles.statCard, { backgroundColor: '#FFE5A0' }]}><Text style={styles.statNum}>{stats.inprog || 0}</Text><Text style={styles.statLbl}>En progreso</Text></View>
        <View style={[styles.statCard, { backgroundColor: '#FFB3C6' }]}><Text style={styles.statNum}>{stats.pending || 0}</Text><Text style={styles.statLbl}>Pendientes</Text></View>
        <View style={[styles.statCard, { backgroundColor: '#C9B8E8' }]}><Text style={styles.statNum}>{stats.projs || 0}</Text><Text style={styles.statLbl}>Proyectos</Text></View>
      </View>

      {stats.total > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tasa de completado — {pct}%</Text>
          <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${pct}%` as any }]} /></View>
          <Text style={styles.progressLabel}>{stats.done} de {stats.total} tareas completadas</Text>
        </View>
      )}

      {stats.total > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado de tareas</Text>
          <DonutChart slices={[
            { label: 'Completadas', value: stats.done || 0, color: '#A5CB90' },
            { label: 'En progreso', value: stats.inprog || 0, color: '#FFE5A0' },
            { label: 'Pendientes', value: stats.pending || 0, color: '#FFB3C6' },
          ]} />
        </View>
      )}

      {catStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tareas por categoria</Text>
          <BarChart data={catStats} />
        </View>
      )}

      {importanceStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Importancia de pendientes</Text>
          <BarChart data={importanceStats} />
        </View>
      )}

      {topEvents.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acciones mas frecuentes</Text>
          <BarChart data={topEvents} colorKey={CAT_COLORS} />
        </View>
      )}

      {recentEvents.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actividad reciente</Text>
          {recentEvents.map((e: any, i: number) => (
            <View key={i} style={styles.eventRow}>
              <View style={[styles.eventDot, { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventName}>{e.event.replace(/_/g, ' ')}</Text>
                {e.meta ? <Text style={styles.eventMeta} numberOfLines={1}>{e.meta}</Text> : null}
              </View>
              <Text style={styles.eventTime}>{e.timestamp?.slice(5, 16)}</Text>
            </View>
          ))}
        </View>
      )}

      {topEvents.length === 0 && recentEvents.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actividad</Text>
          <Text style={styles.empty}>Usa la app para ver stats aqui!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F1EA' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#3D5A3E', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '30%', borderRadius: 12, padding: 12, alignItems: 'center', flexGrow: 1 },
  statNum: { fontSize: 26, fontWeight: 'bold', color: '#3D5A3E' },
  statLbl: { fontSize: 10, color: '#3D5A3E', textAlign: 'center', marginTop: 2 },
  card: { backgroundColor: '#DFF0D8', borderRadius: 14, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#3D5A3E', marginBottom: 12 },
  progressBg: { backgroundColor: '#E8E3D9', borderRadius: 8, height: 16, overflow: 'hidden', marginBottom: 6 },
  progressFill: { backgroundColor: '#7BAE7F', height: 16, borderRadius: 8 },
  progressLabel: { fontSize: 12, color: '#666', textAlign: 'center' },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  eventDot: { width: 7, height: 7, borderRadius: 4, marginTop: 4 },
  eventName: { fontSize: 12, fontWeight: '600', color: '#3D5A3E' },
  eventMeta: { fontSize: 11, color: '#888' },
  eventTime: { fontSize: 10, color: '#aaa', marginTop: 2 },
  empty: { color: '#888', fontStyle: 'italic', textAlign: 'center' },
});
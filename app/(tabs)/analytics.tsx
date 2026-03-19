import db from '@/lib/database';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width - 64;
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
        {slices.filter(s => s.value > 0).map((s, i) => (
          <View key={i} style={{ flex: s.value, backgroundColor: s.color }} />
        ))}
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

function LineChart({ data }: { data: { x: number; y: number; label: string }[] }) {
  if (data.length < 2) return <Text style={{ color: '#888', fontStyle: 'italic' }}>Sin datos suficientes</Text>;
  const maxY = Math.max(...data.map(d => d.y), 1);
  const height = 80;
  return (
    <View>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: '70%', height: Math.max(4, Math.round(d.y / maxY * height)), backgroundColor: '#7BAE7F', borderRadius: 3 }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 4, gap: 4 }}>
        {data.map((d, i) => (
          <Text key={i} style={{ flex: 1, fontSize: 8, color: '#888', textAlign: 'center' }} numberOfLines={1}>{d.label}</Text>
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
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);

  const loadData = useCallback(() => {
    try {
      const total = db.getAllSync(`SELECT COUNT(*) as c FROM events WHERE deleted = 0`) as any[];
      const done = db.getAllSync(`SELECT COUNT(*) as c FROM events WHERE status = 'done' AND deleted = 0`) as any[];
      const inprog = db.getAllSync(`SELECT COUNT(*) as c FROM events WHERE status = 'in_progress' AND deleted = 0`) as any[];
      const pending = db.getAllSync(`SELECT COUNT(*) as c FROM events WHERE status = 'pendiente' AND deleted = 0`) as any[];
      const projs = db.getAllSync(`SELECT COUNT(*) as c FROM proyectos`) as any[];
      const pasos = db.getAllSync(`SELECT COUNT(*) as c FROM pasos`) as any[];
      const deleted = db.getAllSync(`SELECT COUNT(*) as c FROM events WHERE deleted = 1`) as any[];

      setStats({
        total: total[0]?.c || 0,
        done: done[0]?.c || 0,
        inprog: inprog[0]?.c || 0,
        pending: pending[0]?.c || 0,
        projs: projs[0]?.c || 0,
        pasos: pasos[0]?.c || 0,
        deleted: deleted[0]?.c || 0,
      });

      const cats = db.getAllSync(
        `SELECT categoria as label, COUNT(*) as value FROM events WHERE deleted = 0 GROUP BY categoria ORDER BY value DESC`
      ) as any[];
      setCatStats(cats.map((c: any, i: number) => ({ ...c, color: CAT_COLORS[i % CAT_COLORS.length] })));

      const imp = db.getAllSync(
        `SELECT importance as label, COUNT(*) as value FROM events WHERE deleted = 0 AND status != 'done' GROUP BY importance ORDER BY value DESC`
      ) as any[];
      setImportanceStats(imp.map((d: any) => ({
        ...d,
        color: d.label === 'Alta' ? '#FF3B30' : d.label === 'Media' ? '#FF9500' : '#A5CB90'
      })));

    } catch (e) { console.log('stats error:', e); }

    try {
      const top = db.getAllSync(
        `SELECT event as label, COUNT(*) as value FROM analytics GROUP BY event ORDER BY value DESC LIMIT 8`
      ) as any[];
      setTopEvents(top);

      const recent = db.getAllSync(
        `SELECT event, meta, timestamp FROM analytics ORDER BY timestamp DESC LIMIT 20`
      ) as any[];
      setRecentEvents(recent);

      const daily = db.getAllSync(`
        SELECT substr(timestamp, 6, 5) as label, COUNT(*) as y
        FROM analytics
        WHERE timestamp >= date('now', '-7 days')
        GROUP BY substr(timestamp, 1, 10)
        ORDER BY timestamp ASC
      `) as any[];
      setDailyActivity(daily.map((d: any, i: number) => ({ x: i + 1, y: d.y, label: d.label })));

    } catch (e) {
      setTopEvents([]);
      setRecentEvents([]);
      setDailyActivity([]);
    }
  }, []);

  useFocusEffect(loadData);

  const pct = stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Stats</Text>
      <Text style={styles.subtitle}>Dashboard de uso — BatiReminder</Text>

      {/* Stats Grid */}
      <View style={styles.grid}>
        <View style={[styles.statCard, { backgroundColor: '#DFF0D8' }]}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLbl}>Total tareas</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#A5CB90' }]}>
          <Text style={styles.statNum}>{stats.done}</Text>
          <Text style={styles.statLbl}>Completadas</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFE5A0' }]}>
          <Text style={styles.statNum}>{stats.inprog}</Text>
          <Text style={styles.statLbl}>En progreso</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFB3C6' }]}>
          <Text style={styles.statNum}>{stats.pending}</Text>
          <Text style={styles.statLbl}>Pendientes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#C9B8E8' }]}>
          <Text style={styles.statNum}>{stats.projs}</Text>
          <Text style={styles.statLbl}>Proyectos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#A8D8EA' }]}>
          <Text style={styles.statNum}>{stats.pasos}</Text>
          <Text style={styles.statLbl}>Pasos</Text>
        </View>
      </View>

      {/* Completion Rate */}
      {stats.total > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tasa de completado — {pct}%</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>{stats.done} de {stats.total} tareas completadas</Text>
        </View>
      )}

      {/* Status Distribution */}
      {stats.total > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado de tareas</Text>
          <DonutChart slices={[
            { label: 'Completadas', value: stats.done, color: '#A5CB90' },
            { label: 'En progreso', value: stats.inprog, color: '#FFE5A0' },
            { label: 'Pendientes', value: stats.pending, color: '#FFB3C6' },
          ]} />
        </View>
      )}

      {/* Tasks by Category */}
      {catStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tareas por categoria</Text>
          <BarChart data={catStats} />
        </View>
      )}

      {/* Importance of Pending */}
      {importanceStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Importancia de pendientes</Text>
          <BarChart data={importanceStats} />
        </View>
      )}

      {/* Daily Activity */}
      {dailyActivity.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actividad ultimos 7 dias</Text>
          <LineChart data={dailyActivity} />
        </View>
      )}

      {/* Top Actions */}
      {topEvents.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acciones mas frecuentes</Text>
          <BarChart data={topEvents} colorKey={CAT_COLORS} />
        </View>
      )}

      {/* Recent Activity */}
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
          <Text style={styles.empty}>Usa la app para ver stats de actividad aqui!</Text>
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
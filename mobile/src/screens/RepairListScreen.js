import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getRepairJobs } from '../services/api';
import { Colors } from '../theme/colors';

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'received', label: 'Received' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
];

const statusConfig = {
  received: { color: Colors.received, icon: 'download-outline', label: 'Received' },
  in_progress: { color: Colors.in_progress, icon: 'construct-outline', label: 'In Progress' },
  ready_for_pickup: { color: Colors.ready_for_pickup, icon: 'checkmark-circle-outline', label: 'Ready' },
  delivered: { color: Colors.delivered, icon: 'cube-outline', label: 'Delivered' },
};

export default function RepairListScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const params = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const res = await getRepairJobs(params);
      setJobs(res.data.jobs);
    } catch (err) {
      console.error('Fetch repairs error:', err);
    }
  };

  useFocusEffect(useCallback(() => { fetchJobs(); }, [filter, search]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const renderJob = ({ item }) => {
    const config = statusConfig[item.status] || statusConfig.received;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RepairDetail', { jobId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={[styles.statusDot, { backgroundColor: config.color }]} />
          <Text style={styles.jobId}>{item.job_id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon} size={13} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <Text style={styles.itemName}>{item.item_name}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText}>{item.customer_name}</Text>
          <Ionicons name="call-outline" size={13} color={Colors.textMuted} style={{ marginLeft: 12 }} />
          <Text style={styles.metaText}>{item.customer_phone}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {new Date(item.received_date).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
          {item.estimated_cost && (
            <Text style={styles.costText}>Est. Rs.{parseFloat(item.estimated_cost).toLocaleString('en-IN')}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by job ID, customer, item..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No repair jobs found</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateRepair')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginHorizontal: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, marginLeft: 10 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    marginHorizontal: 3,
  },
  filterTabActive: {
    backgroundColor: Colors.accent,
  },
  filterText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 18, paddingBottom: 100 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  jobId: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', flex: 1, letterSpacing: 0.5 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  itemName: { fontSize: 17, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: { fontSize: 13, color: Colors.textSecondary, marginLeft: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dateText: { fontSize: 12, color: Colors.textMuted },
  costText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  emptyState: { alignItems: 'center', paddingTop: 60, flex: 1 },
  emptyText: { fontSize: 15, color: Colors.textMuted, marginTop: 12 },
});

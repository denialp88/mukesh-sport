import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getInstallmentPlans } from '../services/api';
import { Colors } from '../theme/colors';

const STATUS_FILTERS = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'defaulted', label: 'Defaulted' },
];

const DATE_PRESETS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

function getPresetDates(key) {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  if (key === 'today') return { from: fmt(today), to: fmt(today) };
  if (key === 'week') {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return { from: fmt(start), to: fmt(today) };
  }
  if (key === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: fmt(start), to: fmt(today) };
  }
  return { from: '', to: '' };
}

export default function InstallmentListScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
  const [filter, setFilter] = useState('active');
  const [refreshing, setRefreshing] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showDateRow, setShowDateRow] = useState(false);
  const [pickerField, setPickerField] = useState(null);
  const [pickerDate, setPickerDate] = useState(new Date());

  const applyDatePreset = (key) => {
    setDatePreset(key);
    if (key === 'custom') {
      setShowDateRow(true);
      return;
    }
    setShowDateRow(false);
    const { from, to } = getPresetDates(key);
    setFromDate(from);
    setToDate(to);
  };

  const fetchPlans = async () => {
    try {
      const params = {};
      if (filter) params.status = filter;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await getInstallmentPlans(params);
      setPlans(res.data.plans);
    } catch (err) {
      console.error('Fetch plans error:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [filter, fromDate, toDate])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    if (status === 'active') return Colors.primary;
    if (status === 'completed') return Colors.success;
    return Colors.danger;
  };

  const renderPlan = ({ item }) => {
    const pending = parseFloat(item.remaining_balance);
    const total = parseFloat(item.total_price);
    const paid = total - pending;
    const progress = total > 0 ? (paid / total) : 0;

    return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('InstallmentDetail', { planId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <Text style={styles.customerName}>
            <Ionicons name="person-outline" size={13} color={Colors.textMuted} /> {item.customer_name}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status === 'completed' ? 'PAID' : 'PENDING'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Total</Text>
          <Text style={styles.infoValue}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Paid</Text>
          <Text style={[styles.infoValue, { color: Colors.success }]}>₹{paid.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Pending</Text>
          <Text style={[styles.infoValue, { color: pending > 0 ? Colors.danger : Colors.success }]}>₹{pending.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: Math.min(progress * 100, 100) + '%' }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
      </View>
    </TouchableOpacity>
  )};

  return (
    <View style={styles.container}>
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

      {/* Date Range Filter */}
      <View style={styles.datePresetsRow}>
        {DATE_PRESETS.map((d) => (
          <TouchableOpacity
            key={d.key}
            style={[styles.datePresetBtn, datePreset === d.key && styles.datePresetActive]}
            onPress={() => applyDatePreset(d.key)}
          >
            <Text style={[styles.datePresetText, datePreset === d.key && styles.datePresetTextActive]}>{d.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {showDateRow && (
        <View style={styles.customDateRow}>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => { setPickerField('from'); setPickerDate(fromDate ? new Date(fromDate) : new Date()); }}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.datePickerText}>{fromDate || 'From'}</Text>
          </TouchableOpacity>
          <Text style={{ color: Colors.textMuted }}>—</Text>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => { setPickerField('to'); setPickerDate(toDate ? new Date(toDate) : new Date()); }}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.datePickerText}>{toDate || 'To'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {pickerField && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, date) => {
            setPickerField(null);
            if (date) {
              const fmt = date.toISOString().split('T')[0];
              if (pickerField === 'from') setFromDate(fmt);
              else setToDate(fmt);
            }
          }}
        />
      )}

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={renderPlan}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No installment plans found</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateInstallment')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: { fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  customerName: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  cardBody: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textMuted },
  infoValue: { fontSize: 15, fontWeight: '700', color: Colors.text, marginTop: 2 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: { fontSize: 11, fontWeight: '700', color: Colors.primary, width: 32, textAlign: 'right' },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: { fontSize: 15, color: Colors.textMuted, marginTop: 12 },
  datePresetsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  datePresetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginHorizontal: 2,
  },
  datePresetActive: {
    backgroundColor: Colors.primary + '25',
  },
  datePresetText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  datePresetTextActive: { color: Colors.primary },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 8,
    gap: 10,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  datePickerText: { fontSize: 13, color: Colors.textSecondary },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getInstallmentPlan, payInstallment } from '../services/api';
import { Colors } from '../theme/colors';

export default function InstallmentDetailScreen({ route, navigation }) {
  const { planId } = route.params;
  const [plan, setPlan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await getInstallmentPlan(planId);
      setPlan(res.data.plan);
      setInstallments(res.data.installments);
    } catch (err) {
      console.error('Fetch plan detail error:', err);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handlePay = (inst) => {
    Alert.alert(
      'Mark as Paid',
      'Mark installment #' + inst.installment_number + ' as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Cash', onPress: () => markPaid(inst.id, 'cash') },
        { text: 'UPI', onPress: () => markPaid(inst.id, 'upi') },
      ]
    );
  };

  const markPaid = async (id, mode) => {
    try {
      await payInstallment(id, { payment_mode: mode });
      fetchData();
      Alert.alert('Success', 'Installment marked as paid!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update installment.');
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'paid') return { icon: 'checkmark-circle', color: Colors.success };
    if (status === 'overdue') return { icon: 'alert-circle', color: Colors.danger };
    return { icon: 'time-outline', color: Colors.warning };
  };

  if (!plan) return <View style={styles.container} />;

  const paidCount = installments.filter((i) => i.status === 'paid').length;
  const progress = installments.length > 0 ? paidCount / installments.length : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <LinearGradient
          colors={['rgba(249,115,22,0.12)', 'rgba(234,179,8,0.06)']}
          style={styles.headerCard}
        >
          <Text style={styles.productName}>{plan.product_name}</Text>
          <Text style={styles.customerInfo}>
            {plan.customer_name} | {plan.customer_phone}
          </Text>

          {plan.brand ? <Text style={styles.meta}>{plan.brand} {plan.model || ''}</Text> : null}

          <View style={styles.priceRow}>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Total Price</Text>
              <Text style={styles.priceValue}>
                {'Rs.' + parseFloat(plan.total_price).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Down Payment</Text>
              <Text style={styles.priceValue}>
                {'Rs.' + parseFloat(plan.down_payment).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>EMI</Text>
              <Text style={[styles.priceValue, { color: Colors.primary }]}>
                {'Rs.' + parseFloat(plan.installment_amount).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {paidCount} of {installments.length} paid
              </Text>
              <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: (progress * 100) + '%' }]} />
            </View>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Installment Schedule</Text>

        {installments.map((inst) => {
          const s = getStatusIcon(inst.status);
          const dueDate = new Date(inst.due_date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          });

          return (
            <View key={inst.id} style={styles.instCard}>
              <View style={styles.instLeft}>
                <Ionicons name={s.icon} size={24} color={s.color} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.instNumber}>Installment #{inst.installment_number}</Text>
                  <Text style={styles.instDate}>{dueDate}</Text>
                  {inst.paid_date && (
                    <Text style={styles.instPaidInfo}>
                      Paid on {new Date(inst.paid_date).toLocaleDateString('en-IN')}
                      {inst.payment_mode ? ' via ' + inst.payment_mode.toUpperCase() : ''}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.instRight}>
                <Text style={[styles.instAmount, { color: s.color }]}>
                  {'Rs.' + parseFloat(inst.amount).toLocaleString('en-IN')}
                </Text>
                {inst.status !== 'paid' && (
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => handlePay(inst)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.payBtnText}>PAY</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerCard: {
    margin: 18,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productName: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  customerInfo: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  meta: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  priceRow: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  priceCol: { flex: 1 },
  priceLabel: { fontSize: 11, color: Colors.textMuted },
  priceValue: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 2 },
  progressSection: { marginTop: 16 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 13, color: Colors.textSecondary },
  progressPercent: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  instCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  instNumber: { fontSize: 14, fontWeight: '600', color: Colors.text },
  instDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  instPaidInfo: { fontSize: 11, color: Colors.success, marginTop: 2 },
  instRight: { alignItems: 'flex-end' },
  instAmount: { fontSize: 15, fontWeight: '700' },
  payBtn: {
    marginTop: 6,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
  },
  payBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
});

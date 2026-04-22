import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getInstallmentPlan, addPayment } from '../services/api';
import { Colors } from '../theme/colors';

export default function InstallmentDetailScreen({ route, navigation }) {
  const { planId } = route.params;
  const [plan, setPlan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('cash');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchData = async () => {
    try {
      const res = await getInstallmentPlan(planId);
      setPlan(res.data.plan);
      setPayments(res.data.installments || []);
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

  const handleAddPayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      Alert.alert('Error', 'Enter a valid amount.');
      return;
    }
    setPaying(true);
    try {
      await addPayment(planId, {
        amount: parseFloat(payAmount),
        payment_mode: payMode,
        note: payNote,
      });
      setShowPayModal(false);
      setPayAmount('');
      setPayNote('');
      fetchData();
      Alert.alert('Success', 'Payment of Rs.' + payAmount + ' recorded!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add payment.');
    } finally {
      setPaying(false);
    }
  };

  if (!plan) return <View style={styles.container} />;

  const totalPaid = parseFloat(plan.down_payment) + payments.reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
  const remaining = parseFloat(plan.remaining_balance);
  const totalPrice = parseFloat(plan.total_price);
  const progress = totalPrice > 0 ? (totalPaid / totalPrice) : 0;

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

          <View style={styles.priceRow}>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.priceValue}>
                Rs.{totalPrice.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Paid</Text>
              <Text style={[styles.priceValue, { color: Colors.success }]}>
                Rs.{totalPaid.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Pending</Text>
              <Text style={[styles.priceValue, { color: remaining > 0 ? Colors.danger : Colors.success }]}>
                Rs.{remaining.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Payment Progress</Text>
              <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: Math.min(progress * 100, 100) + '%' }]} />
            </View>
          </View>

          {plan.status === 'completed' ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.completedText}>Fully Paid</Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* Add Payment Button */}
        {remaining > 0 && (
          <TouchableOpacity
            style={styles.addPaymentBtn}
            onPress={() => setShowPayModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[Colors.success, '#059669']} style={styles.addPaymentGradient}>
              <Ionicons name="cash-outline" size={20} color="#fff" />
              <Text style={styles.addPaymentText}>Add Payment Received</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Payment History */}
        <Text style={styles.sectionTitle}>Payment History</Text>

        {parseFloat(plan.down_payment) > 0 && (
          <View style={styles.instCard}>
            <View style={styles.instLeft}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.instNumber}>Initial Payment</Text>
                <Text style={styles.instDate}>At time of purchase</Text>
              </View>
            </View>
            <Text style={[styles.instAmount, { color: Colors.success }]}>
              Rs.{parseFloat(plan.down_payment).toLocaleString('en-IN')}
            </Text>
          </View>
        )}

        {payments.map((p) => {
          const paidDate = p.paid_date
            ? new Date(p.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '';
          return (
            <View key={p.id} style={styles.instCard}>
              <View style={styles.instLeft}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.instNumber}>Payment #{p.installment_number}</Text>
                  <Text style={styles.instDate}>{paidDate}</Text>
                  {p.payment_mode && (
                    <Text style={styles.instPaidInfo}>via {p.payment_mode.toUpperCase()}</Text>
                  )}
                  {p.recorded_by_name ? (
                    <Text style={styles.instRecordedBy}>by {p.recorded_by_name}{p.recorded_by_phone ? ' (' + p.recorded_by_phone + ')' : ''}</Text>
                  ) : null}
                  {p.receipt_note ? <Text style={styles.instPaidInfo}>{p.receipt_note}</Text> : null}
                </View>
              </View>
              <Text style={[styles.instAmount, { color: Colors.success }]}>
                Rs.{parseFloat(p.paid_amount || p.amount).toLocaleString('en-IN')}
              </Text>
            </View>
          );
        })}

        {payments.length === 0 && parseFloat(plan.down_payment) === 0 && (
          <Text style={styles.emptyText}>No payments received yet</Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Payment Modal */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment</Text>
              <TouchableOpacity onPress={() => setShowPayModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalPending}>
              Pending: Rs.{remaining.toLocaleString('en-IN')}
            </Text>

            <Text style={styles.modalLabel}>Amount Received (Rs.)</Text>
            <TextInput
              style={styles.modalInput}
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <Text style={styles.modalLabel}>Payment Mode</Text>
            <View style={styles.modeRow}>
              {['cash', 'upi', 'bank_transfer'].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeBtn, payMode === m && styles.modeBtnActive]}
                  onPress={() => setPayMode(m)}
                >
                  <Text style={[styles.modeText, payMode === m && styles.modeTextActive]}>
                    {m === 'bank_transfer' ? 'Bank' : m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Note (optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={payNote}
              onChangeText={setPayNote}
              placeholder="Any note..."
              placeholderTextColor={Colors.textMuted}
            />

            <TouchableOpacity onPress={handleAddPayment} disabled={paying} activeOpacity={0.8}>
              <LinearGradient colors={[Colors.success, '#059669']} style={styles.modalSubmitBtn}>
                <Text style={styles.modalSubmitText}>
                  {paying ? 'Saving...' : 'Record Payment'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: Colors.success + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  completedText: { fontSize: 13, fontWeight: '700', color: Colors.success },
  addPaymentBtn: { marginHorizontal: 18, marginBottom: 16 },
  addPaymentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  addPaymentText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  instCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: 18,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  instNumber: { fontSize: 14, fontWeight: '600', color: Colors.text },
  instDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  instPaidInfo: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  instRecordedBy: { fontSize: 11, color: Colors.primary, marginTop: 2, fontWeight: '500' },
  instAmount: { fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: 20 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalPending: { fontSize: 15, color: Colors.danger, fontWeight: '700', marginBottom: 16 },
  modalLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6, fontWeight: '600' },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBtnActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  modeText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  modeTextActive: { color: Colors.primary },
  modalSubmitBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalSubmitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

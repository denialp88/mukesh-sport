import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getRepairJob, updateRepairStatus } from '../services/api';
import { Colors } from '../theme/colors';

const STATUS_FLOW = ['received', 'in_progress', 'ready_for_pickup', 'delivered'];
const STATUS_LABELS = {
  received: 'Received',
  in_progress: 'In Progress',
  ready_for_pickup: 'Ready for Pickup',
  delivered: 'Delivered',
};
const STATUS_ICONS = {
  received: 'download-outline',
  in_progress: 'construct-outline',
  ready_for_pickup: 'checkmark-circle-outline',
  delivered: 'cube-outline',
};

export default function RepairDetailScreen({ route }) {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await getRepairJob(jobId);
      setJob(res.data.job);
      setHistory(res.data.history);
    } catch (err) {
      console.error('Fetch repair detail error:', err);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const sendWhatsApp = async (phone, text) => {
    const cleaned = phone.replace(/\D/g, '');
    const phone91 = cleaned.startsWith('91') ? cleaned : '91' + cleaned;
    const msg = encodeURIComponent(text);
    Linking.openURL('https://wa.me/' + phone91 + '?text=' + msg);
  };

  const getTrackUrl = () => 'http://54-82-92-185.nip.io/r/' + (job?.job_id || '');

  const handleStatusUpdate = (newStatus) => {
    Alert.alert(
      'Update Status',
      'Change status to "' + STATUS_LABELS[newStatus] + '"?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await updateRepairStatus(jobId, { status: newStatus });
              fetchData();

              if (newStatus === 'ready_for_pickup' && job?.customer_phone) {
                const trackUrl = getTrackUrl();
                Alert.alert(
                  'Status Updated!',
                  'Notify customer on WhatsApp?',
                  [
                    { text: 'Skip' },
                    {
                      text: 'Send WhatsApp',
                      onPress: () => sendWhatsApp(job.customer_phone,
                        '*Mukesh Sport* 🏏\n' +
                        '━━━━━━━━━━━━━━\n\n' +
                        '✅ *Your item is Ready for Pickup!*\n\n' +
                        '📋 *Job ID:* ' + job.job_id + '\n' +
                        '🏷️ *Item:* ' + job.item_name + '\n\n' +
                        '📍 Please visit our store to collect your item.\n\n' +
                        '👇 *Track status:*\n\n' +
                        trackUrl + '\n\n' +
                        '━━━━━━━━━━━━━━\n' +
                        'Thank you for choosing Mukesh Sport!'
                      ),
                    },
                  ]
                );
              } else if (newStatus === 'delivered') {
                Alert.alert(
                  'Payment Status',
                  'Is the payment received for this repair?',
                  [
                    {
                      text: 'Not Yet',
                      style: 'cancel',
                      onPress: () => Alert.alert('Done', 'Marked as delivered. Payment pending.'),
                    },
                    {
                      text: '✅ Yes, Received',
                      onPress: async () => {
                        try {
                          await updateRepairStatus(jobId, { payment_received: true });
                          fetchData();
                          Alert.alert('Done', 'Marked as delivered & payment received!');
                        } catch (e) {
                          Alert.alert('Done', 'Marked as delivered. Could not update payment status.');
                        }
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Success', 'Status updated!');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to update status.');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!job) return;
    const trackUrl = getTrackUrl();
    const msg =
      '*Mukesh Sport* 🏏\n' +
      '━━━━━━━━━━━━━━\n\n' +
      '🔧 *Repair Status Update*\n\n' +
      '📋 *Job ID:* ' + job.job_id + '\n' +
      '🏷️ *Item:* ' + job.item_name + '\n' +
      '📌 *Status:* ' + STATUS_LABELS[job.status] + '\n\n' +
      '👇 *Track your repair:*\n\n' +
      trackUrl + '\n\n' +
      '━━━━━━━━━━━━━━\n' +
      'Thank you for choosing Mukesh Sport!';
    sendWhatsApp(job.customer_phone, msg);
  };

  if (!job) return <View style={styles.container} />;

  const currentIdx = STATUS_FLOW.indexOf(job.status);
  const nextStatus = currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header Card */}
        <LinearGradient
          colors={['rgba(139,92,246,0.12)', 'rgba(249,115,22,0.06)']}
          style={styles.headerCard}
        >
          <View style={styles.headerTop}>
            <Text style={styles.jobIdText}>{job.job_id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: (Colors[job.status] || Colors.received) + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: Colors[job.status] || Colors.received }]}>
                {STATUS_LABELS[job.status]}
              </Text>
            </View>
          </View>

          <Text style={styles.itemName}>{job.item_name}</Text>
          {job.problem_description ? (
            <Text style={styles.problemText}>{job.problem_description}</Text>
          ) : null}

          <View style={styles.customerRow}>
            <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.customerText}>{job.customer_name}</Text>
            <Ionicons name="call-outline" size={16} color={Colors.textSecondary} style={{ marginLeft: 12 }} />
            <Text style={styles.customerText}>{job.customer_phone}</Text>
          </View>

          {/* Progress Steps */}
          <View style={styles.progressRow}>
            {STATUS_FLOW.map((s, i) => {
              const isActive = i === currentIdx;
              const isDone = i < currentIdx;
              return (
                <View key={s} style={styles.progressStep}>
                  <View style={[
                    styles.progressDot,
                    isDone && styles.progressDotDone,
                    isActive && styles.progressDotActive,
                  ]}>
                    <Ionicons
                      name={isDone ? 'checkmark' : STATUS_ICONS[s]}
                      size={16}
                      color={isDone || isActive ? '#fff' : Colors.textMuted}
                    />
                  </View>
                  <Text style={[
                    styles.progressLabel,
                    (isDone || isActive) && { color: Colors.text },
                  ]}>
                    {STATUS_LABELS[s].split(' ')[0]}
                  </Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <InfoRow label="Received" value={new Date(job.received_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
          {job.estimated_completion && (
            <InfoRow label="Est. Completion" value={new Date(job.estimated_completion).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
          )}
          {job.estimated_cost && <InfoRow label="Est. Cost" value={'Rs.' + parseFloat(job.estimated_cost).toLocaleString('en-IN')} />}
          {job.final_cost && <InfoRow label="Final Cost" value={'Rs.' + parseFloat(job.final_cost).toLocaleString('en-IN')} highlight />}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {nextStatus && (
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => handleStatusUpdate(nextStatus)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={Colors.gradientGold} style={styles.actionGradient}>
                <Ionicons name={STATUS_ICONS[nextStatus]} size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Mark as {STATUS_LABELS[nextStatus]}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={20} color={Colors.accent} />
            <Text style={styles.shareBtnText}>Share Tracking Link</Text>
          </TouchableOpacity>
        </View>

        {/* Status Timeline */}
        {history.length > 0 && (
          <View style={styles.timelineCard}>
            <Text style={styles.sectionTitle}>Status Timeline</Text>
            {history.map((h, i) => (
              <View key={i} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: Colors[h.status] || Colors.received }]} />
                  {i < history.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>{STATUS_LABELS[h.status] || h.status}</Text>
                  {h.note ? <Text style={styles.timelineNote}>{h.note}</Text> : null}
                  <Text style={styles.timelineDate}>
                    {new Date(h.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, highlight && { color: Colors.primary }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: { fontSize: 14, color: Colors.textSecondary },
  value: { fontSize: 14, fontWeight: '600', color: Colors.text },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerCard: {
    margin: 18,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobIdText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  itemName: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  problemText: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  customerText: { fontSize: 14, color: Colors.textSecondary, marginLeft: 4 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  progressStep: { alignItems: 'center', flex: 1 },
  progressDot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressDotDone: { backgroundColor: Colors.success + '20', borderColor: Colors.success + '40' },
  progressDotActive: {
    backgroundColor: Colors.primary + '25',
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  progressLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 6, fontWeight: '600' },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: 18,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionRow: { paddingHorizontal: 18, marginTop: 16, gap: 10 },
  actionBtnPrimary: { borderRadius: 16, overflow: 'hidden' },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: Colors.accent + '12',
    borderWidth: 1,
    borderColor: Colors.accent + '25',
    gap: 8,
  },
  shareBtnText: { fontSize: 15, fontWeight: '600', color: Colors.accent },
  timelineCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  timelineItem: { flexDirection: 'row', marginBottom: 4 },
  timelineLeft: { alignItems: 'center', width: 24, marginRight: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  timelineContent: { flex: 1, paddingBottom: 18 },
  timelineStatus: { fontSize: 14, fontWeight: '600', color: Colors.text },
  timelineNote: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  timelineDate: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});

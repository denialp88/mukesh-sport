import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getInstallmentDashboard, getRepairDashboard } from '../services/api';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [installmentData, setInstallmentData] = useState(null);
  const [repairData, setRepairData] = useState(null);

  const fetchData = async () => {
    try {
      const [instRes, repairRes] = await Promise.all([
        getInstallmentDashboard(),
        getRepairDashboard(),
      ]);
      setInstallmentData(instRes.data);
      setRepairData(repairRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Background decorative orbs */}
      <View style={styles.bgOrbOrange} />
      <View style={styles.bgOrbPurple} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              <LinearGradient colors={Colors.gradientGold} style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.name || 'M').charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.greetingSub}>Good morning</Text>
              <Text style={styles.greeting}>{user?.name || 'Staff'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => navigation.navigate('InstallmentTab', { screen: 'CreateInstallment' })}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#ff8c2e', '#ff6b1a']}
                style={styles.quickBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.quickBtnIconWrap}>
                  <Ionicons name="card" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.quickBtnLabel}>New</Text>
                  <Text style={styles.quickBtnTitle}>Credit</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={22} color="rgba(255,255,255,0.5)" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => navigation.navigate('RepairTab', { screen: 'CreateRepair' })}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#8b5cf6', '#6d28d9']}
                style={styles.quickBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.quickBtnIconWrap}>
                  <Ionicons name="construct" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.quickBtnLabel}>New</Text>
                  <Text style={styles.quickBtnTitle}>Repair Job</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={22} color="rgba(255,255,255,0.5)" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Credit Entries Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Credit Entries</Text>
            <TouchableOpacity onPress={() => navigation.navigate('InstallmentTab')}>
              <Text style={styles.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statRow}>
            {/* Total Pending */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('InstallmentTab')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(248, 113, 113, 0.12)', 'rgba(248, 113, 113, 0.03)']}
                style={styles.statCardInner}
              >
                <View style={[styles.statIconWrap, { backgroundColor: 'rgba(248,113,113,0.15)' }]}>
                  <Ionicons name="cash-outline" size={16} color={Colors.danger} />
                </View>
                <Text style={styles.statNumber} numberOfLines={1} adjustsFontSizeToFit>{(installmentData?.total_pending || 0).toLocaleString('en-IN')}</Text>
                <Text style={styles.statLabel}>₹ Pending</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Total Credit */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('InstallmentTab')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(251, 191, 36, 0.12)', 'rgba(251, 191, 36, 0.03)']}
                style={styles.statCardInner}
              >
                <View style={[styles.statIconWrap, { backgroundColor: 'rgba(251,191,36,0.15)' }]}>
                  <Ionicons name="wallet" size={16} color={Colors.warning} />
                </View>
                <Text style={styles.statNumber} numberOfLines={1} adjustsFontSizeToFit>{(installmentData?.total_credit || 0).toLocaleString('en-IN')}</Text>
                <Text style={styles.statLabel}>₹ Credit</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Active Entries */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('InstallmentTab')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(96, 165, 250, 0.12)', 'rgba(96, 165, 250, 0.03)']}
                style={styles.statCardInner}
              >
                <View style={[styles.statIconWrap, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
                  <Ionicons name="document-text" size={16} color={Colors.info} />
                </View>
                <Text style={styles.statNumber}>{installmentData?.active_count || 0}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Repair Jobs Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Repair Jobs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RepairTab')}>
              <Text style={styles.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.repairGrid}>
            {[
              { key: 'received', label: 'Received', icon: 'download', color: Colors.received },
              { key: 'in_progress', label: 'Working', icon: 'construct', color: Colors.in_progress },
              { key: 'ready_for_pickup', label: 'Ready', icon: 'checkmark-circle', color: Colors.ready_for_pickup },
            ].map((item) => (
              <View key={item.key} style={styles.repairCard}>
                <View style={[styles.repairIconWrap, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={styles.repairCount}>{repairData?.[item.key] || 0}</Text>
                <Text style={styles.repairLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Total Active Repairs Banner */}
          {repairData && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('RepairTab')}
            >
              <LinearGradient
                colors={['rgba(167,139,250,0.12)', 'rgba(255,140,46,0.08)']}
                style={styles.totalActiveCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.totalActiveLeft}>
                  <View style={styles.totalActiveIconWrap}>
                    <Ionicons name="construct" size={20} color={Colors.accent} />
                  </View>
                  <View>
                    <Text style={styles.totalActiveLabel}>Active Repairs</Text>
                    <Text style={styles.totalActiveCount}>{repairData.total_active}</Text>
                  </View>
                </View>
                <View style={styles.totalActiveArrow}>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  bgOrbOrange: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 140, 46, 0.06)',
  },
  bgOrbPurple: {
    position: 'absolute',
    top: 300,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(167, 139, 250, 0.04)',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: { marginRight: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  headerTextWrap: {},
  greetingSub: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 1,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Body
  body: {
    paddingHorizontal: 18,
    paddingBottom: 100,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 28,
  },
  quickBtn: { flex: 1 },
  quickBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  quickBtnIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  quickBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginTop: -1,
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Stat Cards
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardInner: {
    padding: 14,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    minWidth: 50,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  statAmount: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  // Repair Grid
  repairGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  repairCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  repairIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  repairCount: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  repairLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  // Total Active
  totalActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  totalActiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  totalActiveIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(167,139,250,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalActiveLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  totalActiveCount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  totalActiveArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

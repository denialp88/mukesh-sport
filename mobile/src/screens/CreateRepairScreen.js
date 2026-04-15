import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getCustomers, createCustomer, createRepairJob } from '../services/api';
import { Colors } from '../theme/colors';

export default function CreateRepairScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Customer
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [showNewForm, setShowNewForm] = useState(false);

  // Repair
  const [itemName, setItemName] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [searchText]);

  const fetchCustomers = async () => {
    try {
      const res = await getCustomers(searchText);
      setCustomers(res.data.customers);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      Alert.alert('Error', 'Name and phone are required.');
      return;
    }
    try {
      const res = await createCustomer(newCustomer);
      setSelectedCustomer(res.data.customer);
      setShowNewForm(false);
      setStep(2);
    } catch (err) {
      Alert.alert('Error', 'Failed to create customer.');
    }
  };

  const handleSubmit = async () => {
    if (!itemName) {
      Alert.alert('Error', 'Item name is required.');
      return;
    }
    setLoading(true);
    try {
      let estimatedCompletion = null;
      if (estimatedDays) {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(estimatedDays));
        estimatedCompletion = d.toISOString().split('T')[0];
      }

      const res = await createRepairJob({
        customer_id: selectedCustomer.id,
        item_name: itemName,
        problem_description: problemDesc,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
        estimated_completion: estimatedCompletion,
        notes,
      });

      const trackingUrl = res.data.tracking_url;
      const jobId = res.data.job.job_id;

      // Navigate back first so list refreshes immediately
      navigation.goBack();

      // Shorten URL via TinyURL so WhatsApp makes it clickable
      let shortUrl = trackingUrl;
      try {
        const tinyRes = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(trackingUrl));
        if (tinyRes.ok) shortUrl = await tinyRes.text();
      } catch (e) {}

      // Send tracking link via WhatsApp
      const customerPhone = selectedCustomer.phone.replace(/\D/g, '');
      const phone91 = customerPhone.startsWith('91') ? customerPhone : '91' + customerPhone;
      const message = encodeURIComponent(
        '*Mukesh Sport* 🏏\n' +
        '━━━━━━━━━━━━━━\n\n' +
        '🔧 *Repair Job Created*\n\n' +
        '📋 *Job ID:* ' + jobId + '\n' +
        '🏷️ *Item:* ' + itemName + '\n\n' +
        '👇 *Track your repair status:*\n\n' +
        shortUrl + '\n\n' +
        '━━━━━━━━━━━━━━\n' +
        'Thank you for choosing Mukesh Sport!'
      );

      setTimeout(() => {
        Alert.alert(
          'Repair Job Created!',
          'Job ID: ' + jobId,
          [
            { text: 'Done' },
            {
              text: 'Send on WhatsApp',
              onPress: () => {
                Linking.openURL('https://wa.me/' + phone91 + '?text=' + message);
              },
            },
          ]
        );
      }, 300);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create repair job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Step Indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
            <Text style={styles.stepNum}>2</Text>
          </View>
        </View>
        <Text style={styles.stepLabel}>
          {step === 1 ? 'Select Customer' : 'Repair Details'}
        </Text>

        {step === 1 && (
          <View>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search customer by name or phone"
                placeholderTextColor={Colors.textMuted}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {customers.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.customerCard}
                onPress={() => { setSelectedCustomer(c); setStep(2); }}
              >
                <View style={styles.customerAvatar}>
                  <Ionicons name="person" size={20} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{c.name}</Text>
                  <Text style={styles.customerPhone}>{c.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.addNewBtn}
              onPress={() => setShowNewForm(!showNewForm)}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.accent} />
              <Text style={styles.addNewText}>Add New Customer</Text>
            </TouchableOpacity>

            {showNewForm && (
              <View style={styles.newForm}>
                <InputField label="Name" value={newCustomer.name} onChangeText={(v) => setNewCustomer({ ...newCustomer, name: v })} />
                <InputField label="Phone" value={newCustomer.phone} onChangeText={(v) => setNewCustomer({ ...newCustomer, phone: v })} keyboardType="phone-pad" />
                <InputField label="Address" value={newCustomer.address} onChangeText={(v) => setNewCustomer({ ...newCustomer, address: v })} />
                <TouchableOpacity onPress={handleCreateCustomer} activeOpacity={0.8}>
                  <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.submitBtn}>
                    <Text style={styles.submitBtnText}>Create & Continue</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {step === 2 && (
          <View>
            {selectedCustomer && (
              <View style={styles.selectedBox}>
                <Ionicons name="person-circle" size={24} color={Colors.accent} />
                <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.changeBtn}>Change</Text>
                </TouchableOpacity>
              </View>
            )}

            <InputField label="Item Name *" value={itemName} onChangeText={setItemName} placeholder="e.g. Cricket Bat, Treadmill Belt" />
            <InputField label="Problem Description" value={problemDesc} onChangeText={setProblemDesc} placeholder="Describe the issue..." multiline />
            <InputField label="Estimated Cost (Rs.)" value={estimatedCost} onChangeText={setEstimatedCost} keyboardType="numeric" />
            <InputField label="Estimated Days to Complete" value={estimatedDays} onChangeText={setEstimatedDays} keyboardType="numeric" placeholder="e.g. 3" />
            <InputField label="Notes" value={notes} onChangeText={setNotes} placeholder="Any internal notes..." multiline />

            <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.submitBtn}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="construct" size={20} color="#fff" />
                    <Text style={styles.submitBtnText}>Register Repair Job</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InputField({ label, value, onChangeText, placeholder, keyboardType, multiline }) {
  return (
    <View style={ifStyles.container}>
      <Text style={ifStyles.label}>{label}</Text>
      <TextInput
        style={[ifStyles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
      />
    </View>
  );
}

const ifStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8, fontWeight: '600', letterSpacing: 0.3 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 15,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, paddingBottom: 40 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepDot: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.accent + '18',
    borderColor: Colors.accent,
  },
  stepNum: { fontSize: 14, fontWeight: '700', color: Colors.text },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  stepLineActive: { backgroundColor: Colors.accent },
  stepLabel: {
    textAlign: 'center',
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, marginLeft: 10 },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  customerPhone: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  addNewText: { fontSize: 14, color: Colors.accent, fontWeight: '600' },
  newForm: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  selectedName: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  changeBtn: { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

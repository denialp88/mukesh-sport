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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getCustomers, createCustomer, createInstallmentPlan } from '../services/api';
import { Colors } from '../theme/colors';

export default function CreateInstallmentScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Customer
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [showNewForm, setShowNewForm] = useState(false);

  // Credit Details
  const [productName, setProductName] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [downPayment, setDownPayment] = useState('');
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
    if (!productName || !totalPrice) {
      Alert.alert('Error', 'Product name and total price are required.');
      return;
    }
    setLoading(true);
    try {
      await createInstallmentPlan({
        customer_id: selectedCustomer.id,
        product_name: productName,
        total_price: parseFloat(totalPrice),
        down_payment: parseFloat(downPayment) || 0,
        notes,
      });

      navigation.goBack();
      setTimeout(() => {
        Alert.alert('Success', 'Credit entry created!');
      }, 300);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create entry.');
    } finally {
      setLoading(false);
    }
  };

  const pending = totalPrice
    ? (parseFloat(totalPrice) - (parseFloat(downPayment) || 0)).toFixed(2)
    : '0';

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
          {step === 1 ? 'Select Customer' : 'Product & Payment Details'}
        </Text>

        {step === 1 && (
          <View>
            {/* Search */}
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

            {/* Customer List */}
            {customers.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.customerCard,
                  selectedCustomer?.id === c.id && styles.customerCardSelected,
                ]}
                onPress={() => { setSelectedCustomer(c); setStep(2); }}
              >
                <View style={styles.customerAvatar}>
                  <Ionicons name="person" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{c.name}</Text>
                  <Text style={styles.customerPhone}>{c.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}

            {/* Add New Customer */}
            <TouchableOpacity
              style={styles.addNewBtn}
              onPress={() => setShowNewForm(!showNewForm)}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addNewText}>Add New Customer</Text>
            </TouchableOpacity>

            {showNewForm && (
              <View style={styles.newForm}>
                <InputField label="Name" value={newCustomer.name} onChangeText={(v) => setNewCustomer({ ...newCustomer, name: v })} />
                <InputField label="Phone" value={newCustomer.phone} onChangeText={(v) => setNewCustomer({ ...newCustomer, phone: v })} keyboardType="phone-pad" />
                <InputField label="Address" value={newCustomer.address} onChangeText={(v) => setNewCustomer({ ...newCustomer, address: v })} />
                <TouchableOpacity onPress={handleCreateCustomer} activeOpacity={0.8}>
                  <LinearGradient colors={Colors.gradientGold} style={styles.submitBtn}>
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
                <Ionicons name="person-circle" size={24} color={Colors.primary} />
                <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.changeBtn}>Change</Text>
                </TouchableOpacity>
              </View>
            )}

            <InputField label="Product / Item Name *" value={productName} onChangeText={setProductName} placeholder="e.g. Cricket Bat, Treadmill" />
            <InputField label="Total Price (Rs.) *" value={totalPrice} onChangeText={setTotalPrice} keyboardType="numeric" placeholder="e.g. 10000" />
            <InputField label="Amount Paid Now (Rs.)" value={downPayment} onChangeText={setDownPayment} keyboardType="numeric" placeholder="e.g. 2000" />
            <InputField label="Notes" value={notes} onChangeText={setNotes} placeholder="Any notes about this credit..." />

            {/* Pending Preview */}
            {totalPrice ? (
              <View style={styles.emiBox}>
                <Text style={styles.emiLabel}>Pending Amount</Text>
                <Text style={[styles.emiValue, { color: parseFloat(pending) > 0 ? Colors.danger : Colors.success }]}>
                  Rs. {parseFloat(pending).toLocaleString('en-IN')}
                </Text>
                {parseFloat(downPayment) > 0 ? (
                  <Text style={styles.emiSub}>
                    Paid Rs. {parseFloat(downPayment).toLocaleString('en-IN')} of Rs. {parseFloat(totalPrice).toLocaleString('en-IN')}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={Colors.gradientGold} style={styles.submitBtn}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Credit Entry</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InputField({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={ifStyles.container}>
      <Text style={ifStyles.label}>{label}</Text>
      <TextInput
        style={ifStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType || 'default'}
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
    backgroundColor: Colors.primary + '18',
    borderColor: Colors.primary,
  },
  stepNum: { fontSize: 14, fontWeight: '700', color: Colors.text },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  stepLineActive: { backgroundColor: Colors.primary },
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
  customerCardSelected: { borderColor: Colors.primary },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
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
  addNewText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
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
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  selectedName: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  changeBtn: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  fieldLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  freqRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freqBtnActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  freqText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  freqTextActive: { color: Colors.primary },
  emiBox: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  emiLabel: { fontSize: 13, color: Colors.textSecondary },
  emiValue: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginTop: 4 },
  emiSub: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

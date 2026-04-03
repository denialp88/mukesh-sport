import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter phone and password.');
      return;
    }
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check your credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#080d1a', '#0c1529', '#111d38']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative gradient orbs */}
      <View style={styles.orbOrange} />
      <View style={styles.orbPurple} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoOuter}>
            <LinearGradient
              colors={['#ff8c2e', '#ff6b1a', '#ff4081']}
              style={styles.logoCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="basketball" size={36} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>MUKESH SPORT</Text>
          <Text style={styles.tagline}>Staff Management</Text>
        </View>

        {/* Form Card - Glassmorphism */}
        <View style={styles.formCard}>
          <LinearGradient
            colors={['rgba(26, 34, 54, 0.7)', 'rgba(17, 24, 42, 0.85)']}
            style={styles.formCardInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.subText}>Sign in to your account</Text>

            {/* Phone Input */}
            <View style={[
              styles.inputContainer,
              phoneFocused && styles.inputFocused,
            ]}>
              <View style={styles.inputIconWrap}>
                <Ionicons name="call" size={16} color={phoneFocused ? Colors.primary : Colors.textMuted} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
              />
            </View>

            {/* Password Input */}
            <View style={[
              styles.inputContainer,
              passFocused && styles.inputFocused,
            ]}>
              <View style={styles.inputIconWrap}>
                <Ionicons name="lock-closed" size={16} color={passFocused ? Colors.primary : Colors.textMuted} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={['#ff8c2e', '#ff6b1a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Sign In</Text>
                    <View style={styles.loginBtnArrow}>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>Mukesh Sport v1.0</Text>
          <View style={styles.footerDot} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080d1a' },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  // Decorative blurred orbs
  orbOrange: {
    position: 'absolute',
    top: height * 0.08,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 140, 46, 0.08)',
  },
  orbPurple: {
    position: 'absolute',
    bottom: height * 0.15,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(167, 139, 250, 0.06)',
  },
  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoOuter: {
    width: 80,
    height: 80,
    borderRadius: 24,
    padding: 2,
    marginBottom: 16,
  },
  logoCircle: {
    flex: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff6b1a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // Form Card
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  formCardInner: {
    padding: 28,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 6,
    marginBottom: 28,
  },
  // Inputs
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
    paddingHorizontal: 4,
    height: 56,
  },
  inputFocused: {
    borderColor: 'rgba(255, 140, 46, 0.4)',
    backgroundColor: 'rgba(255, 140, 46, 0.04)',
  },
  inputIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 10,
  },
  // Login Button
  loginBtn: {
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#ff6b1a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  loginBtnArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    gap: 8,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
    letterSpacing: 1,
  },
});

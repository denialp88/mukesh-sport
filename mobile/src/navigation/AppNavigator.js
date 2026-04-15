import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

import DashboardScreen from '../screens/DashboardScreen';
import InstallmentListScreen from '../screens/InstallmentListScreen';
import InstallmentDetailScreen from '../screens/InstallmentDetailScreen';
import CreateInstallmentScreen from '../screens/CreateInstallmentScreen';
import RepairListScreen from '../screens/RepairListScreen';
import RepairDetailScreen from '../screens/RepairDetailScreen';
import CreateRepairScreen from '../screens/CreateRepairScreen';

const Tab = createBottomTabNavigator();
const InstallmentStack = createNativeStackNavigator();
const RepairStack = createNativeStackNavigator();
const DashboardStack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: Colors.background,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: Colors.text,
  headerTitleStyle: { fontWeight: '700', fontSize: 17, letterSpacing: -0.2 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: Colors.background },
};

function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator screenOptions={screenOptions}>
      <DashboardStack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
    </DashboardStack.Navigator>
  );
}

function InstallmentStackScreen() {
  return (
    <InstallmentStack.Navigator screenOptions={screenOptions}>
      <InstallmentStack.Screen
        name="InstallmentList"
        component={InstallmentListScreen}
        options={{ title: 'Credit Entries' }}
      />
      <InstallmentStack.Screen
        name="InstallmentDetail"
        component={InstallmentDetailScreen}
        options={{ title: 'Credit Details' }}
      />
      <InstallmentStack.Screen
        name="CreateInstallment"
        component={CreateInstallmentScreen}
        options={{ title: 'New Credit Entry' }}
      />
    </InstallmentStack.Navigator>
  );
}

function RepairStackScreen() {
  return (
    <RepairStack.Navigator screenOptions={screenOptions}>
      <RepairStack.Screen
        name="RepairList"
        component={RepairListScreen}
        options={{ title: 'Repair Jobs' }}
      />
      <RepairStack.Screen
        name="RepairDetail"
        component={RepairDetailScreen}
        options={{ title: 'Job Details' }}
      />
      <RepairStack.Screen
        name="CreateRepair"
        component={CreateRepairScreen}
        options={{ title: 'New Repair Job' }}
      />
    </RepairStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0c1120',
          borderTopColor: 'rgba(255,255,255,0.04)',
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'InstallmentTab') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'RepairTab') {
            iconName = focused ? 'construct' : 'construct-outline';
          }
          return (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 28,
              borderRadius: 14,
              backgroundColor: focused ? color + '18' : 'transparent',
            }}>
              <Ionicons name={iconName} size={20} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={DashboardStackScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="InstallmentTab"
        component={InstallmentStackScreen}
        options={{ tabBarLabel: 'Credit' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('InstallmentTab', { screen: 'InstallmentList' });
          },
        })}
      />
      <Tab.Screen
        name="RepairTab"
        component={RepairStackScreen}
        options={{ tabBarLabel: 'Repairs' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('RepairTab', { screen: 'RepairList' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

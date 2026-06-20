import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
  MainTabParamList,
  HomeStackParamList,
  SendStackParamList,
  ActivityStackParamList,
  CardsStackParamList,
  ProfileStackParamList,
} from '../types/navigation';
import { colors } from '../theme/colors';

import { DashboardScreen }        from '../screens/home/DashboardScreen';
import { AccountDetailScreen }    from '../screens/home/AccountDetailScreen';
import { SendToScreen }           from '../screens/send/SendToScreen';
import { EnterAmountScreen }      from '../screens/send/EnterAmountScreen';
import { ReviewScreen }           from '../screens/send/ReviewScreen';
import { ConfirmationScreen }     from '../screens/send/ConfirmationScreen';
import { TransactionListScreen }  from '../screens/activity/TransactionListScreen';
import { TransactionDetailScreen} from '../screens/activity/TransactionDetailScreen';
import { CardsScreen }            from '../screens/cards/CardsScreen';
import { ProfileScreen }          from '../screens/profile/ProfileScreen';
import { KYCScreen }              from '../screens/profile/KYCScreen';

const Tab         = createBottomTabNavigator<MainTabParamList>();
const HomeStack   = createNativeStackNavigator<HomeStackParamList>();
const SendStack   = createNativeStackNavigator<SendStackParamList>();
const ActStack    = createNativeStackNavigator<ActivityStackParamList>();
const CardStack   = createNativeStackNavigator<CardsStackParamList>();
const ProfStack   = createNativeStackNavigator<ProfileStackParamList>();

const TAB_META: Record<string, { label: string; icon: string; iconActive: string }> = {
  HomeTab:     { label: 'Home',     icon: 'home-outline',        iconActive: 'home' },
  SendTab:     { label: 'Transfer', icon: 'paper-plane-outline', iconActive: 'paper-plane' },
  ActivityTab: { label: 'Activity', icon: 'receipt-outline',     iconActive: 'receipt' },
  CardsTab:    { label: 'Cards',    icon: 'card-outline',        iconActive: 'card' },
  ProfileTab:  { label: 'Profile',  icon: 'person-outline',      iconActive: 'person' },
};

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={tabStyles.wrapper} pointerEvents="box-none">
      <View style={tabStyles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = TAB_META[route.name];

          return (
            <TouchableOpacity
              key={route.key}
              style={tabStyles.tab}
              activeOpacity={0.75}
              onPress={() => navigation.navigate(route.name)}
            >
              <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
                <Ionicons
                  name={(focused ? meta.iconActive : meta.icon) as any}
                  size={20}
                  color={focused ? colors.white : colors.primary}
                />
              </View>
              <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
                {meta.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard"     component={DashboardScreen} />
      <HomeStack.Screen name="AccountDetail" component={AccountDetailScreen} />
    </HomeStack.Navigator>
  );
}
function SendNavigator() {
  return (
    <SendStack.Navigator screenOptions={{ headerShown: false }}>
      <SendStack.Screen name="SendTo"       component={SendToScreen} />
      <SendStack.Screen name="EnterAmount"  component={EnterAmountScreen} />
      <SendStack.Screen name="Review"       component={ReviewScreen} />
      <SendStack.Screen name="Confirmation" component={ConfirmationScreen} />
    </SendStack.Navigator>
  );
}
function ActivityNavigator() {
  return (
    <ActStack.Navigator screenOptions={{ headerShown: false }}>
      <ActStack.Screen name="TransactionList"   component={TransactionListScreen} />
      <ActStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    </ActStack.Navigator>
  );
}
function CardsNavigator() {
  return (
    <CardStack.Navigator screenOptions={{ headerShown: false }}>
      <CardStack.Screen name="CardsList" component={CardsScreen} />
    </CardStack.Navigator>
  );
}
function ProfileNavigator() {
  return (
    <ProfStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfStack.Screen name="KYC"         component={KYCScreen} />
    </ProfStack.Navigator>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab"     component={HomeNavigator} />
      <Tab.Screen name="SendTab"     component={SendNavigator} />
      <Tab.Screen name="ActivityTab" component={ActivityNavigator} />
      <Tab.Screen name="CardsTab"    component={CardsNavigator} />
      <Tab.Screen name="ProfileTab"  component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 12 : 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
    alignItems: 'center',
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
    paddingVertical: 2,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  iconWrapActive: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});

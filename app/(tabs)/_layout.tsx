import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../constants/Colors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useThemeColor();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          elevation: 0,
          shadowOpacity: 0,
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          tabBarIcon: ({ color }) => <FontAwesome5 name="clock" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: 'Remédios',
          tabBarIcon: ({ color }) => <FontAwesome5 name="pills" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Desempenho',
          tabBarIcon: ({ color }) => <FontAwesome5 name="calendar-alt" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => <FontAwesome5 name="history" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}

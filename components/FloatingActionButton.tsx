import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FloatingActionButton() {
  const router = useRouter();
  const theme = useThemeColor();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity 
      style={[
        styles.fab, 
        { 
          backgroundColor: theme.primary,
          bottom: insets.bottom + 80 // Baseia-se nos Insets em ambas as plataformas
        }
      ]}
      activeOpacity={0.8}
      onPress={() => router.push('/add')}
    >
      <FontAwesome5 name="plus" size={24} color="#ffffff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  }
});

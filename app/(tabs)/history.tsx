import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { getMedications, Medication } from '../../utils/storage';
import { useThemeColor } from '../../constants/Colors';

export default function HistoryScreen() {
  const router = useRouter();
  const theme = useThemeColor();
  const s = styles(theme);
  const [historyMeds, setHistoryMeds] = useState<Medication[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    const data = await getMedications();
    // Filtramos os interrompidos e concluídos
    setHistoryMeds(data.filter(m => m.status === 'interrupted' || m.status === 'finished'));
  };

  const getMedIcon = (type?: string) => {
    switch (type) {
      case 'cápsula': return 'capsules';
      case 'gotas': return 'tint';
      case 'xarope': return 'prescription-bottle';
      case 'suspensão': return 'flask';
      case 'pomada': return 'band-aid';
      default: return 'pills';
    }
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Text style={s.title}>Histórico</Text>
          <Text style={s.subtitle}>Tratamentos concluídos ou interrompidos</Text>
        </View>

        {historyMeds.length === 0 ? (
          <View style={s.emptyContainer}>
             <FontAwesome5 name="archive" size={48} color={theme.disabled} />
             <Text style={s.emptyText}>Nenhum registro no histórico.</Text>
          </View>
        ) : (
          <View style={s.listContainer}>
            {historyMeds.map((med, index) => (
              <TouchableOpacity 
                key={index} 
                style={s.card} 
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/details', params: { medId: med.id } })}
              >
                <View style={s.cardHeader}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={s.iconContainer}>
                       <FontAwesome5 name={getMedIcon(med.type)} size={16} color={theme.textSecondary} />
                    </View>
                    <View style={s.timeContainer}>
                      <Text style={s.timeText}>
                        {med.status === 'finished' ? 'Concluído' : 'Interrompido'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Text style={s.medName}>{med.name}</Text>
                
                <View style={s.infoRow}>
                  <Text style={s.infoText}>{med.frequency}</Text>
                  <Text style={s.bullet}>•</Text>
                  <Text style={s.infoText}>{med.duration}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
  },
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
    opacity: 0.8, // Histórico fica levemente opaco
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  medName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  bullet: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '900',
  }
});

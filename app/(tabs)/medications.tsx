import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { getMedications, Medication } from '../../utils/storage';
import { useThemeColor } from '../../constants/Colors';

export default function MedicationsScreen() {
  const router = useRouter();
  const theme = useThemeColor();
  const s = styles(theme);
  const [meds, setMeds] = useState<Medication[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [])
  );

  const loadMedications = async () => {
    const data = await getMedications();
    setMeds(data.filter(m => m.status === 'active'));
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
          <Text style={s.title}>Meus Remédios</Text>
          <Text style={s.subtitle}>Gerencie seus tratamentos em andamento</Text>
        </View>

        {meds.length === 0 ? (
          <View style={s.emptyContainer}>
             <FontAwesome5 name="pills" size={48} color={theme.disabled} />
             <Text style={s.emptyText}>Nenhum remédio ativo.</Text>
             <TouchableOpacity style={s.addButton} onPress={() => router.push('/add')}>
                <Text style={s.addButtonText}>Cadastrar um Remédio</Text>
             </TouchableOpacity>
          </View>
        ) : (
          <View style={s.listContainer}>
            {meds.map((med, index) => (
              <TouchableOpacity 
                key={index} 
                style={s.card} 
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/details', params: { medId: med.id } })}
              >
                <View style={s.cardHeader}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={s.iconContainer}>
                       <FontAwesome5 name={getMedIcon(med.type)} size={16} color={theme.primary} />
                    </View>
                    <View style={s.timeContainer}>
                      <FontAwesome5 name="clock" size={12} color={theme.textSecondary} />
                      <Text style={s.timeText}>{med.time}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={s.editButton} onPress={() => router.push({ pathname: '/edit', params: { medId: med.id } })}>
                    <FontAwesome5 name="pen" size={14} color={theme.textSecondary} />
                  </TouchableOpacity>
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

      {meds.length > 0 && (
        <TouchableOpacity style={s.fab} activeOpacity={0.8} onPress={() => router.push('/add')}>
          <FontAwesome5 name="plus" size={20} color="#ffffff" />
        </TouchableOpacity>
      )}
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
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
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
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: theme.infoBackground,
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
  editButton: {
    padding: 8,
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
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  }
});

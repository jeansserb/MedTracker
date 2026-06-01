import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { getAgendaDoses, DailyDose } from '../../utils/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [doses, setDoses] = useState<DailyDose[]>([]);

  const dateObj = new Date();
  const todayFormatted = dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const todayDoses = await getAgendaDoses();
    setDoses(todayDoses);
  };

  const handlePressDose = (dose: DailyDose) => {
    router.push({
      pathname: '/details',
      params: {
        medId: dose.medication.id,
        scheduledTime: dose.scheduledDateTime.toISOString(),
        status: dose.status,
        isLastDose: dose.isLastDose ? 'true' : 'false'
      }
    });
  };

  // Group doses by medication ID
  const groupedDoses = doses.reduce((acc, dose) => {
    if (!acc[dose.medication.id]) {
      acc[dose.medication.id] = [];
    }
    acc[dose.medication.id].push(dose);
    return acc;
  }, {} as Record<string, DailyDose[]>);

  const medGroups = Object.values(groupedDoses);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.dateText}>Próximas Doses</Text>
        <Text style={styles.subtitle}>Sua agenda de medicamentos</Text>
      </View>

      <View style={styles.listContainer}>
        {medGroups.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma dose pendente ou atrasada.</Text>
        ) : null}

        {medGroups.map((group) => {
          const med = group[0].medication;
          
          // O foco principal (Dose Primária) é a primeira que está pendente ou atrasada
          let primaryDose = group.find(d => d.status === 'delayed' || d.status === 'pending');
          // Se todas foram resolvidas, mostramos a última dose do dia como primária
          if (!primaryDose) {
            primaryDose = group[group.length - 1]; 
          }

          const isTaken = primaryDose.status === 'taken';
          const isDelayed = primaryDose.status === 'delayed';
          const isDismissed = primaryDose.status === 'dismissed';
          
          return (
            <View key={med.id} style={styles.groupContainer}>
              {/* CARTÃO PRINCIPAL DA PRÓXIMA DOSE */}
              <TouchableOpacity 
                style={[
                  styles.card, 
                  isTaken && styles.cardTaken,
                  isDelayed && styles.cardDelayed,
                  isDismissed && styles.cardDismissed
                ]}
                activeOpacity={0.7}
                onPress={() => handlePressDose(primaryDose)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.timeContainer}>
                    <FontAwesome5 
                      name="clock" 
                      size={14} 
                      color={isDelayed ? '#ef4444' : isTaken ? '#10b981' : isDismissed ? '#9ca3af' : '#6b7280'} 
                    />
                    <Text style={[
                      styles.timeText, 
                      isTaken && styles.timeTextTaken,
                      isDelayed && styles.timeTextDelayed,
                      isDismissed && styles.timeTextDismissed
                    ]}>
                      {primaryDose.scheduledDateTime.getHours().toString().padStart(2, '0')}:{primaryDose.scheduledDateTime.getMinutes().toString().padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={[
                    styles.checkbox, 
                    isTaken && styles.checkboxChecked,
                    isDelayed && styles.checkboxDelayed,
                    isDismissed && styles.checkboxDismissed
                  ]}>
                    {isTaken && <FontAwesome5 name="check" size={14} color="#fff" />}
                    {isDelayed && <FontAwesome5 name="exclamation" size={14} color="#fff" />}
                    {isDismissed && <FontAwesome5 name="times" size={14} color="#9ca3af" />}
                  </View>
                </View>
                <Text style={[
                  styles.medName, 
                  isTaken && styles.medNameTaken,
                  isDismissed && styles.medNameDismissed,
                  isDelayed && styles.medNameDelayed
                ]}>{med.name}</Text>
                
                <Text style={[styles.medType, isTaken && styles.medTypeTaken]}>
                  {med.type ? (med.type.charAt(0).toUpperCase() + med.type.slice(1)) : 'Remédio'} 
                  {primaryDose.isLastDose ? ' • Última Dose!' : ''}
                </Text>
              </TouchableOpacity>

              {/* TIMELINE DE DOSES SECUNDÁRIAS */}
              {group.length > 1 && (
                <View style={styles.timelineContainer}>
                  {group.map((dose, idx) => {
                    if (dose === primaryDose) return null; // Não repete a dose primária
                    
                    const subTaken = dose.status === 'taken';
                    const subDelayed = dose.status === 'delayed';
                    const subDismissed = dose.status === 'dismissed';

                    return (
                      <TouchableOpacity 
                        key={idx}
                        style={styles.timelineItem}
                        activeOpacity={0.6}
                        onPress={() => handlePressDose(dose)}
                      >
                        <View style={styles.timelineConnector}>
                          <View style={[
                            styles.timelineDot,
                            subTaken && { backgroundColor: '#10b981', borderColor: '#10b981' },
                            subDelayed && { backgroundColor: '#ef4444', borderColor: '#ef4444' },
                            subDismissed && { backgroundColor: 'transparent', borderColor: '#9ca3af' }
                          ]}>
                            {subTaken && <FontAwesome5 name="check" size={8} color="#fff" />}
                            {subDismissed && <FontAwesome5 name="times" size={8} color="#9ca3af" />}
                          </View>
                          {idx !== group.length - 1 && <View style={styles.timelineLine} />}
                        </View>
                        
                        <View style={styles.timelineContent}>
                          <Text style={[
                            styles.timelineTime,
                            subTaken && { color: '#10b981' },
                            subDelayed && { color: '#ef4444' },
                            subDismissed && { color: '#9ca3af', textDecorationLine: 'line-through' }
                          ]}>
                            {dose.scheduledDateTime.getHours().toString().padStart(2, '0')}:{dose.scheduledDateTime.getMinutes().toString().padStart(2, '0')}
                          </Text>
                          <Text style={styles.timelineStatus}>
                            {subTaken ? 'Tomado' : subDelayed ? 'Atrasado' : subDismissed ? 'Dispensado' : 'Agendado'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  dateText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  listContainer: {
    gap: 24,
  },
  groupContainer: {
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    zIndex: 2,
  },
  cardTaken: {
    backgroundColor: '#ecfdf5',
    borderLeftColor: '#10b981',
    shadowOpacity: 0,
    elevation: 0,
  },
  cardDelayed: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#ef4444',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  delayedCard: {
    borderColor: theme.dangerBackground,
    backgroundColor: theme.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  delayedText: {
    color: theme.danger,
  },
  delayedBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.danger,
    backgroundColor: theme.dangerBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.infoBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  medNameTaken: { color: '#059669', textDecorationLine: 'line-through' },
  medNameDelayed: { color: '#991b1b' },
  medNameDismissed: { color: '#9ca3af', textDecorationLine: 'line-through' },
  medType: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
  medTypeTaken: { color: '#34d399' },
  
  // Timeline Styles
  timelineContainer: {
    marginLeft: 24,
    marginTop: 4,
    paddingLeft: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 40,
  },
  timelineConnector: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginTop: -4,
    marginBottom: -8,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  timelineTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4b5563',
  },
  timelineStatus: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  }
});

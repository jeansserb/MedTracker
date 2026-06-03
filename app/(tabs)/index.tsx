import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { getAgendaDoses, DailyDose } from '../../utils/storage';
import { useThemeColor } from '../../constants/Colors';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useThemeColor();
  const styles = getStyles(theme);
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
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Próximas Doses</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sua agenda de medicamentos</Text>
      </View>

      <View style={styles.listContainer}>
        {medGroups.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhuma dose pendente ou atrasada.</Text>
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
                <View style={[
                  styles.accentBar, 
                  isTaken && { backgroundColor: theme.success },
                  isDelayed && { backgroundColor: theme.danger },
                  isDismissed && { backgroundColor: theme.textSecondary }
                ]} />
                <View style={styles.cardHeader}>
                  <View style={[styles.timeContainer, { backgroundColor: theme.inputBackground }]}>
                    <FontAwesome5 
                      name="clock" 
                      size={14} 
                      color={isDelayed ? theme.danger : isTaken ? theme.success : isDismissed ? theme.textSecondary : theme.textSecondary} 
                    />
                    <Text style={[
                      styles.timeText, 
                      { color: theme.text },
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
                  { color: theme.text },
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
                            { backgroundColor: theme.card, borderColor: theme.border },
                            subTaken && { backgroundColor: theme.success, borderColor: theme.success },
                            subDelayed && { backgroundColor: theme.danger, borderColor: theme.danger },
                            subDismissed && { backgroundColor: 'transparent', borderColor: theme.textSecondary }
                          ]}>
                            {subTaken && <FontAwesome5 name="check" size={8} color="#fff" />}
                            {subDismissed && <FontAwesome5 name="times" size={8} color={theme.textSecondary} />}
                          </View>
                          {idx !== group.length - 1 && <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />}
                        </View>
                        
                        <View style={styles.timelineContent}>
                          <View style={styles.timelineBox}>
                            <Text style={[
                              styles.timelineTime,
                              subTaken && { color: theme.success },
                              subDelayed && { color: theme.danger },
                              subDismissed && { color: theme.textSecondary, textDecorationLine: 'line-through' }
                            ]}>
                              {dose.scheduledDateTime.getHours().toString().padStart(2, '0')}:{dose.scheduledDateTime.getMinutes().toString().padStart(2, '0')}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              {subTaken && <Text style={styles.badgeGreen}>Tomado</Text>}
                              {subDelayed && <Text style={styles.badgeRed}>Atrasado</Text>}
                              {subDismissed && <Text style={styles.badgeGray}>Dispensado</Text>}
                              {(!subTaken && !subDelayed && !subDismissed) && <Text style={styles.badgeBlue}>Pendente</Text>}
                            </View>
                          </View>
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

const getStyles = (theme: any) => StyleSheet.create({
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
  listContainer: {
    gap: 24,
  },
  groupContainer: {
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.textSecondary,
    fontSize: 16,
    marginTop: 20,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 2,
  },
  accentBar: {
    position: 'absolute',
    top: 16, bottom: 16, left: 0,
    width: 5,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: theme.primary,
  },
  cardTaken: {
    backgroundColor: theme.successBackground,
    shadowOpacity: 0,
    elevation: 0,
  },
  cardDelayed: {
    backgroundColor: theme.dangerBackground,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.dangerBackground,
  },
  cardDismissed: {
    backgroundColor: theme.inputBackground,
    elevation: 0,
    shadowOpacity: 0,
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
  timeTextTaken: { textDecorationLine: 'line-through', color: theme.success },
  timeTextDelayed: { color: theme.danger },
  timeTextDismissed: { textDecorationLine: 'line-through', color: theme.textSecondary },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.card,
  },
  checkboxChecked: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  checkboxDelayed: {
    backgroundColor: theme.danger,
    borderColor: theme.danger,
  },
  checkboxDismissed: {
    backgroundColor: theme.inputBackground,
    borderColor: theme.disabledText,
  },
  delayedCard: {
    borderColor: theme.dangerBackground,
    backgroundColor: theme.card,
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
    color: theme.text,
  },
  medNameTaken: { color: theme.success, textDecorationLine: 'line-through' },
  medNameDelayed: { color: theme.danger },
  medNameDismissed: { color: theme.textSecondary, textDecorationLine: 'line-through' },
  medType: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  medTypeTaken: { color: theme.success },
  
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
    borderColor: theme.border,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.border,
    marginTop: -4,
    marginBottom: -8,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  timelineBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  timelineTime: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  badgeGreen: {
    backgroundColor: theme.successBackground,
    color: theme.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  badgeGray: {
    backgroundColor: theme.disabled,
    color: theme.disabledText,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  badgeBlue: {
    backgroundColor: theme.infoBackground,
    color: theme.info,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  badgeRed: {
    backgroundColor: theme.dangerBackground,
    color: theme.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  }
});

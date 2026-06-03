import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { getMedications, getLogs, markDoseStatus, updateMedicationStatus, removeDoseLog, deleteMedication, Medication, TakenLog } from '../utils/storage';
import { useThemeColor } from '../constants/Colors';

export default function DetailsScreen() {
  const router = useRouter();
  const theme = useThemeColor();
  const s = styles(theme);
  
  const { medId, scheduledTime, status: initialStatus, isLastDose } = useLocalSearchParams();
  const isDoseMode = !!scheduledTime;
  
  const [medication, setMedication] = useState<Medication | null>(null);
  const [status, setStatus] = useState<string>(initialStatus as string || 'active');
  const [recentLogs, setRecentLogs] = useState<TakenLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [medId])
  );

  const loadData = async () => {
    const meds = await getMedications();
    const med = meds.find(m => m.id === medId);
    if (med) {
      setMedication(med);
      if (!isDoseMode) {
        setStatus(med.status);
      }
    }
    
    const logs = await getLogs();
    const medLogs = logs
       .filter(l => l.medicationId === medId)
       .sort((a,b) => new Date(b.scheduledDateTime).getTime() - new Date(a.scheduledDateTime).getTime())
       .slice(0, 10);
    setRecentLogs(medLogs);
  };

  const handleInterrupt = () => {
    Alert.alert(
      'Interromper Tratamento',
      'Tem certeza que deseja interromper este tratamento? Ele sairá da sua agenda diária.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Interromper', 
          style: 'destructive',
          onPress: async () => {
            await updateMedicationStatus(medId as string, 'interrupted');
            router.back();
          }
        }
      ]
    );
  };

  const handleResume = () => {
    Alert.alert(
      'Retomar Tratamento',
      'Deseja retomar este tratamento? Ele voltará para a sua agenda.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Retomar', 
          style: 'default',
          onPress: async () => {
            await updateMedicationStatus(medId as string, 'active');
            router.back();
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Medicamento',
      'Tem certeza? Isso apagará o medicamento e TODO o histórico de doses dele permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            await deleteMedication(medId as string);
            router.replace('/(tabs)/medications');
          }
        }
      ]
    );
  };

  const handleUndoDoseAction = (scheduledDateTime: string) => {
    Alert.alert(
      'Desfazer Ação',
      'Deseja desfazer este registro? A dose voltará para o status pendente ou atrasado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desfazer',
          style: 'destructive',
          onPress: async () => {
            await removeDoseLog(medId as string, new Date(scheduledDateTime));
            if (isDoseMode && scheduledTime === scheduledDateTime) {
               router.back(); 
            } else {
               loadData(); 
            }
          }
        }
      ]
    );
  };

  const handleMarkDose = async (newStatus: 'taken' | 'dismissed') => {
    await markDoseStatus(medId as string, new Date(scheduledTime as string), newStatus, isLastDose === 'true');
    router.back();
  };

  if (!medication) return <View style={s.container}><Text style={s.title}>Carregando...</Text></View>;

  const isDelayed = isDoseMode && new Date(scheduledTime as string).getTime() < new Date().getTime() && status !== 'taken' && status !== 'dismissed';

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
    <ScrollView style={s.container}>
      <View style={[
        s.headerCard, 
        isDoseMode && isDelayed && s.delayedCard, 
        isDoseMode && status === 'taken' && s.takenCard,
        isDoseMode && status === 'dismissed' && s.dismissedCard
      ]}>
        <TouchableOpacity 
          style={{ position: 'absolute', top: 20, right: 20, padding: 15, zIndex: 10 }}
          onPress={() => router.push({ pathname: '/edit', params: { medId: medication.id } })}
        >
          <FontAwesome5 name="pen" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        <FontAwesome5 
          name={isDoseMode && status === 'taken' ? 'check-circle' : getMedIcon(medication.type)} 
          size={40} 
          color={isDoseMode ? (isDelayed ? theme.danger : status === 'taken' ? theme.success : status === 'dismissed' ? theme.textSecondary : theme.primary) : theme.primary} 
        />
        <Text style={s.title}>{medication.name}</Text>
        
        {isDoseMode ? (
          <>
            {isDelayed && <Text style={s.statusBadgeRed}>ATRASADO</Text>}
            {status === 'taken' && <Text style={s.statusBadgeGreen}>TOMADO</Text>}
            {status === 'dismissed' && <Text style={s.statusBadgeGray}>DISPENSADO</Text>}
            {status === 'pending' && <Text style={s.statusBadgeBlue}>AGENDADO</Text>}
          </>
        ) : (
          <Text style={s.statusBadgeBlue}>
            {status === 'active' ? 'ATIVO' : status === 'interrupted' ? 'INTERROMPIDO' : status === 'finished' ? 'CONCLUÍDO' : status.toUpperCase()}
          </Text>
        )}
      </View>

      <View style={s.infoSection}>
        {medication.createdAt && !isDoseMode && (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Cadastrado em:</Text>
            <Text style={s.infoValue}>{new Date(medication.createdAt).toLocaleDateString('pt-BR')}</Text>
          </View>
        )}
        {isDoseMode && (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Horário da Dose:</Text>
            <Text style={s.infoValue}>
              {new Date(scheduledTime as string).toLocaleDateString('pt-BR')} às {new Date(scheduledTime as string).getHours().toString().padStart(2, '0')}:{new Date(scheduledTime as string).getMinutes().toString().padStart(2, '0')}
            </Text>
          </View>
        )}
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Frequência:</Text>
          <Text style={s.infoValue}>{medication.frequency}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Duração:</Text>
          <Text style={s.infoValue}>{medication.duration}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Tipo:</Text>
          <Text style={s.infoValue}>{medication.type ? medication.type.charAt(0).toUpperCase() + medication.type.slice(1) : 'Não especificado'}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Via de Admin.:</Text>
          <Text style={s.infoValue}>{medication.route ? medication.route.charAt(0).toUpperCase() + medication.route.slice(1) : 'Não especificada'}</Text>
        </View>
      </View>

      {!isDoseMode && (
        <View style={s.historySection}>
          <Text style={s.historyTitle}>Últimos Registros</Text>
          {recentLogs.length === 0 ? (
            <Text style={s.emptyHistory}>Nenhum registro encontrado ainda.</Text>
          ) : (
            recentLogs.map((log, idx) => (
              <View key={idx} style={s.logItem}>
                <View style={s.logLeft}>
                   <View style={[s.logIndicator, log.status === 'taken' ? s.bgGreen : s.bgGray]} />
                   <View>
                     <Text style={s.logDate}>
                       {new Date(log.scheduledDateTime).toLocaleDateString('pt-BR')} às {new Date(log.scheduledDateTime).getHours().toString().padStart(2, '0')}:{new Date(log.scheduledDateTime).getMinutes().toString().padStart(2, '0')}
                     </Text>
                     <Text style={s.logStatus}>
                       {log.status === 'taken' ? 'Tomado' : 'Dispensado'}
                       {log.takenAt ? ` em ${new Date(log.takenAt).toLocaleDateString('pt-BR')} às ${new Date(log.takenAt).getHours().toString().padStart(2, '0')}:${new Date(log.takenAt).getMinutes().toString().padStart(2, '0')}` : ''}
                     </Text>
                   </View>
                </View>
                <TouchableOpacity onPress={() => handleUndoDoseAction(log.scheduledDateTime)} style={s.undoBtn}>
                   <FontAwesome5 name="undo" size={14} color={theme.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      {isDoseMode && (status === 'taken' || status === 'dismissed') && (
        <TouchableOpacity style={[s.button, s.dangerButton]} onPress={() => handleUndoDoseAction(scheduledTime as string)}>
           <FontAwesome5 name="undo" size={16} color="#ffffff" />
           <Text style={s.buttonText}>Desfazer Ação</Text>
        </TouchableOpacity>
      )}

      {isDoseMode && (status === 'pending' || status === 'delayed') && (
        <>
          <TouchableOpacity style={[s.button, s.primaryButton]} onPress={() => handleMarkDose('taken')}>
             <FontAwesome5 name="check" size={16} color="#ffffff" />
             <Text style={s.buttonText}>Tomar Medicamento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.button, s.dangerOutlineButton]} onPress={() => handleMarkDose('dismissed')}>
             <FontAwesome5 name="times" size={16} color={theme.danger} />
             <Text style={[s.buttonText, {color: theme.danger}]}>Dispensar Dose</Text>
          </TouchableOpacity>
        </>
      )}

      {!isDoseMode && status === 'active' && (
        <TouchableOpacity style={[s.button, s.warningButton]} onPress={handleInterrupt}>
          <FontAwesome5 name="pause-circle" size={16} color="#ffffff" />
          <Text style={s.buttonText}>Interromper Tratamento</Text>
        </TouchableOpacity>
      )}

      {!isDoseMode && status === 'interrupted' && (
        <TouchableOpacity style={[s.button, s.primaryButton]} onPress={handleResume}>
          <FontAwesome5 name="play-circle" size={16} color="#ffffff" />
          <Text style={s.buttonText}>Retomar Tratamento</Text>
        </TouchableOpacity>
      )}

      {!isDoseMode && (
        <TouchableOpacity style={[s.button, s.dangerOutlineButton]} onPress={handleDelete}>
          <FontAwesome5 name="trash-alt" size={16} color={theme.danger} />
          <Text style={[s.buttonText, {color: theme.danger}]}>Excluir Medicamento</Text>
        </TouchableOpacity>
      )}

      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerCard: {
    backgroundColor: theme.card,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  delayedCard: {
    backgroundColor: theme.dangerBackground,
  },
  takenCard: {
    backgroundColor: theme.successBackground,
  },
  dismissedCard: {
    backgroundColor: theme.inputBackground,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
    marginTop: 16,
    textAlign: 'center',
  },
  statusBadgeBlue: {
    marginTop: 12,
    backgroundColor: theme.infoBackground,
    color: theme.info,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '800',
    overflow: 'hidden',
  },
  statusBadgeRed: {
    marginTop: 12,
    backgroundColor: theme.dangerBackground,
    color: theme.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '800',
    overflow: 'hidden',
  },
  statusBadgeGreen: {
    marginTop: 12,
    backgroundColor: theme.successBackground,
    color: theme.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '800',
    overflow: 'hidden',
  },
  statusBadgeGray: {
    marginTop: 12,
    backgroundColor: theme.disabled,
    color: theme.disabledText,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '800',
    overflow: 'hidden',
  },
  infoSection: {
    padding: 24,
    backgroundColor: theme.card,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  historySection: {
    padding: 24,
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  emptyHistory: {
    fontSize: 14,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bgGreen: { backgroundColor: theme.success },
  bgGray: { backgroundColor: theme.disabledText },
  logDate: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  logStatus: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  undoBtn: {
    padding: 8,
    backgroundColor: theme.dangerBackground,
    borderRadius: 8,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  warningButton: {
    backgroundColor: theme.warning,
  },
  dangerButton: {
    backgroundColor: theme.danger,
  },
  primaryButton: {
    backgroundColor: theme.primary,
  },
  dangerOutlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.danger,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  }
});

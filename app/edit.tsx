import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { AdaptiveDropdown } from '../components/AdaptiveDropdown';
import { getMedications, updateMedication, getLogs } from '../utils/storage';
import { syncMedicationNotifications } from '../utils/notifications';
import { useThemeColor } from '../constants/Colors';

export default function EditMedicationScreen() {
  const router = useRouter();
  const { medId } = useLocalSearchParams();
  const theme = useThemeColor();
  const styles = getStyles(theme);
  
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  
  // Detalhes do remédio
  const [medType, setMedType] = useState('comprimido');
  const [route, setRoute] = useState('oral');

  // Horário e Data de Início
  const [startDate, setStartDate] = useState(new Date());

  const [time, setTime] = useState(new Date());
  
  // Frequência e Duração
  const [frequencyHours, setFrequencyHours] = useState('24');
  const [isContinuous, setIsContinuous] = useState(true);
  const [durationDays, setDurationDays] = useState('5');
  
  const [originalIsContinuous, setOriginalIsContinuous] = useState(true);
  const [originalDurationDays, setOriginalDurationDays] = useState('0');

  const HelpTooltip = ({ text }: { text: string }) => (
    <TouchableOpacity onPress={() => Alert.alert('Informação', text)} style={{ marginLeft: 6, marginBottom: 8, marginTop: 16 }}>
      <FontAwesome5 name="question-circle" size={14} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  useEffect(() => {
    const loadMedication = async () => {
      const meds = await getMedications();
      const med = meds.find(m => m.id === medId);
      if (med) {
        setName(med.name);
        if (med.type) setMedType(med.type);
        if (med.route) setRoute(med.route);
        setFrequencyHours(med.frequencyHours.toString());
        setIsContinuous(med.isContinuous);
        setOriginalIsContinuous(med.isContinuous);
        if (med.durationDays) {
          setDurationDays(med.durationDays.toString());
          setOriginalDurationDays(med.durationDays.toString());
        }
        
        if (med.startDate) {
          const [year, month, day] = med.startDate.split('-').map(Number);
          setStartDate(new Date(year, month - 1, day));
        }
        
        if (med.time) {
          const [h, m] = med.time.split(':').map(Number);
          const t = new Date();
          t.setHours(h, m, 0, 0);
          setTime(t);
        }
      }
      setLoading(false);
    };
    loadMedication();
  }, [medId]);

  // Cálculo preciso da data de término
  const getEndDateTime = () => {
    const startDateTime = new Date(startDate);
    startDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

    const freq = parseInt(frequencyHours, 10);
    const days = parseInt(durationDays, 10) || 1;
    
    const totalDoses = days * (24 / freq);
    const totalElapsedHours = (totalDoses - 1) * freq;

    return new Date(startDateTime.getTime() + totalElapsedHours * 60 * 60 * 1000);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o nome do remédio.');
      return;
    }
    
    if (!isContinuous) {
      if (!originalIsContinuous && parseInt(durationDays, 10) < parseInt(originalDurationDays, 10)) {
        Alert.alert('Atenção', 'A duração do tratamento só pode ser aumentada ou mantida igual, não pode ser diminuída.');
        return;
      }
      const logs = await getLogs();
      const medLogs = logs.filter(l => l.medicationId === medId && (l.status === 'taken' || l.status === 'dismissed'));
      if (medLogs.length > 0) {
        medLogs.sort((a,b) => new Date(b.scheduledDateTime).getTime() - new Date(a.scheduledDateTime).getTime());
        const latestLogDate = new Date(medLogs[0].scheduledDateTime);
        if (getEndDateTime().getTime() < latestLogDate.getTime()) {
           Alert.alert('Atenção', 'A nova duração não pode terminar antes da última dose que você já registrou no histórico.');
           return;
        }
      }
    }

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const frequencyStr = frequencyHours === '24' ? '1x ao dia (24/24h)' : 
                         frequencyHours === '12' ? '2x ao dia (12/12h)' :
                         frequencyHours === '8' ? '3x ao dia (8/8h)' : '4x ao dia (6/6h)';
                         
    let durationStr = 'Uso contínuo';
    if (!isContinuous) {
      const endDate = getEndDateTime();
      const endHours = endDate.getHours().toString().padStart(2, '0');
      const endMins = endDate.getMinutes().toString().padStart(2, '0');
      durationStr = `Até ${endDate.toLocaleDateString('pt-BR')} às ${endHours}:${endMins}`;
    }

    await updateMedication(medId as string, {
      name: name.trim(),
      type: medType,
      route,
      time: timeString,
      frequency: frequencyStr,
      duration: durationStr,
      frequencyHours: parseInt(frequencyHours, 10),
      isContinuous,
      startDate: dateString,
      durationDays: isContinuous ? undefined : parseInt(durationDays, 10) || 1,
    });
    
    await syncMedicationNotifications();
    router.back();
  };

  if (loading) {
    return <View style={styles.container}><Text style={styles.label}>Carregando...</Text></View>;
  }

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        <Text style={styles.label}>Nome e Concentração</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: Ibuprofeno 600mg" 
          value={name}
          onChangeText={setName}
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Tipo</Text>
            <AdaptiveDropdown
              selectedValue={medType}
              onValueChange={setMedType}
              options={[
                { label: 'Comprimido', value: 'comprimido' },
                { label: 'Cápsula', value: 'cápsula' },
                { label: 'Gotas', value: 'gotas' },
                { label: 'Xarope', value: 'xarope' },
                { label: 'Suspensão', value: 'suspensão' },
                { label: 'Pomada', value: 'pomada' },
                { label: 'Outro', value: 'outro' }
              ]}
            />
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Via de Admin.</Text>
            <AdaptiveDropdown
              selectedValue={route}
              onValueChange={setRoute}
              options={[
                { label: 'Via Oral', value: 'oral' },
                { label: 'Tópico (Pele)', value: 'tópico' }
              ]}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <Text style={styles.label}>Data de Início</Text>
               <HelpTooltip text="Para manter o seu histórico de saúde preciso e seguro, a data de início não pode ser alterada. Se precisar, você pode excluir este remédio e cadastrar um novo." />
            </View>
            <View style={[styles.inputPicker, styles.disabledInput]}>
              <Text style={styles.disabledText}>{startDate.toLocaleDateString('pt-BR')}</Text>
            </View>
          </View>
          <View style={styles.halfWidth}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <Text style={styles.label}>Hora da 1ª Dose</Text>
               <HelpTooltip text="A hora da 1ª dose determina o ciclo das próximas doses e não pode ser editada." />
            </View>
            <View style={[styles.inputPicker, styles.disabledInput]}>
              <Text style={styles.disabledText}>
                {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
           <Text style={styles.label}>Frequência</Text>
           <HelpTooltip text="A frequência entre as doses não pode ser alterada no histórico. Se o médico mudou a receita, exclua este e adicione um novo." />
        </View>
        <View style={[styles.inputPicker, styles.disabledInput]}>
          <Text style={styles.disabledText}>
            {frequencyHours === '24' ? '1x ao dia (a cada 24h)' : 
             frequencyHours === '12' ? '2x ao dia (a cada 12h)' :
             frequencyHours === '8' ? '3x ao dia (a cada 8h)' : '4x ao dia (a cada 6h)'}
          </Text>
        </View>

        <View style={styles.switchContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <Text style={styles.labelSwitch}>Uso contínuo (sem data fim)</Text>
             <TouchableOpacity onPress={() => Alert.alert('Informação', 'Se o medicamento for de uso contínuo, ele não terá uma data de término e continuará gerando doses na sua agenda.')} style={{ marginLeft: 6 }}>
                <FontAwesome5 name="question-circle" size={14} color={theme.textSecondary} />
             </TouchableOpacity>
          </View>
          <Switch
            disabled={originalIsContinuous}
            value={isContinuous}
            onValueChange={(val) => {
              if (val && !originalIsContinuous) {
                Alert.alert(
                  'Aviso Irreversível',
                  'Se você alterar o medicamento para uso contínuo e salvar, essa ação NÃO poderá ser desfeita futuramente. Deseja marcar como contínuo agora?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Sim', onPress: () => setIsContinuous(true), style: 'destructive' }
                  ]
                );
              } else {
                setIsContinuous(val);
              }
            }}
            trackColor={{ false: theme.disabled, true: theme.infoBackground }}
            thumbColor={isContinuous ? theme.primary : theme.inputBackground}
            style={{ opacity: 0.7 }}
          />
        </View>

        {!isContinuous && (
          <View>
            <Text style={styles.label}>Por quantos dias?</Text>
            <TextInput 
              style={styles.inputPicker} 
              placeholder="Ex: 5" 
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="numeric"
            />
          </View>
        )}

        {!isContinuous && durationDays !== '' && parseInt(durationDays, 10) > 0 && (
           <View style={styles.hintBox}>
             <Text style={styles.hintText}>
               A última dose será no dia {getEndDateTime().toLocaleDateString('pt-BR')} às {getEndDateTime().getHours().toString().padStart(2, '0')}:{getEndDateTime().getMinutes().toString().padStart(2, '0')}
             </Text>
           </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Salvar Alterações</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inputPicker: {
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    height: 55,
    borderWidth: 1,
    borderColor: theme.border,
  },
  disabledInput: {
    backgroundColor: theme.disabled,
    opacity: 0.7,
  },
  inputText: {
    fontSize: 16,
    color: theme.text,
  },
  disabledText: {
    fontSize: 16,
    color: theme.disabledText,
  },

  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  labelSwitch: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  hintBox: {
    marginTop: 16,
    backgroundColor: theme.successBackground,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.success,
  },
  hintText: {
    fontSize: 14,
    color: theme.success,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  }
});

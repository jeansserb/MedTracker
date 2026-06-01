import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { getMedications, updateMedication, getLogs } from '../utils/storage';

export default function EditMedicationScreen() {
  const router = useRouter();
  const { medId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  
  // Detalhes do remédio
  const [medType, setMedType] = useState('comprimido');
  const [route, setRoute] = useState('oral');

  // Horário e Data de Início
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Frequência e Duração
  const [frequencyHours, setFrequencyHours] = useState('24');
  const [isContinuous, setIsContinuous] = useState(true);
  const [durationDays, setDurationDays] = useState('5');

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
        if (med.durationDays) setDurationDays(med.durationDays.toString());
        
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

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) setTime(selectedDate);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

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

    const dateString = startDate.toISOString().split('T')[0];

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
            <View style={styles.pickerContainer}>
              <Picker selectedValue={medType} onValueChange={setMedType} style={styles.picker}>
                <Picker.Item label="Comprimido" value="comprimido" />
                <Picker.Item label="Cápsula" value="cápsula" />
                <Picker.Item label="Gotas" value="gotas" />
                <Picker.Item label="Xarope" value="xarope" />
                <Picker.Item label="Suspensão" value="suspensão" />
                <Picker.Item label="Pomada" value="pomada" />
                <Picker.Item label="Outro" value="outro" />
              </Picker>
            </View>
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Via de Admin.</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={route} onValueChange={setRoute} style={styles.picker}>
                <Picker.Item label="Via Oral" value="oral" />
                <Picker.Item label="Tópico (Pele)" value="tópico" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Data de Início (Bloqueado)</Text>
            <View style={[styles.inputPicker, styles.disabledInput]}>
              <Text style={styles.disabledText}>{startDate.toLocaleDateString('pt-BR')}</Text>
            </View>
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Hora da 1ª Dose (Bloqueado)</Text>
            <View style={[styles.inputPicker, styles.disabledInput]}>
              <Text style={styles.disabledText}>
                {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.label}>Frequência (Bloqueado)</Text>
        <View style={[styles.inputPicker, styles.disabledInput]}>
          <Text style={styles.disabledText}>
            {frequencyHours === '24' ? '1x ao dia (a cada 24h)' : 
             frequencyHours === '12' ? '2x ao dia (a cada 12h)' :
             frequencyHours === '8' ? '3x ao dia (a cada 8h)' : '4x ao dia (a cada 6h)'}
          </Text>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.labelSwitch}>Uso contínuo (sem data fim)</Text>
          <Switch
            value={isContinuous}
            onValueChange={setIsContinuous}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={isContinuous ? '#3b82f6' : '#f3f4f6'}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  inputPicker: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    height: 55,
  },
  disabledInput: {
    backgroundColor: '#e5e7eb',
    opacity: 0.7,
  },
  inputText: {
    fontSize: 16,
    color: '#1f2937',
  },
  disabledText: {
    fontSize: 16,
    color: '#6b7280',
  },
  pickerContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 55,
    width: '100%',
    color: '#1f2937',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  labelSwitch: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  hintBox: {
    marginTop: 16,
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  hintText: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#3b82f6',
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

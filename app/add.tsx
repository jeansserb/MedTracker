import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { saveMedication } from '../utils/storage';
import { useThemeColor } from '../constants/Colors';

export default function AddMedicationScreen() {
  const router = useRouter();
  const theme = useThemeColor();
  const s = styles(theme);

  const [name, setName] = useState('');
  const [medType, setMedType] = useState('comprimido');
  const [route, setRoute] = useState('oral');

  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [frequencyHours, setFrequencyHours] = useState('24');
  const [isContinuous, setIsContinuous] = useState(true);
  const [durationDays, setDurationDays] = useState('5');

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) setTime(selectedDate);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

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

    await saveMedication({
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

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        
        <Text style={s.label}>Nome e Concentração</Text>
        <TextInput 
          style={s.input} 
          placeholder="Ex: Ibuprofeno 600mg" 
          placeholderTextColor={theme.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <View style={s.row}>
          <View style={s.halfWidth}>
            <Text style={s.label}>Tipo</Text>
            <View style={s.pickerContainer}>
              <Picker selectedValue={medType} onValueChange={setMedType} style={s.picker}>
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
          <View style={s.halfWidth}>
            <Text style={s.label}>Via de Admin.</Text>
            <View style={s.pickerContainer}>
              <Picker selectedValue={route} onValueChange={setRoute} style={s.picker}>
                <Picker.Item label="Via Oral" value="oral" />
                <Picker.Item label="Tópico (Pele)" value="tópico" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={s.row}>
          <View style={s.halfWidth}>
            <Text style={s.label}>Data de Início</Text>
            <TouchableOpacity style={s.inputPicker} onPress={() => setShowDatePicker(true)}>
              <Text style={s.inputText}>{startDate.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
          <View style={s.halfWidth}>
            <Text style={s.label}>Hora da 1ª Dose</Text>
            <TouchableOpacity style={s.inputPicker} onPress={() => setShowTimePicker(true)}>
              <Text style={s.inputText}>
                {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>
        </View>

        <Text style={s.label}>Frequência</Text>
        <View style={s.pickerContainer}>
          <Picker
            selectedValue={frequencyHours}
            onValueChange={setFrequencyHours}
            style={s.picker}
          >
            <Picker.Item label="1x ao dia (a cada 24h)" value="24" />
            <Picker.Item label="2x ao dia (a cada 12h)" value="12" />
            <Picker.Item label="3x ao dia (a cada 8h)" value="8" />
            <Picker.Item label="4x ao dia (a cada 6h)" value="6" />
          </Picker>
        </View>

        <View style={s.switchContainer}>
          <Text style={s.labelSwitch}>Uso contínuo (sem data fim)</Text>
          <Switch
            value={isContinuous}
            onValueChange={setIsContinuous}
            trackColor={{ false: theme.disabled, true: theme.infoBackground }}
            thumbColor={isContinuous ? theme.primary : theme.inputBackground}
          />
        </View>

        {!isContinuous && (
          <View>
            <Text style={s.label}>Por quantos dias?</Text>
            <TextInput 
              style={s.inputPicker} 
              placeholder="Ex: 5" 
              placeholderTextColor={theme.textSecondary}
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="numeric"
            />
          </View>
        )}

        {!isContinuous && durationDays !== '' && parseInt(durationDays, 10) > 0 && (
           <View style={s.hintBox}>
             <Text style={s.hintText}>
               A última dose será no dia {getEndDateTime().toLocaleDateString('pt-BR')} às {getEndDateTime().getHours().toString().padStart(2, '0')}:{getEndDateTime().getMinutes().toString().padStart(2, '0')}
             </Text>
           </View>
        )}

        <TouchableOpacity style={s.button} onPress={handleSave} activeOpacity={0.8}>
          <Text style={s.buttonText}>Salvar Remédio</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: any) => StyleSheet.create({
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
  },
  inputPicker: {
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    height: 55,
  },
  inputText: {
    fontSize: 16,
    color: theme.text,
  },
  pickerContainer: {
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 55,
    width: '100%',
    color: theme.text,
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

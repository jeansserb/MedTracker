import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, TouchableWithoutFeedback } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useThemeColor } from '../constants/Colors';

type Props = {
  value: Date;
  mode: 'date' | 'time';
  onChange: (date: Date) => void;
};

export function AdaptiveDateTimePicker({ value, mode, onChange }: Props) {
  const theme = useThemeColor();
  const [show, setShow] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  // Formata o texto do botão
  const getDisplayText = () => {
    if (mode === 'date') {
      return value.toLocaleDateString('pt-BR');
    }
    return `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const handleIOSChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setTempValue(selectedDate);
    }
  };

  const confirmIOS = () => {
    onChange(tempValue);
    setShow(false);
  };

  const cancelIOS = () => {
    setTempValue(value); // reseta pro valor original
    setShow(false);
  };

  const openPicker = () => {
    setTempValue(value);
    setShow(true);
  };

  if (Platform.OS === 'ios') {
    return (
      <View>
        <TouchableOpacity 
          style={[styles.inputButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]} 
          onPress={openPicker}
          activeOpacity={0.7}
        >
          <Text style={[styles.inputText, { color: theme.text }]}>{getDisplayText()}</Text>
        </TouchableOpacity>

        <Modal
          visible={show}
          transparent={true}
          animationType="slide"
        >
          <TouchableWithoutFeedback onPress={cancelIOS}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <TouchableOpacity onPress={cancelIOS} style={styles.modalButton}>
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmIOS} style={styles.modalButton}>
                <Text style={[styles.modalButtonText, { color: theme.primary, fontWeight: '700' }]}>Concluído</Text>
              </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: theme.card, paddingVertical: 10 }}>
              <DateTimePicker
                value={tempValue}
                mode={mode}
                display="spinner"
                is24Hour={true}
                onChange={handleIOSChange}
                textColor={theme.text}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Android implementation
  return (
    <View>
      <TouchableOpacity 
        style={[styles.inputButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]} 
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Text style={[styles.inputText, { color: theme.text }]}>{getDisplayText()}</Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value}
          mode={mode}
          display="default"
          is24Hour={true}
          onChange={handleAndroidChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputButton: {
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30, // Extra padding for safe area
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalButton: {
    padding: 4,
  },
  modalButtonText: {
    fontSize: 17,
  }
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useThemeColor } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Option = {
  label: string;
  value: string;
};

type Props = {
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: Option[];
};

export function AdaptiveDropdown({ selectedValue, onValueChange, options }: Props) {
  const theme = useThemeColor();
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState(false);

  const selectedLabel = options.find(o => o.value === selectedValue)?.label || 'Selecione...';

  const handleSelect = (val: string) => {
    onValueChange(val);
    setShow(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.dropdown, { backgroundColor: theme.inputBackground, borderColor: theme.border }]} 
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, { color: theme.text }]}>{selectedLabel}</Text>
        <FontAwesome5 name="chevron-down" size={14} color={theme.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={show}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShow(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShow(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={[styles.modalContent, { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textSecondary }]}>Selecione uma opção</Text>
            <TouchableOpacity onPress={() => setShow(false)} style={styles.closeButton}>
              <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {options.map((opt) => {
              const isSelected = opt.value === selectedValue;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionItem, isSelected && { backgroundColor: theme.inputBackground }]}
                  onPress={() => handleSelect(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, { color: isSelected ? theme.primary : theme.text }, isSelected && { fontWeight: '700' }]}>
                    {opt.label}
                  </Text>
                  {isSelected && <FontAwesome5 name="check" size={16} color={theme.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  text: {
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  optionText: {
    fontSize: 18,
  }
});

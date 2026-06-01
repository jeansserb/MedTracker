import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { getMonthAdherence, getHistoricalDosesForDate, DailyDose } from '../../utils/storage';
import { useThemeColor } from '../../constants/Colors';

LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

export default function CalendarScreen() {
  const router = useRouter();
  const theme = useThemeColor();
  const s = styles(theme);
  
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDoses, setSelectedDoses] = useState<DailyDose[]>([]);
  const [currentMonth, setCurrentMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  useFocusEffect(
    useCallback(() => {
      loadMonthData(currentMonth.year, currentMonth.month);
      
      if (!selectedDate) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        handleDayPress(todayStr);
      } else {
        handleDayPress(selectedDate);
      }
    }, [currentMonth.year, currentMonth.month])
  );

  const loadMonthData = async (year: number, month: number) => {
    const adherence = await getMonthAdherence(year, month);
    setMarkedDates(adherence);
  };

  const handleDayPress = async (dateString: string) => {
    setSelectedDate(dateString);
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const doses = await getHistoricalDosesForDate(dateObj);
    setSelectedDoses(doses);
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

  const renderDoseStatus = (status: string) => {
    switch (status) {
      case 'taken':
        return <Text style={s.badgeGreen}>Tomado</Text>;
      case 'dismissed':
        return <Text style={s.badgeGray}>Dispensado</Text>;
      case 'pending':
        return <Text style={s.badgeBlue}>Pendente</Text>;
      case 'delayed':
        return <Text style={s.badgeRed}>Atrasado</Text>;
      default:
        return null;
    }
  };

  const getCalendarMarks = () => {
    const marks = { ...markedDates };
    if (selectedDate) {
      if (marks[selectedDate]) {
         marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: theme.infoBackground, selectedTextColor: theme.info };
      } else {
         marks[selectedDate] = { selected: true, selectedColor: theme.infoBackground, selectedTextColor: theme.info };
      }
    }
    return marks;
  };

  const formatDateToPtBr = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `${days[date.getDay()]}, ${day} de ${months[date.getMonth()]}`;
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Text style={s.title}>Desempenho</Text>
          <Text style={s.subtitle}>Acompanhe a sua adesão ao tratamento</Text>
        </View>

        <View style={s.calendarCard}>
          <Calendar
            onDayPress={(day: any) => handleDayPress(day.dateString)}
            onMonthChange={(month: any) => setCurrentMonth({ year: month.year, month: month.month })}
            markedDates={getCalendarMarks()}
            theme={{
              backgroundColor: theme.card,
              calendarBackground: theme.card,
              textSectionTitleColor: theme.textSecondary,
              selectedDayBackgroundColor: theme.infoBackground,
              selectedDayTextColor: theme.info,
              todayTextColor: theme.primary,
              dayTextColor: theme.text,
              textDisabledColor: theme.disabled,
              dotColor: theme.primary,
              selectedDotColor: theme.primary,
              arrowColor: theme.primary,
              monthTextColor: theme.text,
              indicatorColor: theme.primary,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14
            }}
          />
        </View>

        {selectedDate ? (
          <View style={s.detailsSection}>
            <Text style={s.detailsTitle}>
              {formatDateToPtBr(selectedDate)}
            </Text>

            {selectedDoses.length === 0 ? (
              <View style={s.emptyContainer}>
                 <FontAwesome5 name="calendar-times" size={40} color={theme.disabled} />
                 <Text style={s.emptyText}>Nenhum remédio agendado.</Text>
              </View>
            ) : (
              <View style={s.listContainer}>
                {selectedDoses.map((dose, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={s.doseCard}
                    activeOpacity={0.7}
                    onPress={() => router.push({ 
                      pathname: '/details', 
                      params: { 
                        medId: dose.medication.id, 
                        scheduledTime: dose.scheduledDateTime.toISOString(),
                        status: dose.status,
                        isLastDose: dose.isLastDose ? 'true' : 'false'
                      } 
                    })}
                  >
                    <View style={s.doseCardHeader}>
                      <View style={s.timeContainer}>
                        <FontAwesome5 name="clock" size={12} color={theme.textSecondary} />
                        <Text style={s.timeText}>
                          {dose.scheduledDateTime.getHours().toString().padStart(2, '0')}:{dose.scheduledDateTime.getMinutes().toString().padStart(2, '0')}
                        </Text>
                      </View>
                      {renderDoseStatus(dose.status)}
                    </View>
                    
                    <View style={s.doseCardBody}>
                       <View style={s.iconContainer}>
                          <FontAwesome5 name={getMedIcon(dose.medication.type)} size={16} color={theme.primary} />
                       </View>
                       <View>
                          <Text style={s.medName}>{dose.medication.name}</Text>
                          <Text style={s.medDetails}>
                             {dose.medication.type ? dose.medication.type.charAt(0).toUpperCase() + dose.medication.type.slice(1) : 'Remédio'}
                          </Text>
                       </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : null}
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
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
  calendarCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  detailsSection: {
    flex: 1,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  listContainer: {
    gap: 12,
  },
  doseCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  doseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  doseCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.infoBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  medDetails: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
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

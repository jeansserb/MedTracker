import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { getMedications, getLogs, generateDosesForDate } from './storage';

// Comportamento quando o app estiver aberto (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Padrão',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }
  return false;
}

export async function syncMedicationNotifications() {
  // Limpar os alarmes antigos
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  // Pegar estado atual
  const meds = await getMedications();
  const logs = await getLogs();
  
  const now = new Date();
  const futureDoses: any[] = [];
  
  // Vamos agendar doses pros próximos 5 dias para não bater o limite do iOS (64)
  for (let i = 0; i <= 5; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    
    for (const med of meds) {
      if (med.status !== 'active') continue;
      const doses = generateDosesForDate(med, targetDate, logs);
      
      for (const dose of doses) {
        if (dose.scheduledDateTime > now && dose.status === 'pending') {
          futureDoses.push(dose);
        }
      }
    }
  }

  futureDoses.sort((a, b) => a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime());
  
  // Limitar a 60 notificações no máximo
  const dosesToSchedule = futureDoses.slice(0, 60);

  for (const dose of dosesToSchedule) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Hora do seu remédio! 💊`,
        body: `Está na hora de tomar ${dose.medication.name}.`,
        data: { medId: dose.medication.id },
      },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dose.scheduledDateTime 
      },
    });
  }
}

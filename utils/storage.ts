import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Medication {
  id: string;
  name: string;
  type?: string;
  route?: string;
  time: string; // "14:00"
  frequencyHours: number;
  isContinuous: boolean;
  startDate?: string; // "YYYY-MM-DD"
  durationDays?: number;
  createdAt?: string;
  status: 'active' | 'interrupted' | 'finished';
  // Legacy string fields for simple display if needed
  duration: string;
  frequency: string;
}

export interface TakenLog {
  medicationId: string;
  scheduledDateTime: string; // "YYYY-MM-DDTHH:mm:00.000Z"
  status: 'taken' | 'dismissed';
  takenAt: string; // Timestamp when clicked
}

export interface DailyDose {
  medication: Medication;
  scheduledDateTime: Date;
  status: 'pending' | 'taken' | 'dismissed' | 'delayed';
  isLastDose: boolean;
}

const MEDS_KEY = '@medications';
const LOGS_KEY = '@taken_logs';

export const getMedications = async (): Promise<Medication[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(MEDS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    return [];
  }
};

export const saveMedication = async (med: Omit<Medication, 'id' | 'status'>) => {
  try {
    const meds = await getMedications();
    const newMed: Medication = { 
      ...med, 
      id: Date.now().toString(), 
      status: 'active' as const,
      createdAt: new Date().toISOString()
    };
    await AsyncStorage.setItem(MEDS_KEY, JSON.stringify([...meds, newMed]));
  } catch (e) {}
};

export const updateMedicationStatus = async (id: string, status: 'active' | 'interrupted' | 'finished') => {
  try {
    const meds = await getMedications();
    const index = meds.findIndex(m => m.id === id);
    if (index >= 0) {
      meds[index].status = status;
      await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(meds));
    }
  } catch (e) {}
};

export const updateMedication = async (id: string, updates: Partial<Medication>) => {
  try {
    const meds = await getMedications();
    const index = meds.findIndex(m => m.id === id);
    if (index >= 0) {
      meds[index] = { ...meds[index], ...updates };
      await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(meds));
    }
  } catch (e) {}
};

export const getLogs = async (): Promise<TakenLog[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(LOGS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    return [];
  }
};

export const removeDoseLog = async (medicationId: string, scheduledDateTime: Date) => {
  try {
    const logs = await getLogs();
    const isoString = scheduledDateTime.toISOString();
    const filteredLogs = logs.filter(l => !(l.medicationId === medicationId && l.scheduledDateTime === isoString));
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(filteredLogs));

    // Se o remédio estava 'finished', volta para 'active' se desfazermos a última dose
    const meds = await getMedications();
    const med = meds.find(m => m.id === medicationId);
    if (med && med.status === 'finished') {
       med.status = 'active';
       await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(meds));
    }
  } catch (e) {}
};

export const deleteMedication = async (id: string) => {
  try {
    const meds = await getMedications();
    const filteredMeds = meds.filter(m => m.id !== id);
    await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(filteredMeds));

    // Remover logs associados também
    const logs = await getLogs();
    const filteredLogs = logs.filter(l => l.medicationId !== id);
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(filteredLogs));
  } catch (e) {}
};

export const markDoseStatus = async (medicationId: string, scheduledDateTime: Date, status: 'taken' | 'dismissed', isLastDose: boolean) => {
  try {
    const logs = await getLogs();
    const isoString = scheduledDateTime.toISOString();
    
    // Remove se já existe um log para esta mesma dose (para permitir desfazer/alterar status)
    const filteredLogs = logs.filter(l => !(l.medicationId === medicationId && l.scheduledDateTime === isoString));
    
    filteredLogs.push({
      medicationId,
      scheduledDateTime: isoString,
      status,
      takenAt: new Date().toISOString()
    });
    
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(filteredLogs));

    // Auto-finish check
    if (isLastDose && (status === 'taken' || status === 'dismissed')) {
       await updateMedicationStatus(medicationId, 'finished');
    }

  } catch (e) {}
};

// ==========================================
// CORE MATH ALGORITHM
// ==========================================
export const getAgendaDoses = async (): Promise<DailyDose[]> => {
  const allMeds = await getMedications();
  const logs = await getLogs();
  
  const agenda: DailyDose[] = [];
  const now = new Date();
  
  // Janela: 24h no passado (para pegar atrasados) até o fim do dia de amanhã (visão estendida)
  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const windowEnd = new Date(endOfToday.getTime() + 24 * 60 * 60 * 1000); // Até o fim de amanhã

  for (const med of allMeds) {
    if (med.status !== 'active') continue;
    if (!med.startDate) continue;

    const [startYear, startMonth, startDay] = med.startDate.split('-').map(Number);
    const [startHour, startMin] = med.time.split(':').map(Number);
    
    const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMin, 0, 0);
    const totalDosesAllowed = med.isContinuous ? Infinity : (med.durationDays || 1) * (24 / med.frequencyHours);
    
    let firstDoseIndex = Math.floor((windowStart.getTime() - startDateTime.getTime()) / (med.frequencyHours * 60 * 60 * 1000));
    if (firstDoseIndex < 0) firstDoseIndex = 0;

    for (let i = firstDoseIndex; i < totalDosesAllowed; i++) {
      const doseTime = new Date(startDateTime.getTime() + i * med.frequencyHours * 60 * 60 * 1000);
      
      if (doseTime.getTime() > windowEnd.getTime()) break;

      if (doseTime.getTime() >= windowStart.getTime()) {
        const isLastDose = !med.isContinuous && i === totalDosesAllowed - 1;
        const doseIsoString = doseTime.toISOString();
        
        const log = logs.find(l => l.medicationId === med.id && l.scheduledDateTime === doseIsoString);
        
        // Se já tem log (tomado ou dispensado), NÃO entra na fila de Próximas Doses.
        if (log) continue;

        let doseStatus: 'pending' | 'taken' | 'dismissed' | 'delayed' = 'pending';
        
        if (doseTime.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
           doseStatus = 'dismissed';
        } else if (doseTime.getTime() < now.getTime()) {
           doseStatus = 'delayed';
        }

        agenda.push({
          medication: med,
          scheduledDateTime: doseTime,
          status: doseStatus,
          isLastDose
        });
      }
    }
  }

  agenda.sort((a, b) => a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime());
  return agenda;
};

// ==========================================
// CALENDAR & ANALYTICS ALGORITHMS
// ==========================================

export function generateDosesForDate(med: Medication, targetDate: Date, logs: TakenLog[]): DailyDose[] {
  const doses: DailyDose[] = [];
  const now = new Date();
  
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();

  if (!med.startDate) return [];

  const [startYear, startMonth, startDay] = med.startDate.split('-').map(Number);
  const [startHour, startMin] = med.time.split(':').map(Number);
  
  const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMin, 0, 0);
  const targetStartOfDay = new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0);
  const targetEndOfDay = new Date(targetYear, targetMonth, targetDay, 23, 59, 59, 999);
  
  const totalDosesAllowed = med.isContinuous ? Infinity : (med.durationDays || 1) * (24 / med.frequencyHours);
  let firstDoseIndex = Math.floor((targetStartOfDay.getTime() - startDateTime.getTime()) / (med.frequencyHours * 60 * 60 * 1000));
  if (firstDoseIndex < 0) firstDoseIndex = 0;

  for (let i = firstDoseIndex; i < totalDosesAllowed; i++) {
    const doseTime = new Date(startDateTime.getTime() + i * med.frequencyHours * 60 * 60 * 1000);
    
    if (doseTime.getTime() > targetEndOfDay.getTime()) break;

    if (doseTime.getTime() >= targetStartOfDay.getTime()) {
      if (med.status === 'interrupted' && doseTime.getTime() > now.getTime()) break; 

      const isLastDose = !med.isContinuous && i === totalDosesAllowed - 1;
      const doseIsoString = doseTime.toISOString();
      const log = logs.find(l => l.medicationId === med.id && l.scheduledDateTime === doseIsoString);
      
      let doseStatus: 'pending' | 'taken' | 'dismissed' | 'delayed' = 'pending';
      
      if (log) {
        doseStatus = log.status;
      } else if (doseTime.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
        doseStatus = 'dismissed';
      } else if (doseTime.getTime() < now.getTime()) {
        doseStatus = 'delayed';
      }

      doses.push({ medication: med, scheduledDateTime: doseTime, status: doseStatus, isLastDose });
    }
  }
  return doses;
}

export const getHistoricalDosesForDate = async (targetDate: Date): Promise<DailyDose[]> => {
  const allMeds = await getMedications();
  const logs = await getLogs();
  
  const dailyDoses: DailyDose[] = [];
  const now = new Date();
  
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();

  for (const med of allMeds) {
    if (!med.startDate) continue;

    const [startYear, startMonth, startDay] = med.startDate.split('-').map(Number);
    const [startHour, startMin] = med.time.split(':').map(Number);
    
    const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMin, 0, 0);

    const targetStartOfDay = new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0);
    const startStartOfDay = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    
    if (targetStartOfDay.getTime() < startStartOfDay.getTime()) continue;

    const totalDosesAllowed = med.isContinuous ? Infinity : (med.durationDays || 1) * (24 / med.frequencyHours);
    const targetEndOfDay = new Date(targetYear, targetMonth, targetDay, 23, 59, 59, 999);
    
    let firstDoseIndex = Math.floor((targetStartOfDay.getTime() - startDateTime.getTime()) / (med.frequencyHours * 60 * 60 * 1000));
    if (firstDoseIndex < 0) firstDoseIndex = 0;

    for (let i = firstDoseIndex; i < totalDosesAllowed; i++) {
      const doseTime = new Date(startDateTime.getTime() + i * med.frequencyHours * 60 * 60 * 1000);
      
      if (doseTime.getTime() > targetEndOfDay.getTime()) break;

      if (doseTime.getTime() >= targetStartOfDay.getTime()) {
        if (med.status === 'interrupted' && doseTime.getTime() > now.getTime()) {
            break; 
        }

        const isLastDose = !med.isContinuous && i === totalDosesAllowed - 1;
        const doseIsoString = doseTime.toISOString();
        const log = logs.find(l => l.medicationId === med.id && l.scheduledDateTime === doseIsoString);
        
        let doseStatus: 'pending' | 'taken' | 'dismissed' | 'delayed' = 'pending';
        
        if (log) {
          doseStatus = log.status;
        } else if (doseTime.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
          doseStatus = 'dismissed';
        } else if (doseTime.getTime() < now.getTime()) {
          doseStatus = 'delayed';
        }

        dailyDoses.push({
          medication: med,
          scheduledDateTime: doseTime,
          status: doseStatus,
          isLastDose
        });
      }
    }
  }

  dailyDoses.sort((a, b) => a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime());
  return dailyDoses;
};

export const getMonthAdherence = async (year: number, month: number) => {
  const adherenceMap: Record<string, any> = {};
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
     const date = new Date(year, month - 1, day);
     const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
     
     const doses = await getHistoricalDosesForDate(date);
     if (doses.length === 0) continue;
     
     if (date.getTime() > new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime()) {
        adherenceMap[dateString] = { marked: true, dotColor: '#9ca3af' }; 
        continue;
     }
     
     let takenCount = 0;
     let totalCount = doses.length;
     
     for (const d of doses) {
        if (d.status === 'taken') takenCount++;
     }
     
     if (takenCount === totalCount) {
         adherenceMap[dateString] = { marked: true, dotColor: '#10b981' }; 
     } else if (takenCount === 0) {
         const hasPending = doses.some(d => d.status === 'pending');
         if (date.toDateString() === now.toDateString() && hasPending) {
             adherenceMap[dateString] = { marked: true, dotColor: '#fcd34d' }; 
         } else {
             adherenceMap[dateString] = { marked: true, dotColor: '#ef4444' }; 
         }
     } else {
         adherenceMap[dateString] = { marked: true, dotColor: '#f59e0b' }; 
     }
  }
  return adherenceMap;
};

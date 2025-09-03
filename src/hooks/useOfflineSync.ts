import { useState, useEffect } from 'react';

interface OfflineData {
  interviews: Array<{
    id: string;
    data: any;
    timestamp: string;
    synced: boolean;
  }>;
  lastSync: Date | null;
  pendingSync: number;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData>({
    interviews: [],
    lastSync: null,
    pendingSync: 0
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🟢 Conexão restaurada - iniciando sincronização automática');
      autoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('🔴 Modo offline ativado - dados serão salvos localmente');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load saved offline data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('vote-scout-offline-data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setOfflineData({
          ...parsed,
          lastSync: parsed.lastSync ? new Date(parsed.lastSync) : null
        });
      } catch (error) {
        console.error('Erro ao carregar dados offline:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever offlineData changes
  useEffect(() => {
    localStorage.setItem('vote-scout-offline-data', JSON.stringify(offlineData));
  }, [offlineData]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && offlineData.pendingSync > 0) {
      autoSync();
    }
  }, [isOnline, offlineData.pendingSync]);

  const saveOfflineInterview = (interviewData: any) => {
    const interview = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data: interviewData,
      timestamp: new Date().toISOString(),
      synced: false
    };

    setOfflineData(prev => ({
      ...prev,
      interviews: [...prev.interviews, interview],
      pendingSync: prev.pendingSync + 1
    }));

    console.log(`💾 Entrevista salva offline: ${interview.id}`);
    return interview.id;
  };

  const autoSync = async () => {
    if (!isOnline || isSyncing || offlineData.pendingSync === 0) return;

    setIsSyncing(true);
    console.log(`🔄 Iniciando sincronização de ${offlineData.pendingSync} entrevistas...`);

    try {
      const unsyncedInterviews = offlineData.interviews.filter(interview => !interview.synced);
      
      for (const interview of unsyncedInterviews) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mark as synced
        setOfflineData(prev => ({
          ...prev,
          interviews: prev.interviews.map(i => 
            i.id === interview.id ? { ...i, synced: true } : i
          ),
          pendingSync: prev.pendingSync - 1,
          lastSync: new Date()
        }));

        console.log(`✅ Entrevista sincronizada: ${interview.id}`);
      }

      console.log('🎉 Sincronização concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearSyncedData = () => {
    setOfflineData(prev => ({
      ...prev,
      interviews: prev.interviews.filter(interview => !interview.synced)
    }));
  };

  const forceSync = () => {
    if (isOnline) {
      autoSync();
    }
  };

  return {
    isOnline,
    isSyncing,
    offlineData,
    saveOfflineInterview,
    autoSync,
    clearSyncedData,
    forceSync
  };
};
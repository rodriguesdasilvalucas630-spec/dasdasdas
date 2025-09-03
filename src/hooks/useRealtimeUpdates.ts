import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RealtimeData {
  interviews: number;
  activeResearchers: number;
  completedRegions: number;
  alerts: Array<{
    id: string;
    type: 'success' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }>;
}

export const useRealtimeUpdates = (researchId?: string) => {
  const [data, setData] = useState<RealtimeData>({
    interviews: 0,
    activeResearchers: 0,
    completedRegions: 0,
    alerts: []
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!researchId) return;

    const channel = supabase
      .channel(`research-${researchId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        console.log('Realtime sync:', newState);
        setIsConnected(true);
        setLastUpdate(new Date());
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        // Auto-update active researchers count
        setData(prev => ({
          ...prev,
          activeResearchers: prev.activeResearchers + 1,
          alerts: [
            ...prev.alerts.slice(-4), // Keep only last 4 alerts
            {
              id: `join-${Date.now()}`,
              type: 'success',
              message: `Pesquisador ${key} entrou em campo`,
              timestamp: new Date().toISOString()
            }
          ]
        }));
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        setData(prev => ({
          ...prev,
          activeResearchers: Math.max(0, prev.activeResearchers - 1),
          alerts: [
            ...prev.alerts.slice(-4),
            {
              id: `leave-${Date.now()}`,
              type: 'warning',
              message: `Pesquisador ${key} saiu de campo`,
              timestamp: new Date().toISOString()
            }
          ]
        }));
      })
      .on('broadcast', { event: 'interview_completed' }, (payload) => {
        console.log('Interview completed:', payload);
        setData(prev => ({
          ...prev,
          interviews: prev.interviews + 1,
          alerts: [
            ...prev.alerts.slice(-4),
            {
              id: `interview-${Date.now()}`,
              type: 'success',
              message: `Nova entrevista concluída em ${payload.region}`,
              timestamp: new Date().toISOString()
            }
          ]
        }));
        setLastUpdate(new Date());
      })
      .on('broadcast', { event: 'region_completed' }, (payload) => {
        console.log('Region completed:', payload);
        setData(prev => ({
          ...prev,
          completedRegions: prev.completedRegions + 1,
          alerts: [
            ...prev.alerts.slice(-4),
            {
              id: `region-${Date.now()}`,
              type: 'success',
              message: `Região ${payload.region} completou sua meta!`,
              timestamp: new Date().toISOString()
            }
          ]
        }));
      })
      .on('broadcast', { event: 'quota_alert' }, (payload) => {
        console.log('Quota alert:', payload);
        setData(prev => ({
          ...prev,
          alerts: [
            ...prev.alerts.slice(-4),
            {
              id: `alert-${Date.now()}`,
              type: 'error',
              message: payload.message,
              timestamp: new Date().toISOString()
            }
          ]
        }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Track admin presence
          await channel.track({
            user_id: 'admin-user',
            role: 'admin',
            online_at: new Date().toISOString()
          });
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [researchId]);

  // Auto-generate sample data updates for demo
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 5 seconds
        const events = [
          () => setData(prev => ({ ...prev, interviews: prev.interviews + 1 })),
          () => setData(prev => ({
            ...prev,
            alerts: [
              ...prev.alerts.slice(-4),
              {
                id: `auto-${Date.now()}`,
                type: 'success',
                message: 'Entrevista sincronizada automaticamente',
                timestamp: new Date().toISOString()
              }
            ]
          }))
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        randomEvent();
        setLastUpdate(new Date());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const broadcastInterviewCompleted = async (region: string) => {
    const channel = supabase.channel(`research-${researchId}`);
    await channel.send({
      type: 'broadcast',
      event: 'interview_completed',
      payload: { region, timestamp: new Date().toISOString() }
    });
  };

  const broadcastQuotaAlert = async (message: string) => {
    const channel = supabase.channel(`research-${researchId}`);
    await channel.send({
      type: 'broadcast',
      event: 'quota_alert',
      payload: { message, timestamp: new Date().toISOString() }
    });
  };

  return {
    data,
    isConnected,
    lastUpdate,
    broadcastInterviewCompleted,
    broadcastQuotaAlert
  };
};
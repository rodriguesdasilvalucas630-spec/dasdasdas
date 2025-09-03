import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useOfflineSync } from '@/hooks/useOfflineSync';

export const AutoSyncStatus = () => {
  const { 
    isOnline, 
    isSyncing, 
    offlineData, 
    forceSync, 
    clearSyncedData 
  } = useOfflineSync();

  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Wifi className="h-5 w-5 text-success" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse"></div>
                </div>
                <CardTitle className="text-lg">Sistema Online</CardTitle>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <WifiOff className="h-5 w-5 text-warning" />
                <CardTitle className="text-lg text-warning">Modo Offline</CardTitle>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {isSyncing && (
              <div className="flex items-center space-x-1">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-primary">Sincronizando...</span>
              </div>
            )}
            
            {offlineData.pendingSync > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {offlineData.pendingSync} pendente{offlineData.pendingSync > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
        
        <CardDescription>
          {isOnline 
            ? 'Dados sendo sincronizados automaticamente em tempo real'
            : 'Dados sendo salvos localmente - sincronização automática quando voltar online'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className={`p-3 rounded-lg ${isOnline ? 'bg-success/10' : 'bg-muted'}`}>
              {isOnline ? (
                <Upload className="h-6 w-6 text-success mx-auto" />
              ) : (
                <Download className="h-6 w-6 text-muted-foreground mx-auto" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {isOnline ? 'Enviando' : 'Salvando Local'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOnline ? 'Dados na nuvem' : 'Dados seguros'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className={`p-3 rounded-lg ${isSyncing ? 'bg-primary/10' : 'bg-muted'}`}>
              <RefreshCw className={`h-6 w-6 mx-auto ${isSyncing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isSyncing ? 'Ativo' : 'Aguardando'}
              </p>
              <p className="text-xs text-muted-foreground">
                Sincronização
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className={`p-3 rounded-lg ${offlineData.interviews.length > 0 ? 'bg-info/10' : 'bg-muted'}`}>
              <CheckCircle2 className={`h-6 w-6 mx-auto ${offlineData.interviews.length > 0 ? 'text-info' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-sm font-medium">{offlineData.interviews.length}</p>
              <p className="text-xs text-muted-foreground">
                Entrevistas Salvas
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {!isOnline && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você está offline. Todas as entrevistas serão salvas localmente e sincronizadas automaticamente quando a conexão for restaurada.
            </AlertDescription>
          </Alert>
        )}

        {offlineData.pendingSync > 0 && isOnline && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {offlineData.pendingSync} entrevista{offlineData.pendingSync > 1 ? 's' : ''} aguardando sincronização. 
              O processo acontece automaticamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Last Sync Info */}
        {offlineData.lastSync && (
          <div className="text-xs text-muted-foreground text-center">
            Última sincronização: {offlineData.lastSync.toLocaleString('pt-BR')}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1"
          >
            {showDetails ? 'Ocultar' : 'Ver'} Detalhes
          </Button>
          
          {isOnline && offlineData.pendingSync > 0 && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={forceSync}
              disabled={isSyncing}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Forçar Sync
            </Button>
          )}
        </div>

        {/* Detailed View */}
        {showDetails && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <h4 className="font-medium text-sm">Detalhes da Sincronização</h4>
            
            {offlineData.interviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma entrevista armazenada localmente.</p>
            ) : (
              <div className="space-y-2">
                {offlineData.interviews.slice(-5).map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <span>Entrevista {interview.id.slice(-6)}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(interview.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                      {interview.synced ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Clock className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </div>
                ))}
                
                {offlineData.interviews.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{offlineData.interviews.length - 5} entrevistas adicionais
                  </p>
                )}
              </div>
            )}

            {offlineData.interviews.filter(i => i.synced).length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearSyncedData}
                className="w-full"
              >
                Limpar Dados Sincronizados
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
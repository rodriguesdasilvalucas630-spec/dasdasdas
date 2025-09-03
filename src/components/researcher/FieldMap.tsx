import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Navigation, 
  Target, 
  CheckCircle2, 
  AlertTriangle,
  Smartphone,
  Zap
} from "lucide-react";

interface RegionQuota {
  id: string;
  name: string;
  myTarget: number;
  completed: number;
  progress: number;
  coordinates: { lat: number; lng: number };
  status: 'pending' | 'active' | 'complete';
}

interface FieldMapProps {
  selectedResearch: string;
  regionQuotas: RegionQuota[];
  onStartInterview: (regionId: string) => void;
}

export const FieldMap = ({ selectedResearch, regionQuotas, onStartInterview }: FieldMapProps) => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Simulated GPS tracking
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError('Não foi possível obter sua localização. Verifique as permissões.');
          // Fallback to São Paulo center for demo
          setCurrentLocation({
            lat: -23.550520,
            lng: -46.633309
          });
        }
      );
    } else {
      setLocationError('Geolocalização não é suportada neste dispositivo.');
    }
  }, []);

  // Check if user is within authorized region
  const isInAuthorizedRegion = (regionId: string) => {
    if (!currentLocation) return false;
    
    const region = regionQuotas.find(r => r.id === regionId);
    if (!region) return false;
    
    // Simple distance calculation (for demo purposes)
    const distance = Math.sqrt(
      Math.pow(currentLocation.lat - region.coordinates.lat, 2) +
      Math.pow(currentLocation.lng - region.coordinates.lng, 2)
    );
    
    // If within ~5km (0.05 degrees), consider as authorized
    return distance < 0.05;
  };

  const getStatusColor = (status: string, progress: number) => {
    if (status === 'complete') return 'bg-map-complete';
    if (progress >= 70) return 'bg-map-progress';
    if (progress >= 40) return 'bg-warning';
    return 'bg-map-pending';
  };

  const getStatusBadge = (status: string, progress: number) => {
    if (status === 'complete') return { variant: 'default' as const, label: 'Concluída' };
    if (progress >= 70) return { variant: 'secondary' as const, label: 'Quase Completa' };
    if (progress >= 40) return { variant: 'outline' as const, label: 'Em Progresso' };
    return { variant: 'destructive' as const, label: 'Pendente' };
  };

  return (
    <div className="space-y-6">
      {/* Location Status */}
      {locationError && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Mapa de Campo - GPS Ativo</span>
              </CardTitle>
              <CardDescription>
                Suas regiões de coleta com status em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted rounded-lg h-96 overflow-hidden">
                {/* Simulated Map */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5">
                  {/* Current Location Indicator */}
                  {currentLocation && (
                    <div 
                      className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse"
                      style={{
                        top: `${((currentLocation.lat + 23.6) * 500)}px`,
                        left: `${((currentLocation.lng + 46.8) * 600)}px`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75"></div>
                    </div>
                  )}
                  
                  {/* Region Areas */}
                  {regionQuotas.map((region) => (
                    <div
                      key={region.id}
                      className={`absolute rounded-lg border-2 border-white shadow-md cursor-pointer transition-all transform hover:scale-105 ${
                        getStatusColor(region.status, region.progress)
                      } ${
                        selectedRegion === region.id ? 'ring-2 ring-primary ring-offset-2' : ''
                      } ${
                        isInAuthorizedRegion(region.id) ? 'ring-2 ring-success ring-offset-1' : ''
                      }`}
                      style={{
                        top: `${((region.coordinates.lat + 23.6) * 500)}px`,
                        left: `${((region.coordinates.lng + 46.8) * 600)}px`,
                        width: '100px',
                        height: '80px'
                      }}
                      onClick={() => setSelectedRegion(region.id)}
                    >
                      <div className="p-2 text-center">
                        <div className="text-xs font-medium text-white drop-shadow">
                          {region.name}
                        </div>
                        <div className="text-xs text-white/90 drop-shadow">
                          {region.completed}/{region.myTarget}
                        </div>
                        {isInAuthorizedRegion(region.id) && (
                          <CheckCircle2 className="h-3 w-3 text-success absolute -top-1 -right-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <h4 className="text-sm font-medium mb-2">Legenda</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                      <span>Sua localização</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-map-complete"></div>
                      <span>Meta atingida</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-map-progress"></div>
                      <span>Em progresso</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-map-pending"></div>
                      <span>Pendente</span>
                    </div>
                  </div>
                </div>

                {/* GPS Status */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                  <div className="flex items-center space-x-2 text-xs">
                    <Smartphone className="h-3 w-3 text-success" />
                    <span className="font-medium">GPS Ativo</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Region Details & Actions */}
        <div className="space-y-4">
          {selectedRegion ? (
            (() => {
              const region = regionQuotas.find(r => r.id === selectedRegion);
              if (!region) return null;
              
              const statusBadge = getStatusBadge(region.status, region.progress);
              const isAuthorized = isInAuthorizedRegion(region.id);
              
              return (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{region.name}</h3>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Sua Meta</span>
                          <span className="text-sm font-medium">
                            {region.completed} / {region.myTarget} entrevistas
                          </span>
                        </div>
                        
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              region.status === 'complete' ? 'bg-map-complete' :
                              region.progress >= 70 ? 'bg-map-progress' :
                              region.progress >= 40 ? 'bg-warning' : 'bg-map-pending'
                            }`}
                            style={{ width: `${region.progress}%` }}
                          />
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {region.progress}% da meta individual concluído
                        </div>
                        
                        {/* Location Status */}
                        <div className={`p-3 rounded-lg ${
                          isAuthorized 
                            ? 'bg-success/10 border border-success/20' 
                            : 'bg-warning/10 border border-warning/20'
                        }`}>
                          <div className="flex items-center space-x-2">
                            {isAuthorized ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <Navigation className="h-4 w-4 text-warning" />
                            )}
                            <span className="text-sm font-medium">
                              {isAuthorized 
                                ? 'Você está na região autorizada' 
                                : 'Você não está na região'}
                            </span>
                          </div>
                          {!isAuthorized && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Dirija-se à região para aplicar entrevistas
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2 pt-2">
                          <Button 
                            variant={isAuthorized ? "electoral" : "outline"} 
                            size="sm" 
                            className="flex-1"
                            disabled={!isAuthorized}
                            onClick={() => onStartInterview(region.id)}
                          >
                            <Target className="h-3 w-3" />
                            {isAuthorized ? 'Aplicar Entrevista' : 'Fora da Região'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-muted-foreground mb-2">
                  Selecione uma região
                </h3>
                <p className="text-sm text-muted-foreground">
                  Toque em uma região no mapa para ver detalhes e começar a coleta
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Quick Stats */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-medium mb-4">Resumo das Suas Regiões</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Regiões</span>
                  <span className="font-medium">{regionQuotas.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Concluídas</span>
                  <span className="font-medium text-success">
                    {regionQuotas.filter(r => r.status === 'complete').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Em Progresso</span>
                  <span className="font-medium text-info">
                    {regionQuotas.filter(r => r.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pendentes</span>
                  <span className="font-medium text-warning">
                    {regionQuotas.filter(r => r.status === 'pending').length}
                  </span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between font-medium">
                  <span>Meta Total</span>
                  <span className="text-primary">
                    {regionQuotas.reduce((acc, r) => acc + r.completed, 0)} / {regionQuotas.reduce((acc, r) => acc + r.myTarget, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GPS Controls */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-medium mb-4">Controles GPS</h4>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full">
                  <Zap className="h-4 w-4" />
                  Atualizar Localização
                </Button>
                <div className="text-xs text-muted-foreground">
                  <p>• GPS é obrigatório para aplicar entrevistas</p>
                  <p>• Todas as entrevistas são georreferenciadas</p>
                  <p>• Você só pode entrevistar em regiões autorizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Users, BarChart3, Zap } from "lucide-react";

interface MapRegion {
  id: string;
  name: string;
  status: 'complete' | 'progress' | 'pending';
  progress: number;
  totalInterviews: number;
  completedInterviews: number;
  assignedResearchers: string[];
  coordinates: { lat: number; lng: number };
}

export const InteractiveMap = () => {
  const [selectedCity, setSelectedCity] = useState("sao-paulo");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Mock data for São Paulo neighborhoods
  const regions: MapRegion[] = [
    {
      id: 'centro',
      name: 'Centro',
      status: 'complete',
      progress: 100,
      totalInterviews: 150,
      completedInterviews: 150,
      assignedResearchers: ['Maria Silva', 'João Santos'],
      coordinates: { lat: -23.550520, lng: -46.633309 }
    },
    {
      id: 'zona-norte',
      name: 'Zona Norte',
      status: 'progress',
      progress: 65,
      totalInterviews: 200,
      completedInterviews: 130,
      assignedResearchers: ['Maria Silva'],
      coordinates: { lat: -23.520000, lng: -46.630000 }
    },
    {
      id: 'zona-sul',
      name: 'Zona Sul',
      status: 'progress',
      progress: 80,
      totalInterviews: 180,
      completedInterviews: 144,
      assignedResearchers: ['João Santos'],
      coordinates: { lat: -23.580000, lng: -46.640000 }
    },
    {
      id: 'zona-leste',
      name: 'Zona Leste',
      status: 'progress',
      progress: 45,
      totalInterviews: 220,
      completedInterviews: 99,
      assignedResearchers: ['Ana Costa'],
      coordinates: { lat: -23.560000, lng: -46.580000 }
    },
    {
      id: 'zona-oeste',
      name: 'Zona Oeste',
      status: 'pending',
      progress: 25,
      totalInterviews: 160,
      completedInterviews: 40,
      assignedResearchers: ['Ana Costa'],
      coordinates: { lat: -23.560000, lng: -46.680000 }
    }
  ];

  const getStatusColor = (status: string, progress: number) => {
    if (status === 'complete') return 'bg-map-complete';
    if (progress >= 70) return 'bg-map-progress';
    if (progress >= 40) return 'bg-warning';
    return 'bg-map-pending';
  };

  const getStatusBadge = (status: string, progress: number) => {
    if (status === 'complete') return { variant: 'default' as const, label: 'Concluída' };
    if (progress >= 70) return { variant: 'secondary' as const, label: 'Em Progresso' };
    if (progress >= 40) return { variant: 'outline' as const, label: 'Atrasada' };
    return { variant: 'destructive' as const, label: 'Pendente' };
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center space-x-4">
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione a cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sao-paulo">São Paulo - SP</SelectItem>
            <SelectItem value="rio-janeiro">Rio de Janeiro - RJ</SelectItem>
            <SelectItem value="brasilia">Brasília - DF</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="sm">
          <Zap className="h-4 w-4" />
          Atualizar Dados
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="relative bg-muted rounded-lg h-96 overflow-hidden">
                {/* Simulated Map with regions */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5">
                  {regions.map((region) => (
                    <div
                      key={region.id}
                      className={`absolute rounded-lg border-2 border-white shadow-md cursor-pointer transition-all transform hover:scale-105 ${
                        getStatusColor(region.status, region.progress)
                      } ${
                        selectedRegion === region.id ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      style={{
                        top: `${((region.coordinates.lat + 23.6) * 500)}px`,
                        left: `${((region.coordinates.lng + 46.8) * 600)}px`,
                        width: '80px',
                        height: '60px'
                      }}
                      onClick={() => setSelectedRegion(region.id)}
                    >
                      <div className="p-2 text-center">
                        <div className="text-xs font-medium text-white drop-shadow">
                          {region.name}
                        </div>
                        <div className="text-xs text-white/90 drop-shadow">
                          {region.progress}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <h4 className="text-sm font-medium mb-2">Legenda</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-map-complete"></div>
                      <span>Concluída (100%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-map-progress"></div>
                      <span>Em progresso (70%+)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-warning"></div>
                      <span>Atrasada (40-69%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-map-pending"></div>
                      <span>Pendente (&lt;40%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Region Details */}
        <div className="space-y-4">
          {selectedRegion ? (
            (() => {
              const region = regions.find(r => r.id === selectedRegion);
              if (!region) return null;
              
              const statusBadge = getStatusBadge(region.status, region.progress);
              
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
                          <span className="text-sm text-muted-foreground">Progresso</span>
                          <span className="text-sm font-medium">{region.progress}%</span>
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
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center space-x-1 text-muted-foreground">
                              <BarChart3 className="h-3 w-3" />
                              <span>Entrevistas</span>
                            </div>
                            <p className="font-medium">
                              {region.completedInterviews} / {region.totalInterviews}
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-1 text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>Pesquisadores</span>
                            </div>
                            <p className="font-medium">{region.assignedResearchers.length}</p>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-sm text-muted-foreground">Equipe Responsável</span>
                          <div className="mt-1 space-y-1">
                            {region.assignedResearchers.map((researcher, index) => (
                              <div key={index} className="text-sm">{researcher}</div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            Ver Detalhes
                          </Button>
                          <Button variant="secondary" size="sm">
                            <MapPin className="h-3 w-3" />
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
                  Clique em uma região no mapa para ver detalhes da coleta
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Quick Stats */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-medium mb-4">Resumo da Cidade</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Regiões</span>
                  <span className="font-medium">{regions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Concluídas</span>
                  <span className="font-medium text-success">
                    {regions.filter(r => r.status === 'complete').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Em Progresso</span>
                  <span className="font-medium text-info">
                    {regions.filter(r => r.status === 'progress').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pendentes</span>
                  <span className="font-medium text-warning">
                    {regions.filter(r => r.status === 'pending').length}
                  </span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between font-medium">
                  <span>Progresso Geral</span>
                  <span className="text-primary">
                    {Math.round(
                      regions.reduce((acc, r) => acc + r.progress, 0) / regions.length
                    )}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
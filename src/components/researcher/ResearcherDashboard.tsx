import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  Target, 
  CheckCircle2, 
  Clock,
  Navigation,
  Users,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { FieldMap } from "./FieldMap";
import { InterviewForm } from "./InterviewForm";
import { useAuthContext } from "@/components/AuthProvider";
import { LogOut } from "lucide-react";

interface AssignedResearch {
  id: string;
  name: string;
  status: 'active' | 'completed';
  myProgress: number;
  myInterviews: number;
  targetInterviews: number;
  assignedRegions: string[];
  deadline: string;
}

interface RegionQuota {
  id: string;
  name: string;
  myTarget: number;
  completed: number;
  progress: number;
  coordinates: { lat: number; lng: number };
  status: 'pending' | 'active' | 'complete';
}

export const ResearcherDashboard = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'map' | 'interview'>('dashboard');
  const [selectedResearch, setSelectedResearch] = useState<string>('');
  const { profile, signOut } = useAuthContext();

  const researcherName = profile?.full_name || "Pesquisador";
  const researcherId = profile?.user_id || "";

  const assignedResearches: AssignedResearch[] = [
    {
      id: '1',
      name: 'Intenção de Voto - São Paulo Capital',
      status: 'active',
      myProgress: 75,
      myInterviews: 45,
      targetInterviews: 60,
      assignedRegions: ['Centro', 'Zona Norte'],
      deadline: '2024-01-25'
    },
    {
      id: '2',
      name: 'Avaliação de Gestão Municipal - Rio de Janeiro',
      status: 'active',
      myProgress: 40,
      myInterviews: 16,
      targetInterviews: 40,
      assignedRegions: ['Copacabana', 'Ipanema'],
      deadline: '2024-01-30'
    }
  ];

  const regionQuotas: RegionQuota[] = [
    {
      id: 'centro',
      name: 'Centro',
      myTarget: 30,
      completed: 25,
      progress: 83,
      coordinates: { lat: -23.550520, lng: -46.633309 },
      status: 'active'
    },
    {
      id: 'zona-norte',
      name: 'Zona Norte',
      myTarget: 30,
      completed: 20,
      progress: 67,
      coordinates: { lat: -23.520000, lng: -46.630000 },
      status: 'active'
    },
    {
      id: 'copacabana',
      name: 'Copacabana',
      myTarget: 20,
      completed: 8,
      progress: 40,
      coordinates: { lat: -22.970722, lng: -43.182365 },
      status: 'pending'
    },
    {
      id: 'ipanema',
      name: 'Ipanema',
      myTarget: 20,
      completed: 8,
      progress: 40,
      coordinates: { lat: -22.984393, lng: -43.204948 },
      status: 'pending'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'success';
      case 'active': return 'info';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const getTodayQuota = () => {
    const totalTarget = assignedResearches
      .filter(r => r.status === 'active')
      .reduce((acc, r) => acc + r.targetInterviews, 0);
    const totalCompleted = assignedResearches
      .filter(r => r.status === 'active')
      .reduce((acc, r) => acc + r.myInterviews, 0);
    
    return {
      target: totalTarget,
      completed: totalCompleted,
      remaining: totalTarget - totalCompleted
    };
  };

  const todayQuota = getTodayQuota();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Painel do Pesquisador</h1>
              <p className="text-muted-foreground">Olá, {researcherName} - Suas pesquisas ativas</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant={activeView === 'map' ? 'electoral' : 'outline'} 
                size="sm"
                onClick={() => setActiveView('map')}
              >
                <MapPin className="h-4 w-4" />
                Mapa de Campo
              </Button>
              <Button 
                variant={activeView === 'interview' ? 'electoral' : 'outline'} 
                size="sm"
                onClick={() => setActiveView('interview')}
              >
                <Target className="h-4 w-4" />
                Nova Entrevista
              </Button>
              <Button onClick={signOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Visão Geral', icon: BarChart3 },
              { id: 'map', label: 'Mapa de Campo', icon: MapPin },
              { id: 'interview', label: 'Aplicar Entrevista', icon: Target }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                    activeView === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeView === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meta Total</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{todayQuota.target}</div>
                  <p className="text-xs text-muted-foreground">entrevistas atribuídas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{todayQuota.completed}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((todayQuota.completed / todayQuota.target) * 100)}% da meta
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Restantes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">{todayQuota.remaining}</div>
                  <p className="text-xs text-muted-foreground">para completar hoje</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Researches */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Pesquisas Ativas</h2>
              <div className="grid gap-6">
                {assignedResearches.filter(r => r.status === 'active').map((research) => (
                  <Card key={research.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{research.name}</CardTitle>
                          <CardDescription>
                            Regiões: {research.assignedRegions.join(', ')}
                          </CardDescription>
                        </div>
                        <Badge variant="default">Ativa</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>Seu Progresso</span>
                          <span className="font-medium">
                            {research.myInterviews} / {research.targetInterviews} entrevistas
                          </span>
                        </div>
                        <Progress value={research.myProgress} className="h-2" />
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Prazo: {new Date(research.deadline).toLocaleDateString('pt-BR')}
                          </span>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedResearch(research.id);
                                setActiveView('map');
                              }}
                            >
                              <Navigation className="h-3 w-3" />
                              Ver Mapa
                            </Button>
                            <Button 
                              variant="electoral" 
                              size="sm"
                              onClick={() => {
                                setSelectedResearch(research.id);
                                setActiveView('interview');
                              }}
                            >
                              <Target className="h-3 w-3" />
                              Aplicar Entrevista
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Region Status */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Status por Região</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {regionQuotas.map((region) => (
                  <Card key={region.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{region.name}</h3>
                        <Badge variant={getStatusColor(region.status) as any}>
                          {region.status === 'complete' ? 'Concluída' :
                           region.status === 'active' ? 'Em Progresso' : 'Pendente'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{region.completed} / {region.myTarget}</span>
                        </div>
                        <Progress value={region.progress} className="h-1.5" />
                        <div className="text-xs text-muted-foreground">
                          {region.progress}% concluído
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Acesso direto às funcionalidades principais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4"
                    onClick={() => setActiveView('interview')}
                  >
                    <div className="text-center">
                      <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="font-medium">Aplicar Entrevista</div>
                      <div className="text-xs text-muted-foreground">
                        Comece uma nova coleta
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4"
                    onClick={() => setActiveView('map')}
                  >
                    <div className="text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-secondary" />
                      <div className="font-medium">Ver Mapa</div>
                      <div className="text-xs text-muted-foreground">
                        Localize áreas de coleta
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-info" />
                      <div className="font-medium">Meu Histórico</div>
                      <div className="text-xs text-muted-foreground">
                        Ver entrevistas anteriores
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'map' && (
          <FieldMap 
            selectedResearch={selectedResearch}
            regionQuotas={regionQuotas}
            onStartInterview={(regionId) => {
              setActiveView('interview');
            }}
          />
        )}

        {activeView === 'interview' && (
          <InterviewForm 
            selectedResearch={selectedResearch}
            onComplete={() => {
              setActiveView('dashboard');
            }}
          />
        )}
      </main>
    </div>
  );
};
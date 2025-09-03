import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  MapPin, 
  Users, 
  Plus, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { InteractiveMap } from "./InteractiveMap";
import { CreateResearchModal } from "./CreateResearchModal";
import { AutoSyncStatus } from "@/components/auto/AutoSyncStatus";
import { AutoDistributionPanel } from "@/components/auto/AutoDistributionPanel";
import { AutoAlertSystem } from "@/components/auto/AutoAlertSystem";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface Research {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  totalSamples: number;
  completedSamples: number;
  city: string;
  marginError: number;
  confidence: number;
  createdAt: string;
  estimatedCompletion: string;
}

interface Researcher {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  assignedResearch: string[];
  lastActivity: string;
  completedInterviews: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  researchId?: string;
  timestamp: string;
}

export const AdminDashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'research' | 'researchers' | 'map' | 'automation'>('overview');
  const { data: realtimeData } = useRealtimeUpdates('demo-research');
  const { profile, signOut } = useAuthContext();

  // Mock data
  const researches: Research[] = [
    {
      id: '1',
      name: 'Intenção de Voto - São Paulo Capital',
      status: 'active',
      progress: 68,
      totalSamples: 1200,
      completedSamples: 816,
      city: 'São Paulo',
      marginError: 3,
      confidence: 95,
      createdAt: '2024-01-15',
      estimatedCompletion: '2024-01-25'
    },
    {
      id: '2',
      name: 'Avaliação de Gestão Municipal - Rio de Janeiro',
      status: 'active',
      progress: 45,
      totalSamples: 800,
      completedSamples: 360,
      city: 'Rio de Janeiro',
      marginError: 3.5,
      confidence: 95,
      createdAt: '2024-01-10',
      estimatedCompletion: '2024-01-30'
    },
    {
      id: '3',
      name: 'Rejeição de Candidatos - Brasília',
      status: 'completed',
      progress: 100,
      totalSamples: 600,
      completedSamples: 600,
      city: 'Brasília',
      marginError: 4,
      confidence: 95,
      createdAt: '2024-01-01',
      estimatedCompletion: '2024-01-15'
    }
  ];

  const researchers: Researcher[] = [
    {
      id: '1',
      name: 'Maria Silva',
      email: 'maria@example.com',
      status: 'active',
      assignedResearch: ['1', '2'],
      lastActivity: '2024-01-20 14:30',
      completedInterviews: 45
    },
    {
      id: '2',
      name: 'João Santos',
      email: 'joao@example.com',
      status: 'active',
      assignedResearch: ['1'],
      lastActivity: '2024-01-20 16:15',
      completedInterviews: 32
    },
    {
      id: '3',
      name: 'Ana Costa',
      email: 'ana@example.com',
      status: 'inactive',
      assignedResearch: ['2'],
      lastActivity: '2024-01-19 09:20',
      completedInterviews: 18
    }
  ];

  const alerts: Alert[] = [
    {
      id: '1',
      type: 'warning',
      message: 'Zona Norte de São Paulo está com 30% de atraso na coleta',
      researchId: '1',
      timestamp: '2024-01-20 15:45'
    },
    {
      id: '2',
      type: 'error',
      message: 'Pesquisador Ana Costa não envia entrevistas há 2 dias',
      timestamp: '2024-01-20 14:20'
    },
    {
      id: '3',
      type: 'info',
      message: 'Quota de jovens (18-24 anos) sub-representada em São Paulo',
      researchId: '1',
      timestamp: '2024-01-20 13:15'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      case 'info': return CheckCircle2;
      default: return AlertCircle;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard Administrativo</h1>
              <p className="text-muted-foreground">
                Olá, {profile?.full_name} - Vote Scout Pro
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={() => setShowCreateModal(true)} variant="electoral" size="lg">
                <Plus className="h-4 w-4" />
                Nova Pesquisa
              </Button>
              <Button onClick={signOut} variant="outline" size="lg">
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
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'research', label: 'Pesquisas', icon: TrendingUp },
              { id: 'researchers', label: 'Pesquisadores', icon: Users },
              { id: 'map', label: 'Mapa Interativo', icon: MapPin },
              { id: 'automation', label: 'Automação', icon: AlertTriangle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                    selectedTab === tab.id
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
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pesquisas Ativas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {researches.filter(r => r.status === 'active').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {researches.filter(r => r.status === 'completed').length} concluídas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pesquisadores Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {researchers.filter(r => r.status === 'active').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    de {researchers.length} cadastrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Entrevistas Coletadas</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-info">
                    {researches.reduce((acc, r) => acc + r.completedSamples, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    de {researches.reduce((acc, r) => acc + r.totalSamples, 0)} planejadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {alerts.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {alerts.filter(a => a.type === 'error').length} críticos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas Recentes</CardTitle>
                <CardDescription>Monitore situações que precisam de atenção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert) => {
                    const Icon = getAlertIcon(alert.type);
                    return (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                        <Icon className={`h-5 w-5 mt-0.5 ${
                          alert.type === 'error' ? 'text-danger' :
                          alert.type === 'warning' ? 'text-warning' : 'text-info'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {alert.type === 'error' ? 'Crítico' : 
                           alert.type === 'warning' ? 'Atenção' : 'Info'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'research' && (
          <div className="space-y-6">
            <div className="grid gap-6">
              {researches.map((research) => (
                <Card key={research.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{research.name}</CardTitle>
                        <CardDescription>{research.city}</CardDescription>
                      </div>
                      <Badge variant={getStatusColor(research.status) as any}>
                        {research.status === 'active' ? 'Ativa' :
                         research.status === 'completed' ? 'Concluída' : 'Pendente'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progresso da Coleta</span>
                        <span className="font-medium">
                          {research.completedSamples} / {research.totalSamples} entrevistas
                        </span>
                      </div>
                      <Progress value={research.progress} className="h-2" />
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Margem de Erro</span>
                          <p className="font-medium">±{research.marginError}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Confiança</span>
                          <p className="font-medium">{research.confidence}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Criada em</span>
                          <p className="font-medium">
                            {new Date(research.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Previsão</span>
                          <p className="font-medium">
                            {new Date(research.estimatedCompletion).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Ver Detalhes</Button>
                        <Button variant="outline" size="sm">Relatório</Button>
                        {research.status === 'active' && (
                          <Button variant="secondary" size="sm">Gerenciar</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'researchers' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestão de Pesquisadores</CardTitle>
                    <CardDescription>Gerencie sua equipe de campo</CardDescription>
                  </div>
                  <Button variant="secondary">
                    <Plus className="h-4 w-4" />
                    Adicionar Pesquisador
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {researchers.map((researcher) => (
                    <div key={researcher.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          researcher.status === 'active' ? 'bg-success' : 'bg-muted-foreground'
                        }`} />
                        <div>
                          <h4 className="font-medium">{researcher.name}</h4>
                          <p className="text-sm text-muted-foreground">{researcher.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{researcher.completedInterviews} entrevistas</p>
                        <p className="text-xs text-muted-foreground">
                          Última atividade: {new Date(researcher.lastActivity).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Editar</Button>
                        <Button variant="outline" size="sm">Pesquisas</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'map' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mapa Interativo - Coleta em Tempo Real</CardTitle>
                <CardDescription>
                  Acompanhe o progresso geográfico das pesquisas ativas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InteractiveMap />
              </CardContent>
            </Card>
          </div>
        )}
        {selectedTab === 'automation' && (
          <div className="space-y-6">
            <AutoSyncStatus />
            <AutoDistributionPanel 
              researchers={researchers.map(r => ({ 
                id: r.id,
                name: r.name, 
                efficiency: 0.8 + Math.random() * 0.2,
                currentLoad: r.completedInterviews,
                expertise: ['eleitorais'],
                location: { lat: -23.550520, lng: -46.633309 },
                status: r.status === 'active' ? 'available' as const : 'offline' as const
              }))} 
              regions={[
                {
                  id: 'centro',
                  name: 'Centro',
                  targetInterviews: 150,
                  completedInterviews: 120,
                  priority: 3,
                  difficulty: 2,
                  coordinates: { lat: -23.550520, lng: -46.633309 }
                }
              ]} 
              onDistributionUpdate={() => {}} 
            />
            <AutoAlertSystem />
          </div>
        )}
      </main>

      {/* Create Research Modal */}
      <CreateResearchModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
};
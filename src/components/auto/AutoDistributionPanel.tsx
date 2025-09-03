import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  MapPin, 
  Bot, 
  Zap, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { useAutoDistribution, AutoDistributionEngine } from '@/utils/autoDistribution';

interface AutoDistributionPanelProps {
  researchers: Array<{
    id: string;
    name: string;
    efficiency: number;
    currentLoad: number;
    expertise?: string[];
    location: { lat: number; lng: number };
    status: 'available' | 'busy' | 'offline';
  }>;
  regions: Array<{
    id: string;
    name: string;
    targetInterviews: number;
    completedInterviews: number;
    priority: number;
    difficulty: number;
    coordinates: { lat: number; lng: number };
  }>;
  onDistributionUpdate: (assignments: any[]) => void;
}

export const AutoDistributionPanel = ({ 
  researchers, 
  regions, 
  onDistributionUpdate 
}: AutoDistributionPanelProps) => {
  const { createDistributionEngine } = useAutoDistribution();
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [lastDistribution, setLastDistribution] = useState<Date | null>(null);
  const [distributionResults, setDistributionResults] = useState<any[]>([]);
  const [optimizationScore, setOptimizationScore] = useState(0);

  // Auto-distribution engine instance
  const [engine, setEngine] = useState<AutoDistributionEngine | null>(null);

  useEffect(() => {
    if (researchers.length > 0 && regions.length > 0) {
      const newEngine = createDistributionEngine(researchers, regions);
      setEngine(newEngine);
    }
  }, [researchers, regions, createDistributionEngine]);

  // Auto-mode: redistribute when researchers change status
  useEffect(() => {
    if (isAutoMode && engine && distributionResults.length > 0) {
      const offlineResearchers = researchers.filter(r => r.status === 'offline');
      
      if (offlineResearchers.length > 0) {
        console.log('🤖 Auto-rebalanceamento detectado - pesquisador offline');
        handleAutoRebalance();
      }
    }
  }, [researchers, isAutoMode, engine]);

  // Performance simulation for demo
  useEffect(() => {
    if (isAutoMode) {
      const interval = setInterval(() => {
        // Simulate performance updates
        const performanceData: Record<string, number> = {};
        researchers.forEach(r => {
          performanceData[r.id] = 0.7 + Math.random() * 0.3; // 70-100% performance
        });

        if (engine && distributionResults.length > 0) {
          const optimizedAssignments = engine.optimizeAssignments(distributionResults, performanceData);
          const score = calculateOptimizationScore(optimizedAssignments);
          setOptimizationScore(score);
        }
      }, 10000); // Every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isAutoMode, engine, distributionResults, researchers]);

  const calculateOptimizationScore = (assignments: any[]) => {
    // Simple optimization score based on confidence and load balance
    const avgConfidence = assignments.reduce((sum, a) => sum + a.confidence, 0) / assignments.length;
    const loadVariance = calculateLoadVariance(assignments);
    return Math.round((avgConfidence * 0.7 + (1 - loadVariance) * 0.3) * 100);
  };

  const calculateLoadVariance = (assignments: any[]) => {
    const loads = researchers.map(r => {
      return assignments.filter(a => a.researcherId === r.id).reduce((sum, a) => sum + a.targetInterviews, 0);
    });
    
    const avgLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length;
    return Math.sqrt(variance) / avgLoad || 0;
  };

  const handleAutoDistribute = async () => {
    if (!engine) return;

    setIsDistributing(true);
    console.log('🚀 Iniciando distribuição automática inteligente...');

    try {
      // Calculate total interviews needed
      const totalInterviews = regions.reduce((sum, region) => 
        sum + (region.targetInterviews - region.completedInterviews), 0
      );

      // Run auto-distribution algorithm
      const assignments = engine.autoDistribute(totalInterviews);
      
      setDistributionResults(assignments);
      setLastDistribution(new Date());
      onDistributionUpdate(assignments);

      // Calculate optimization score
      const score = calculateOptimizationScore(assignments);
      setOptimizationScore(score);

      console.log(`✅ Distribuição concluída com score de otimização: ${score}%`);
      
    } catch (error) {
      console.error('❌ Erro na distribuição automática:', error);
    } finally {
      setIsDistributing(false);
    }
  };

  const handleAutoRebalance = async () => {
    if (!engine || distributionResults.length === 0) return;

    console.log('🔄 Executando rebalanceamento automático...');
    
    const offlineResearchers = researchers.filter(r => r.status === 'offline');
    
    for (const researcher of offlineResearchers) {
      const rebalancedAssignments = engine.rebalanceAssignments(distributionResults, researcher.id);
      setDistributionResults(rebalancedAssignments);
      onDistributionUpdate(rebalancedAssignments);
    }
  };

  const toggleAutoMode = () => {
    setIsAutoMode(!isAutoMode);
    if (!isAutoMode) {
      console.log('🤖 Modo automático ativado - rebalanceamento inteligente habilitado');
    } else {
      console.log('⏸️ Modo automático desativado');
    }
  };

  const getResearcherSummary = () => {
    const available = researchers.filter(r => r.status === 'available').length;
    const busy = researchers.filter(r => r.status === 'busy').length;
    const offline = researchers.filter(r => r.status === 'offline').length;
    
    return { available, busy, offline, total: researchers.length };
  };

  const getRegionSummary = () => {
    const completed = regions.filter(r => r.completedInterviews >= r.targetInterviews).length;
    const inProgress = regions.filter(r => r.completedInterviews > 0 && r.completedInterviews < r.targetInterviews).length;
    const pending = regions.filter(r => r.completedInterviews === 0).length;
    
    return { completed, inProgress, pending, total: regions.length };
  };

  const researcherSummary = getResearcherSummary();
  const regionSummary = getRegionSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Distribuição Automática Inteligente</CardTitle>
                <CardDescription>
                  Sistema de IA para otimização de alocação de pesquisadores
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={isAutoMode ? "electoral" : "outline"}
                size="sm"
                onClick={toggleAutoMode}
              >
                <Zap className={`h-4 w-4 ${isAutoMode ? 'animate-pulse' : ''}`} />
                {isAutoMode ? 'Auto ON' : 'Auto OFF'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAutoDistribute}
                disabled={isDistributing || researchers.length === 0}
              >
                <RefreshCw className={`h-4 w-4 ${isDistributing ? 'animate-spin' : ''}`} />
                {isDistributing ? 'Distribuindo...' : 'Redistribuir'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Researchers Status */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Pesquisadores</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-success">Disponíveis:</span>
                  <span className="font-medium">{researcherSummary.available}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warning">Ocupados:</span>
                  <span className="font-medium">{researcherSummary.busy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Offline:</span>
                  <span className="font-medium">{researcherSummary.offline}</span>
                </div>
              </div>
            </div>

            {/* Regions Status */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Regiões</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-success">Completas:</span>
                  <span className="font-medium">{regionSummary.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-info">Em Progresso:</span>
                  <span className="font-medium">{regionSummary.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warning">Pendentes:</span>
                  <span className="font-medium">{regionSummary.pending}</span>
                </div>
              </div>
            </div>

            {/* Optimization Score */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Otimização</span>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">{optimizationScore}%</div>
                <Progress value={optimizationScore} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Score de eficiência
                </div>
              </div>
            </div>

            {/* Auto Status */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Status Auto</span>
              </div>
              <div className="space-y-2">
                {isAutoMode ? (
                  <Badge variant="default" className="animate-pulse">
                    <Zap className="h-3 w-3" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Inativo
                  </Badge>
                )}
                {lastDistribution && (
                  <div className="text-xs text-muted-foreground">
                    Última: {lastDistribution.toLocaleTimeString('pt-BR')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Results */}
      {distributionResults.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>Resultado da Distribuição Automática</span>
            </CardTitle>
            <CardDescription>
              Atribuições otimizadas com base em eficiência, localização e carga de trabalho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distributionResults.map((assignment, index) => {
                const researcher = researchers.find(r => r.id === assignment.researcherId);
                const region = regions.find(r => r.id === assignment.regionId);
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <p className="font-medium">{researcher?.name}</p>
                        <p className="text-sm text-muted-foreground">{region?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{assignment.targetInterviews} entrevistas</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {Math.round(assignment.confidence * 100)}% confiança
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          até {assignment.estimatedCompletion.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-mode Active Indicator */}
      {isAutoMode && (
        <Card className="border-primary/50 bg-primary/5 animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bot className="h-6 w-6 text-primary" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse-ring"></div>
              </div>
              <div>
                <p className="font-medium text-primary">Modo Automático Ativado</p>
                <p className="text-sm text-muted-foreground">
                  O sistema irá redistribuir automaticamente quando pesquisadores mudarem de status
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
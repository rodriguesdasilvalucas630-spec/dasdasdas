interface Researcher {
  id: string;
  name: string;
  efficiency: number; // 0-1 score
  currentLoad: number; // number of assigned interviews
  expertise?: string[]; // areas of expertise (optional)
  location: { lat: number; lng: number };
  status: 'available' | 'busy' | 'offline';
}

interface Region {
  id: string;
  name: string;
  targetInterviews: number;
  completedInterviews: number;
  priority: number; // 1-5, higher = more urgent
  difficulty: number; // 1-5, higher = more difficult
  coordinates: { lat: number; lng: number };
}

interface Assignment {
  researcherId: string;
  regionId: string;
  targetInterviews: number;
  estimatedCompletion: Date;
  confidence: number; // 0-1 probability of success
}

export class AutoDistributionEngine {
  private researchers: Researcher[] = [];
  private regions: Region[] = [];

  constructor(researchers: Researcher[], regions: Region[]) {
    this.researchers = researchers;
    this.regions = regions;
  }

  // Calculate distance between two coordinates
  private calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Calculate assignment score based on multiple factors
  private calculateAssignmentScore(researcher: Researcher, region: Region): number {
    // Distance factor (closer is better)
    const distance = this.calculateDistance(researcher.location, region.coordinates);
    const distanceScore = Math.max(0, 1 - (distance / 50)); // 50km max distance

    // Efficiency factor
    const efficiencyScore = researcher.efficiency;

    // Load balancing factor (less loaded is better)
    const maxLoad = Math.max(...this.researchers.map(r => r.currentLoad));
    const loadScore = maxLoad > 0 ? 1 - (researcher.currentLoad / maxLoad) : 1;

    // Priority factor (higher priority regions get better researchers)
    const priorityBonus = region.priority / 5;

    // Availability factor
    const availabilityScore = researcher.status === 'available' ? 1 : 
                            researcher.status === 'busy' ? 0.5 : 0;

    // Weighted combination
    return (
      distanceScore * 0.25 +
      efficiencyScore * 0.3 +
      loadScore * 0.25 +
      priorityBonus * 0.1 +
      availabilityScore * 0.1
    );
  }

  // Main auto-distribution algorithm
  public autoDistribute(totalInterviews: number): Assignment[] {
    const assignments: Assignment[] = [];
    const availableResearchers = this.researchers.filter(r => r.status !== 'offline');
    
    if (availableResearchers.length === 0) {
      console.warn('⚠️ Nenhum pesquisador disponível para distribuição automática');
      return assignments;
    }

    console.log(`🤖 Iniciando distribuição automática de ${totalInterviews} entrevistas para ${availableResearchers.length} pesquisadores`);

    // Sort regions by priority and completion rate
    const sortedRegions = [...this.regions].sort((a, b) => {
      const aCompletion = a.completedInterviews / a.targetInterviews;
      const bCompletion = b.completedInterviews / b.targetInterviews;
      
      // Prioritize incomplete regions with high priority
      return (b.priority * (1 - bCompletion)) - (a.priority * (1 - aCompletion));
    });

    // Calculate assignments for each region
    for (const region of sortedRegions) {
      const remainingInterviews = region.targetInterviews - region.completedInterviews;
      if (remainingInterviews <= 0) continue;

      // Find best researchers for this region
      const researcherScores = availableResearchers.map(researcher => ({
        researcher,
        score: this.calculateAssignmentScore(researcher, region)
      })).sort((a, b) => b.score - a.score);

      // Distribute interviews among top researchers
      let remainingToAssign = remainingInterviews;
      const regionAssignments: Assignment[] = [];

      for (const { researcher, score } of researcherScores) {
        if (remainingToAssign <= 0) break;

        // Calculate how many interviews this researcher should get
        const maxAssignable = Math.min(
          remainingToAssign,
          Math.floor(researcher.efficiency * 20), // Max based on efficiency
          50 - researcher.currentLoad // Don't overload
        );

        if (maxAssignable > 0) {
          const targetInterviews = Math.min(maxAssignable, Math.ceil(remainingToAssign / 2));
          
          const assignment: Assignment = {
            researcherId: researcher.id,
            regionId: region.id,
            targetInterviews,
            estimatedCompletion: this.calculateEstimatedCompletion(researcher, targetInterviews, region),
            confidence: score
          };

          regionAssignments.push(assignment);
          remainingToAssign -= targetInterviews;
          researcher.currentLoad += targetInterviews;
        }
      }

      assignments.push(...regionAssignments);
    }

    // Log distribution results
    this.logDistributionResults(assignments);

    return assignments;
  }

  private calculateEstimatedCompletion(researcher: Researcher, interviews: number, region: Region): Date {
    // Base time: 15 minutes per interview
    const baseTimePerInterview = 15;
    
    // Adjust for researcher efficiency and region difficulty
    const adjustedTime = baseTimePerInterview * (2 - researcher.efficiency) * (region.difficulty / 3);
    
    // Total time in minutes
    const totalMinutes = interviews * adjustedTime;
    
    // Add buffer time (20%)
    const bufferedMinutes = totalMinutes * 1.2;
    
    // Estimate completion date
    const now = new Date();
    return new Date(now.getTime() + bufferedMinutes * 60 * 1000);
  }

  private logDistributionResults(assignments: Assignment[]): void {
    console.log('📊 Resultados da Distribuição Automática:');
    
    const researcherSummary = this.researchers.map(researcher => {
      const researcherAssignments = assignments.filter(a => a.researcherId === researcher.id);
      const totalAssigned = researcherAssignments.reduce((sum, a) => sum + a.targetInterviews, 0);
      const regions = researcherAssignments.map(a => this.regions.find(r => r.id === a.regionId)?.name).join(', ');
      
      return {
        name: researcher.name,
        assigned: totalAssigned,
        regions: regions || 'Nenhuma',
        efficiency: (researcher.efficiency * 100).toFixed(1) + '%'
      };
    });

    console.table(researcherSummary);

    const totalAssigned = assignments.reduce((sum, a) => sum + a.targetInterviews, 0);
    console.log(`✅ Total de entrevistas distribuídas: ${totalAssigned}`);
    console.log(`🎯 Confiança média das atribuições: ${(assignments.reduce((sum, a) => sum + a.confidence, 0) / assignments.length * 100).toFixed(1)}%`);
  }

  // Real-time rebalancing when researchers change status
  public rebalanceAssignments(assignments: Assignment[], changedResearcherId: string): Assignment[] {
    console.log(`🔄 Rebalanceamento automático ativado para pesquisador: ${changedResearcherId}`);
    
    const changedResearcher = this.researchers.find(r => r.id === changedResearcherId);
    if (!changedResearcher) return assignments;

    // If researcher went offline, redistribute their assignments
    if (changedResearcher.status === 'offline') {
      const affectedAssignments = assignments.filter(a => a.researcherId === changedResearcherId);
      const remainingAssignments = assignments.filter(a => a.researcherId !== changedResearcherId);
      
      // Redistribute affected assignments
      const totalToRedistribute = affectedAssignments.reduce((sum, a) => sum + a.targetInterviews, 0);
      const newAssignments = this.autoDistribute(totalToRedistribute);
      
      console.log(`📋 Redistribuídas ${totalToRedistribute} entrevistas devido à indisponibilidade`);
      
      return [...remainingAssignments, ...newAssignments];
    }

    return assignments;
  }

  // Auto-optimize assignments based on performance data
  public optimizeAssignments(assignments: Assignment[], performanceData: Record<string, number>): Assignment[] {
    console.log('🚀 Otimização automática baseada em performance');
    
    // Update researcher efficiency based on performance
    for (const [researcherId, performance] of Object.entries(performanceData)) {
      const researcher = this.researchers.find(r => r.id === researcherId);
      if (researcher) {
        // Gradually adjust efficiency (learning algorithm)
        researcher.efficiency = researcher.efficiency * 0.8 + performance * 0.2;
      }
    }

    // Recalculate assignments with updated efficiencies
    const totalInterviews = assignments.reduce((sum, a) => sum + a.targetInterviews, 0);
    return this.autoDistribute(totalInterviews);
  }
}

// Hook to use the auto-distribution engine
export const useAutoDistribution = () => {
  const createDistributionEngine = (researchers: Researcher[], regions: Region[]) => {
    return new AutoDistributionEngine(researchers, regions);
  };

  return { createDistributionEngine };
};
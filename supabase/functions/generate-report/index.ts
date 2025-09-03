import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReportRequest {
  researchId: string;
  type: 'summary' | 'detailed' | 'demographic' | 'geographic';
  format: 'pdf' | 'excel' | 'csv';
  filters?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { researchId, type, format, filters = {} }: ReportRequest = await req.json();

    console.log(`📊 Generating ${type} report for research ${researchId} in ${format} format`);

    // Get research data
    const { data: research, error: researchError } = await supabaseClient
      .from('researches')
      .select('*')
      .eq('id', researchId)
      .single();

    if (researchError || !research) {
      throw new Error('Pesquisa não encontrada');
    }

    // Get interviews data
    const { data: interviews, error: interviewsError } = await supabaseClient
      .from('interviews')
      .select(`
        *,
        research_regions(name),
        profiles(full_name)
      `)
      .eq('research_id', researchId)
      .eq('status', 'completed');

    if (interviewsError) {
      throw new Error('Erro ao buscar entrevistas');
    }

    // Get regions data
    const { data: regions, error: regionsError } = await supabaseClient
      .from('research_regions')
      .select('*')
      .eq('research_id', researchId);

    if (regionsError) {
      throw new Error('Erro ao buscar regiões');
    }

    // Process data based on report type
    let reportData: any = {};

    switch (type) {
      case 'summary':
        reportData = await generateSummaryReport(research, interviews, regions);
        break;
      case 'detailed':
        reportData = await generateDetailedReport(research, interviews, regions);
        break;
      case 'demographic':
        reportData = await generateDemographicReport(interviews);
        break;
      case 'geographic':
        reportData = await generateGeographicReport(interviews, regions);
        break;
    }

    // Generate report title and description
    const reportTitle = `${research.name} - Relatório ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const reportDescription = `Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} com ${interviews.length} entrevistas`;

    // Save report to database
    const { data: savedReport, error: saveError } = await supabaseClient
      .from('reports')
      .insert({
        research_id: researchId,
        type,
        title: reportTitle,
        description: reportDescription,
        data: reportData,
        filters,
        generated_by: req.headers.get('user-id') // Should be passed from frontend
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving report:', saveError);
      throw new Error('Erro ao salvar relatório');
    }

    console.log('✅ Report generated and saved:', savedReport.id);

    // Generate file URL based on format
    let fileUrl = '';
    if (format === 'pdf') {
      fileUrl = await generatePDFReport(reportData, reportTitle);
    } else if (format === 'excel') {
      fileUrl = await generateExcelReport(reportData, reportTitle);
    } else if (format === 'csv') {
      fileUrl = await generateCSVReport(reportData, reportTitle);
    }

    // Update report with file URL
    if (fileUrl) {
      await supabaseClient
        .from('reports')
        .update({ [`${format}_url`]: fileUrl })
        .eq('id', savedReport.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        reportId: savedReport.id,
        fileUrl,
        data: reportData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error generating report:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function generateSummaryReport(research: any, interviews: any[], regions: any[]) {
  const totalSample = research.calculated_sample_size || 0;
  const completedInterviews = interviews.length;
  const completionRate = (completedInterviews / totalSample) * 100;

  // Analyze voting intention if available
  const votingIntention: Record<string, number> = {};
  interviews.forEach(interview => {
    const vote = interview.answers?.voting_intention_stimulated;
    if (vote) {
      votingIntention[vote] = (votingIntention[vote] || 0) + 1;
    }
  });

  // Calculate percentages
  const votingPercentages: Record<string, number> = {};
  Object.entries(votingIntention).forEach(([candidate, count]) => {
    votingPercentages[candidate] = (count / completedInterviews) * 100;
  });

  return {
    overview: {
      researchName: research.name,
      city: research.city,
      marginError: research.margin_error,
      confidenceLevel: research.confidence_level,
      totalSample,
      completedInterviews,
      completionRate: Math.round(completionRate * 100) / 100,
      regions: regions.length
    },
    votingIntention: {
      data: votingPercentages,
      totalResponses: completedInterviews
    },
    regional: regions.map(region => ({
      name: region.name,
      target: region.target_interviews,
      completed: region.completed_interviews,
      completion: Math.round((region.completed_interviews / region.target_interviews) * 100)
    }))
  };
}

async function generateDetailedReport(research: any, interviews: any[], regions: any[]) {
  const summary = await generateSummaryReport(research, interviews, regions);
  
  // Detailed analysis by question
  const questionAnalysis: Record<string, any> = {};
  const questions = research.questions || [];

  questions.forEach((question: any) => {
    const answers: Record<string, number> = {};
    interviews.forEach(interview => {
      const answer = interview.answers?.[question.id];
      if (answer) {
        answers[answer] = (answers[answer] || 0) + 1;
      }
    });

    questionAnalysis[question.id] = {
      question: question.text,
      type: question.type,
      responses: answers,
      totalResponses: Object.values(answers).reduce((sum: number, count: number) => sum + count, 0)
    };
  });

  return {
    ...summary,
    questionAnalysis,
    interviewDetails: interviews.map(interview => ({
      id: interview.id,
      researcher: interview.profiles?.full_name,
      region: interview.research_regions?.name,
      completedAt: interview.completed_at,
      duration: interview.duration_minutes,
      gpsCoordinates: interview.gps_coordinates
    }))
  };
}

async function generateDemographicReport(interviews: any[]) {
  const demographics = {
    age: {} as Record<string, number>,
    gender: {} as Record<string, number>,
    education: {} as Record<string, number>,
    income: {} as Record<string, number>
  };

  interviews.forEach(interview => {
    const demo = interview.demographic_data || {};
    
    Object.keys(demographics).forEach(key => {
      const value = demo[key];
      if (value) {
        demographics[key as keyof typeof demographics][value] = 
          (demographics[key as keyof typeof demographics][value] || 0) + 1;
      }
    });
  });

  // Convert to percentages
  const demographicPercentages: any = {};
  Object.entries(demographics).forEach(([category, data]) => {
    const total = Object.values(data).reduce((sum, count) => sum + count, 0);
    demographicPercentages[category] = {};
    Object.entries(data).forEach(([value, count]) => {
      demographicPercentages[category][value] = (count / total) * 100;
    });
  });

  return {
    demographics: demographicPercentages,
    totalResponses: interviews.length
  };
}

async function generateGeographicReport(interviews: any[], regions: any[]) {
  const regional: Record<string, any> = {};

  regions.forEach(region => {
    const regionInterviews = interviews.filter(
      interview => interview.research_regions?.name === region.name
    );

    regional[region.name] = {
      target: region.target_interviews,
      completed: regionInterviews.length,
      completion: (regionInterviews.length / region.target_interviews) * 100,
      coordinates: region.coordinates,
      interviews: regionInterviews.map(interview => ({
        gps: interview.gps_coordinates,
        completedAt: interview.completed_at
      }))
    };
  });

  return {
    regional,
    totalRegions: regions.length,
    gpsPoints: interviews.map(interview => interview.gps_coordinates).filter(Boolean)
  };
}

async function generatePDFReport(data: any, title: string): Promise<string> {
  // Simplified PDF generation - in production, use a proper PDF library
  console.log('📄 Generating PDF report...');
  return `/reports/${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
}

async function generateExcelReport(data: any, title: string): Promise<string> {
  // Simplified Excel generation - in production, use a proper Excel library
  console.log('📊 Generating Excel report...');
  return `/reports/${title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
}

async function generateCSVReport(data: any, title: string): Promise<string> {
  // Simplified CSV generation
  console.log('📋 Generating CSV report...');
  return `/reports/${title.replace(/\s+/g, '_')}_${Date.now()}.csv`;
}
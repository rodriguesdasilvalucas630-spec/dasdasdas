import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertCheck {
  type: 'quota_risk' | 'researcher_inactive' | 'deadline_approaching' | 'quality_issues';
  researchId?: string;
  userId?: string;
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

    console.log('🚨 Running automated alert checks...');

    const alertsSent = [];

    // Check 1: Quota Risk Alerts
    const quotaAlerts = await checkQuotaRisks(supabaseClient);
    alertsSent.push(...quotaAlerts);

    // Check 2: Inactive Researcher Alerts
    const inactivityAlerts = await checkResearcherInactivity(supabaseClient);
    alertsSent.push(...inactivityAlerts);

    // Check 3: Deadline Approaching Alerts
    const deadlineAlerts = await checkApproachingDeadlines(supabaseClient);
    alertsSent.push(...deadlineAlerts);

    // Check 4: Quality Issues Alerts
    const qualityAlerts = await checkQualityIssues(supabaseClient);
    alertsSent.push(...qualityAlerts);

    console.log(`✅ Alert check completed. ${alertsSent.length} alerts sent.`);

    return new Response(
      JSON.stringify({
        success: true,
        alertsSent: alertsSent.length,
        alerts: alertsSent
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in automated alerts:', error);
    
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

async function checkQuotaRisks(supabaseClient: any): Promise<any[]> {
  console.log('📊 Checking quota risks...');
  
  const alerts = [];

  // Get active researches with regions
  const { data: researches, error } = await supabaseClient
    .from('researches')
    .select(`
      id, name, deadline,
      research_regions(*)
    `)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching researches:', error);
    return alerts;
  }

  for (const research of researches || []) {
    for (const region of research.research_regions || []) {
      const completionRate = (region.completed_interviews / region.target_interviews) * 100;
      
      // Alert if completion rate is below 40% and deadline is approaching
      if (completionRate < 40) {
        const daysUntilDeadline = research.deadline ? 
          Math.ceil((new Date(research.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
          999;

        if (daysUntilDeadline <= 7) {
          // Send alert to admins
          const { data: admins } = await supabaseClient
            .from('profiles')
            .select('user_id, email')
            .eq('role', 'admin');

          for (const admin of admins || []) {
            await supabaseClient.functions.invoke('send-notification', {
              body: {
                userId: admin.user_id,
                researchId: research.id,
                type: 'quota_risk',
                title: 'Meta em Risco',
                message: `A região ${region.name} da pesquisa "${research.name}" está com apenas ${Math.round(completionRate)}% concluído e o prazo termina em ${daysUntilDeadline} dias.`,
                priority: 1,
                sendEmail: true,
                metadata: {
                  regionId: region.id,
                  completionRate,
                  daysUntilDeadline
                }
              }
            });
          }

          alerts.push({
            type: 'quota_risk',
            researchId: research.id,
            regionId: region.id,
            completionRate,
            daysUntilDeadline
          });
        }
      }
    }
  }

  return alerts;
}

async function checkResearcherInactivity(supabaseClient: any): Promise<any[]> {
  console.log('👥 Checking researcher inactivity...');
  
  const alerts = [];
  const inactivityThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago

  // Get researchers with active assignments but no recent activity
  const { data: inactiveResearchers, error } = await supabaseClient
    .from('profiles')
    .select(`
      user_id, full_name, email, last_activity,
      researcher_assignments!inner(research_id, researches(name))
    `)
    .eq('role', 'researcher')
    .eq('is_active', true)
    .eq('researcher_assignments.is_active', true)
    .lt('last_activity', inactivityThreshold.toISOString());

  if (error) {
    console.error('Error fetching inactive researchers:', error);
    return alerts;
  }

  for (const researcher of inactiveResearchers || []) {
    const hoursInactive = Math.floor(
      (Date.now() - new Date(researcher.last_activity).getTime()) / (1000 * 60 * 60)
    );

    if (hoursInactive >= 4) {
      // Send alert to admins
      const { data: admins } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('role', 'admin');

      for (const admin of admins || []) {
        await supabaseClient.functions.invoke('send-notification', {
          body: {
            userId: admin.user_id,
            type: 'researcher_inactive',
            title: 'Pesquisador Inativo',
            message: `${researcher.full_name} não registra atividade há ${hoursInactive} horas.`,
            priority: 2,
            sendEmail: hoursInactive >= 12, // Email only if 12+ hours
            metadata: {
              researcherId: researcher.user_id,
              hoursInactive,
              lastActivity: researcher.last_activity
            }
          }
        });
      }

      // Send reminder to researcher
      await supabaseClient.functions.invoke('send-notification', {
        body: {
          userId: researcher.user_id,
          type: 'activity_reminder',
          title: 'Lembrete de Atividade',
          message: 'Você tem entrevistas pendentes. Acesse o app para continuar sua coleta.',
          priority: 2,
          sendEmail: true
        }
      });

      alerts.push({
        type: 'researcher_inactive',
        researcherId: researcher.user_id,
        hoursInactive
      });
    }
  }

  return alerts;
}

async function checkApproachingDeadlines(supabaseClient: any): Promise<any[]> {
  console.log('⏰ Checking approaching deadlines...');
  
  const alerts = [];
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  // Get researches with deadlines approaching
  const { data: researches, error } = await supabaseClient
    .from('researches')
    .select('id, name, deadline, calculated_sample_size')
    .eq('status', 'active')
    .lte('deadline', threeDaysFromNow.toISOString());

  if (error) {
    console.error('Error fetching researches with deadlines:', error);
    return alerts;
  }

  for (const research of researches || []) {
    const daysUntilDeadline = Math.ceil(
      (new Date(research.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Get completion stats
    const { data: completionStats } = await supabaseClient
      .from('interviews')
      .select('id')
      .eq('research_id', research.id)
      .eq('status', 'completed');

    const completedInterviews = completionStats?.length || 0;
    const completionRate = (completedInterviews / research.calculated_sample_size) * 100;

    if (daysUntilDeadline <= 3 && completionRate < 80) {
      // Send urgent alert to admins
      const { data: admins } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('role', 'admin');

      for (const admin of admins || []) {
        await supabaseClient.functions.invoke('send-notification', {
          body: {
            userId: admin.user_id,
            researchId: research.id,
            type: 'deadline_approaching',
            title: 'Prazo Urgente',
            message: `A pesquisa "${research.name}" termina em ${daysUntilDeadline} dias e está ${Math.round(completionRate)}% concluída.`,
            priority: 1,
            sendEmail: true,
            metadata: {
              daysUntilDeadline,
              completionRate,
              completedInterviews,
              targetInterviews: research.calculated_sample_size
            }
          }
        });
      }

      alerts.push({
        type: 'deadline_approaching',
        researchId: research.id,
        daysUntilDeadline,
        completionRate
      });
    }
  }

  return alerts;
}

async function checkQualityIssues(supabaseClient: any): Promise<any[]> {
  console.log('🔍 Checking quality issues...');
  
  const alerts = [];
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get interviews with low quality scores from last 24 hours
  const { data: lowQualityInterviews, error } = await supabaseClient
    .from('interviews')
    .select(`
      id, quality_score, researcher_id,
      profiles(full_name),
      researches(id, name)
    `)
    .eq('status', 'completed')
    .gte('completed_at', last24Hours.toISOString())
    .lt('quality_score', 0.7);

  if (error) {
    console.error('Error fetching low quality interviews:', error);
    return alerts;
  }

  // Group by researcher
  const researcherIssues: Record<string, any[]> = {};
  for (const interview of lowQualityInterviews || []) {
    if (!researcherIssues[interview.researcher_id]) {
      researcherIssues[interview.researcher_id] = [];
    }
    researcherIssues[interview.researcher_id].push(interview);
  }

  // Send alerts for researchers with multiple quality issues
  for (const [researcherId, interviews] of Object.entries(researcherIssues)) {
    if (interviews.length >= 3) {
      const researcher = interviews[0].profiles?.full_name;
      
      // Alert admins
      const { data: admins } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('role', 'admin');

      for (const admin of admins || []) {
        await supabaseClient.functions.invoke('send-notification', {
          body: {
            userId: admin.user_id,
            type: 'quality_issues',
            title: 'Problemas de Qualidade',
            message: `${researcher} teve ${interviews.length} entrevistas com baixa qualidade nas últimas 24 horas.`,
            priority: 2,
            sendEmail: true,
            metadata: {
              researcherId,
              lowQualityCount: interviews.length,
              avgQualityScore: interviews.reduce((sum, i) => sum + i.quality_score, 0) / interviews.length
            }
          }
        });
      }

      // Send feedback to researcher
      await supabaseClient.functions.invoke('send-notification', {
        body: {
          userId: researcherId,
          type: 'quality_feedback',
          title: 'Melhore a Qualidade das Entrevistas',
          message: 'Algumas de suas entrevistas recentes tiveram baixa qualidade. Verifique se está seguindo todos os procedimentos corretamente.',
          priority: 2,
          sendEmail: true
        }
      });

      alerts.push({
        type: 'quality_issues',
        researcherId,
        lowQualityCount: interviews.length
      });
    }
  }

  return alerts;
}
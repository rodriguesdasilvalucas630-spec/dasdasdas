import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  researcherId: string;
  interviews: Array<{
    id?: string;
    research_id: string;
    region_id: string;
    answers: Record<string, any>;
    demographic_data: Record<string, any>;
    gps_coordinates: {lat: number, lng: number, accuracy?: number};
    started_at: string;
    completed_at: string;
    duration_minutes: number;
    device_info?: Record<string, any>;
    app_version?: string;
  }>;
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

    const { researcherId, interviews }: SyncRequest = await req.json();

    console.log(`🔄 Syncing ${interviews.length} interviews for researcher ${researcherId}`);

    const syncResults = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each interview
    for (const interview of interviews) {
      try {
        // Validate GPS coordinates
        if (!isValidGPSCoordinates(interview.gps_coordinates)) {
          throw new Error('Coordenadas GPS inválidas');
        }

        // Validate region assignment
        const isValidAssignment = await validateRegionAssignment(
          supabaseClient, 
          researcherId, 
          interview.region_id
        );

        if (!isValidAssignment) {
          throw new Error('Pesquisador não autorizado para esta região');
        }

        // Insert or update interview
        const interviewData = {
          research_id: interview.research_id,
          region_id: interview.region_id,
          researcher_id: researcherId,
          status: 'completed',
          gps_coordinates: interview.gps_coordinates,
          location_verified: true,
          answers: interview.answers,
          demographic_data: interview.demographic_data,
          started_at: interview.started_at,
          completed_at: interview.completed_at,
          duration_minutes: interview.duration_minutes,
          is_valid: true,
          quality_score: calculateQualityScore(interview),
          is_synced: true,
          device_info: interview.device_info || {},
          app_version: interview.app_version
        };

        let result;
        if (interview.id) {
          // Update existing interview
          result = await supabaseClient
            .from('interviews')
            .update(interviewData)
            .eq('id', interview.id)
            .eq('researcher_id', researcherId) // Security check
            .select()
            .single();
        } else {
          // Insert new interview
          result = await supabaseClient
            .from('interviews')
            .insert(interviewData)
            .select()
            .single();
        }

        if (result.error) {
          throw result.error;
        }

        console.log(`✅ Interview synced: ${result.data.id}`);
        syncResults.success++;

        // Log activity
        await supabaseClient
          .from('activity_logs')
          .insert({
            user_id: researcherId,
            research_id: interview.research_id,
            action: 'interview_synced',
            entity_type: 'interview',
            entity_id: result.data.id,
            metadata: {
              sync_timestamp: new Date().toISOString(),
              duration_minutes: interview.duration_minutes,
              gps_accuracy: interview.gps_coordinates.accuracy
            }
          });

        // Check for quota completion alerts
        await checkQuotaAlerts(supabaseClient, interview.region_id);

      } catch (error) {
        console.error(`❌ Error syncing interview:`, error);
        syncResults.failed++;
        syncResults.errors.push(error.message);
      }
    }

    // Update researcher's last activity and efficiency
    await updateResearcherStats(supabaseClient, researcherId, syncResults.success);

    // Send notification if there were issues
    if (syncResults.failed > 0) {
      await supabaseClient.functions.invoke('send-notification', {
        body: {
          userId: researcherId,
          type: 'sync_issues',
          title: 'Problemas na Sincronização',
          message: `${syncResults.failed} entrevista(s) falharam na sincronização. Verifique os dados e tente novamente.`,
          priority: 2,
          metadata: { errors: syncResults.errors }
        }
      });
    }

    console.log(`🔄 Sync completed: ${syncResults.success} success, ${syncResults.failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        syncResults,
        message: `${syncResults.success} entrevistas sincronizadas com sucesso`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in sync-interviews function:', error);
    
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

function isValidGPSCoordinates(coords: {lat: number, lng: number}): boolean {
  return (
    coords &&
    typeof coords.lat === 'number' &&
    typeof coords.lng === 'number' &&
    coords.lat >= -90 && coords.lat <= 90 &&
    coords.lng >= -180 && coords.lng <= 180
  );
}

async function validateRegionAssignment(
  supabaseClient: any, 
  researcherId: string, 
  regionId: string
): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('researcher_assignments')
    .select('id')
    .eq('researcher_id', researcherId)
    .eq('region_id', regionId)
    .eq('is_active', true)
    .single();

  return !error && !!data;
}

function calculateQualityScore(interview: any): number {
  let score = 1.0;

  // Check GPS accuracy
  if (interview.gps_coordinates?.accuracy > 100) {
    score -= 0.1; // Deduct for poor GPS accuracy
  }

  // Check interview duration (too fast might indicate rushed)
  if (interview.duration_minutes < 5) {
    score -= 0.2;
  }

  // Check for complete answers
  const totalQuestions = Object.keys(interview.answers).length;
  const answeredQuestions = Object.values(interview.answers).filter(
    answer => answer !== null && answer !== undefined && answer !== ''
  ).length;

  const completionRate = answeredQuestions / totalQuestions;
  if (completionRate < 0.8) {
    score -= 0.3;
  }

  return Math.max(0.1, Math.min(1.0, score)); // Keep between 0.1 and 1.0
}

async function updateResearcherStats(
  supabaseClient: any, 
  researcherId: string, 
  newInterviews: number
) {
  // Update profile stats
  await supabaseClient
    .from('profiles')
    .update({
      last_activity: new Date().toISOString(),
      total_interviews_completed: supabaseClient.rpc('increment', { 
        table_name: 'profiles', 
        column_name: 'total_interviews_completed', 
        x: newInterviews 
      })
    })
    .eq('user_id', researcherId);

  console.log(`📊 Updated stats for researcher ${researcherId}: +${newInterviews} interviews`);
}

async function checkQuotaAlerts(supabaseClient: any, regionId: string) {
  // Get region data
  const { data: region, error } = await supabaseClient
    .from('research_regions')
    .select('*, researches(name)')
    .eq('id', regionId)
    .single();

  if (error || !region) return;

  const completionRate = (region.completed_interviews / region.target_interviews) * 100;

  // Check if region is completed
  if (region.completed_interviews >= region.target_interviews && region.status !== 'completed') {
    // Update region status
    await supabaseClient
      .from('research_regions')
      .update({ status: 'completed' })
      .eq('id', regionId);

    // Send completion notification to admins
    const { data: admins } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('role', 'admin');

    for (const admin of admins || []) {
      await supabaseClient.functions.invoke('send-notification', {
        body: {
          userId: admin.user_id,
          type: 'region_completed',
          title: 'Região Concluída!',
          message: `A região ${region.name} da pesquisa ${region.researches?.name} atingiu sua meta de entrevistas.`,
          priority: 1,
          sendEmail: true
        }
      });
    }

    console.log(`🎉 Region ${region.name} completed!`);
  }
}
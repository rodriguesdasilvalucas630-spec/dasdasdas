import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  userId?: string;
  researchId?: string;
  type: string;
  title: string;
  message: string;
  priority?: number;
  actionUrl?: string;
  metadata?: Record<string, any>;
  sendEmail?: boolean;
  sendPush?: boolean;
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

    const notification: NotificationRequest = await req.json();

    console.log(`🔔 Creating notification: ${notification.type} for user ${notification.userId}`);

    // Save notification to database
    const { data: savedNotification, error: saveError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: notification.userId,
        research_id: notification.researchId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority || 3,
        action_url: notification.actionUrl,
        metadata: notification.metadata || {},
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving notification:', saveError);
      throw new Error('Erro ao salvar notificação');
    }

    console.log('✅ Notification saved:', savedNotification.id);

    // Send email if requested
    if (notification.sendEmail && notification.userId) {
      try {
        await sendEmailNotification(supabaseClient, notification, savedNotification.id);
      } catch (emailError) {
        console.error('⚠️ Error sending email:', emailError);
        // Don't throw - email failure shouldn't fail the whole operation
      }
    }

    // Send push notification if requested
    if (notification.sendPush && notification.userId) {
      try {
        await sendPushNotification(notification);
      } catch (pushError) {
        console.error('⚠️ Error sending push notification:', pushError);
        // Don't throw - push failure shouldn't fail the whole operation
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationId: savedNotification.id,
        message: 'Notificação enviada com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    
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

async function sendEmailNotification(
  supabaseClient: any, 
  notification: NotificationRequest, 
  notificationId: string
) {
  // Get user email
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('email, full_name')
    .eq('user_id', notification.userId)
    .single();

  if (profileError || !profile) {
    throw new Error('Usuário não encontrado');
  }

  console.log(`📧 Sending email notification to ${profile.email}`);

  // Determine email template based on notification type
  let emailTemplate = getEmailTemplate(notification, profile.full_name);

  // Send email via Resend API
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Vote Scout Pro <noreply@votescoutpro.com>',
      to: [profile.email],
      subject: `[Vote Scout Pro] ${notification.title}`,
      html: emailTemplate
    }),
  });

  if (!emailResponse.ok) {
    const emailError = await emailResponse.text();
    throw new Error(`Failed to send email: ${emailError}`);
  }

  const emailResult = await emailResponse.json();
  console.log('✅ Email sent successfully:', emailResult.id);

  // Update notification with email status
  await supabaseClient
    .from('notifications')
    .update({ is_email_sent: true })
    .eq('id', notificationId);

  return emailResult.id;
}

async function sendPushNotification(notification: NotificationRequest) {
  console.log(`📱 Sending push notification: ${notification.title}`);
  
  // In a real implementation, you would use a service like FCM or OneSignal
  // For now, we'll just log the push notification
  console.log('🔔 Push notification would be sent:', {
    title: notification.title,
    message: notification.message,
    userId: notification.userId
  });

  return true;
}

function getEmailTemplate(notification: NotificationRequest, userName: string): string {
  const baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${notification.title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Vote Scout Pro</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">${notification.title}</h2>
          
          <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
            Olá ${userName},
          </p>
          
          <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
            ${notification.message}
          </p>
          
          ${notification.actionUrl ? `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${notification.actionUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Ver Detalhes
              </a>
            </div>
          ` : ''}
          
          <p style="color: #6b7280; margin: 20px 0 0 0; font-size: 14px; line-height: 1.5;">
            Esta é uma notificação automática do sistema Vote Scout Pro.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0; font-size: 12px;">
            © 2024 Vote Scout Pro - Sistema Profissional de Pesquisas Eleitorais
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return baseTemplate;
}
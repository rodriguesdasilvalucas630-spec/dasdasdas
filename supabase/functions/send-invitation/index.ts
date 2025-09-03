import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailInviteRequest {
  email: string;
  fullName: string;
  role: 'admin' | 'researcher';
  invitedBy: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, fullName, role, invitedBy }: EmailInviteRequest = await req.json();

    console.log(`📧 Sending invitation to ${email} as ${role}`);

    // Create user via admin API
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
        invited_by: invitedBy
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      throw createError;
    }

    console.log('✅ User created successfully:', newUser.user?.id);

    // Update user role if admin
    if (role === 'admin') {
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: 'admin',
          granted_by: invitedBy
        });

      if (roleError) {
        console.error('⚠️ Error setting admin role:', roleError);
      }

      // Update profile role
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', newUser.user.id);

      if (profileError) {
        console.error('⚠️ Error updating profile role:', profileError);
      }
    }

    // Generate invitation link
    const { data: resetData, error: resetError } = await supabaseClient.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL')}/auth/callback`
      }
    });

    if (resetError) {
      console.error('❌ Error generating invite link:', resetError);
      throw resetError;
    }

    console.log('🔗 Invitation link generated');

    // Send email via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vote Scout Pro <noreply@votescoutpro.com>',
        to: [email],
        subject: `Convite para Vote Scout Pro - ${role === 'admin' ? 'Administrador' : 'Pesquisador'}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Convite Vote Scout Pro</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Vote Scout Pro</h1>
                <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Sistema Profissional de Pesquisas Eleitorais</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">Você foi convidado!</h2>
                
                <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
                  Olá <strong>${fullName}</strong>,
                </p>
                
                <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
                  Você foi convidado para participar da plataforma <strong>Vote Scout Pro</strong> como 
                  <span style="color: #3b82f6; font-weight: 600;">${role === 'admin' ? 'Administrador' : 'Pesquisador de Campo'}</span>.
                </p>
                
                <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 4px;">
                  <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 18px;">Como ${role === 'admin' ? 'Administrador' : 'Pesquisador'}, você poderá:</h3>
                  <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.6;">
                    ${role === 'admin' ? `
                      <li>Criar e gerenciar pesquisas eleitorais</li>
                      <li>Distribuir automaticamente tarefas para pesquisadores</li>
                      <li>Monitorar progresso em tempo real</li>
                      <li>Gerar relatórios estatísticos avançados</li>
                      <li>Gerenciar equipe de pesquisadores</li>
                    ` : `
                      <li>Aplicar entrevistas com GPS obrigatório</li>
                      <li>Trabalhar offline com sincronização automática</li>
                      <li>Receber tarefas distribuídas automaticamente</li>
                      <li>Acompanhar seu progresso em tempo real</li>
                      <li>Contribuir para pesquisas de alta qualidade</li>
                    `}
                  </ul>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetData.properties?.action_link}" 
                     style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    Aceitar Convite e Criar Senha
                  </a>
                </div>
                
                <p style="color: #6b7280; margin: 24px 0 0 0; font-size: 14px; line-height: 1.5;">
                  Este link expira em 24 horas. Se você não solicitou este convite, ignore este email.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0; font-size: 14px;">
                  © 2024 Vote Scout Pro - Sistema Profissional de Pesquisas Eleitorais
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error('❌ Error sending email:', emailError);
      throw new Error(`Failed to send email: ${emailError}`);
    }

    const emailResult = await emailResponse.json();
    console.log('✅ Email sent successfully:', emailResult.id);

    // Log the invitation in activity logs
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: invitedBy,
        action: 'user_invited',
        entity_type: 'user',
        entity_id: newUser.user.id,
        new_values: {
          email,
          fullName,
          role,
          emailId: emailResult.id
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUser.user.id,
        emailId: emailResult.id,
        message: `Convite enviado com sucesso para ${email}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in send-invitation function:', error);
    
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
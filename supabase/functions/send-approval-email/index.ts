import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalEmailData {
  restaurantName: string;
  ownerName: string;
  email: string;
  approvedAt: string;
  blockchainCertified?: boolean;
  blockchainHash?: string;
  blockchainTxHash?: string;
  blockchainNetwork?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email');
      return new Response(
        JSON.stringify({ 
          success: false, 
          skipped: true,
          message: 'Email service not configured' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: ApprovalEmailData = await req.json();
    console.log('Sending approval email to:', data.email);

    const blockchainSection = data.blockchainCertified ? `
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 20px; margin: 20px 0; color: white;">
        <h3 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
          ✓ Blockchain Verified
        </h3>
        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">
          Your restaurant has been certified on the blockchain for transparency and trust.
        </p>
        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; margin-top: 12px;">
          <p style="margin: 0 0 4px 0; font-size: 12px; opacity: 0.8;">Network</p>
          <p style="margin: 0 0 12px 0; font-weight: 600;">${data.blockchainNetwork || 'lovable-testnet'}</p>
          
          <p style="margin: 0 0 4px 0; font-size: 12px; opacity: 0.8;">Certification Hash</p>
          <p style="margin: 0 0 12px 0; font-family: monospace; font-size: 11px; word-break: break-all;">${data.blockchainHash || 'N/A'}</p>
          
          <p style="margin: 0 0 4px 0; font-size: 12px; opacity: 0.8;">Transaction Hash</p>
          <p style="margin: 0; font-family: monospace; font-size: 11px; word-break: break-all;">${data.blockchainTxHash || 'N/A'}</p>
        </div>
      </div>
    ` : `
      <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin: 20px 0; color: #92400e;">
        <p style="margin: 0; font-size: 14px;">
          ⚠️ Blockchain certification is pending. Your restaurant is approved but will receive on-chain verification shortly.
        </p>
      </div>
    `;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Your Restaurant Has Been Approved</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Dear ${data.ownerName},
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                We're thrilled to inform you that <strong>${data.restaurantName}</strong> has been approved to join the Noil healthy restaurant network!
              </p>
              
              <div style="background: #f0fdfa; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; color: #0d9488; font-weight: 600;">Approval Details</p>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong>Restaurant:</strong> ${data.restaurantName}<br>
                  <strong>Approved On:</strong> ${new Date(data.approvedAt).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              ${blockchainSection}
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 24px 0 16px 0;">
                You can now access your restaurant dashboard to manage your listing, update menu items, and track customer engagement.
              </p>
              
              <a href="https://noil.app/restaurant-dashboard" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0;">
                Go to Dashboard →
              </a>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                If you have any questions, feel free to reach out to our support team.
              </p>
              
              <p style="color: #374151; font-size: 14px; margin: 24px 0 0 0;">
                Welcome to the Noil family!<br>
                <strong>The Noil Team</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Noil - Track. Cook. Thrive.<br>
                This email was sent regarding your restaurant application.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Noil <noreply@resend.dev>',
        to: [data.email],
        subject: `🎉 ${data.restaurantName} - Application Approved!`,
        html: emailHtml,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return new Response(
        JSON.stringify({ success: false, error: result }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', result.id);

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

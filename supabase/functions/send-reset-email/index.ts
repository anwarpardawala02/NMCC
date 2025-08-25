// Follow Deno and Oak pattern for Supabase Edge Functions
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno runtime specific code
import { corsHeaders } from "../_shared/cors.ts";

// Use Gmail SMTP for sending emails
// @ts-ignore - Deno runtime specific code
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";
// @ts-ignore - Deno runtime specific code
const GMAIL_USER = Deno.env.get("GMAIL_USER");
const GMAIL_PASS = Deno.env.get("GMAIL_PASS");
if (!GMAIL_USER) {
  console.error("GMAIL_USER environment variable is not set!");
}
if (!GMAIL_PASS) {
  console.error("GMAIL_PASS environment variable is not set!");
}

console.log("Password reset email function started");

serve(async (req) => {
  console.log("Request received, method:", req.method);
  
  // Add CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Log headers for debugging (excluding sensitive info)
  console.log("Request headers:", [...req.headers.entries()]
    .filter(([key]) => !key.toLowerCase().includes('authorization'))
    .map(([key, value]) => `${key}: ${value}`)
  );

  // No environment/auth logic: always allow

  try {
    const body = await req.text();
    console.log("Request body:", body);
    
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    const { email, token } = data;
    console.log(`Password reset requested for email: ${email}`);

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: "Missing email or token" }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    const resetUrl = `https://northoltmanorcc.netlify.app/reset-password?token=${token}`;

    // HTML template for the email
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a3a5c; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .button { display: inline-block; background-color: #7ed957; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Northolt Manor Cricket Club</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p><a class="button" href="${resetUrl}">Reset My Password</a></p>
            <p>If you did not request a password reset, please ignore this email or contact us if you have concerns.</p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Northolt Manor Cricket Club. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (!GMAIL_USER || !GMAIL_PASS) {
      console.error("Cannot send email: GMAIL_USER or GMAIL_PASS is not set");
      return new Response(
        JSON.stringify({ error: "Email service configuration error" }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    console.log("Sending email via Gmail SMTP");

    const client = new SmtpClient();
    try {
      await client.connectTLS({
        hostname: "smtp.gmail.com",
        port: 465,
        username: GMAIL_USER,
        password: GMAIL_PASS,
      });

      await client.send({
        from: GMAIL_USER,
        to: email,
        subject: "Password Reset Request - Northolt Manor Cricket Club",
        content: "Please use an HTML compatible email client to view this message.",
        html: htmlTemplate,
      });
      await client.close();
    } catch (smtpError) {
      console.error("SMTP send error:", smtpError);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: smtpError.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }), 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error("Error in send-reset-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});

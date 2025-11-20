import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    const error = 'RESEND_API_KEY not set in environment variables';
    console.error('❌ Email Service Error:', error);
    console.error('💡 To fix: Add RESEND_API_KEY to your .env.local file');
    console.error('   Get your API key from: https://resend.com/api-keys');
    return { success: false, error };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'NEK <onboarding@resend.dev>';
  
  try {
    console.log('📧 Attempting to send email:', { to, subject, from: fromEmail });
    
    const response = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });
    
    // Check if Resend returned an error in the response
    if (response.error) {
      console.error('❌ Resend API returned an error:', response.error);
      const errorMessage = response.error.message || 'Unknown error from Resend';
      
      // Provide helpful error messages
      if (errorMessage.includes('only send testing emails')) {
        console.error('💡 Resend Limitation: You can only send to your own email (amantoppo1739@gmail.com) with test domain');
        console.error('   To send to any email, verify a domain at: https://resend.com/domains');
      } else if (errorMessage.includes('API key')) {
        console.error('💡 Check that your RESEND_API_KEY is correct');
      } else if (errorMessage.includes('domain') || errorMessage.includes('from')) {
        console.error('💡 For development, use: RESEND_FROM_EMAIL="NEK <onboarding@resend.dev>"');
        console.error('   For production, verify your domain in Resend dashboard');
      }
      
      return { success: false, error: errorMessage, data: response };
    }
    
    console.log('✅ Email sent successfully:', response);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      response: error?.response,
    });
    
    // Provide helpful error messages
    if (error?.message?.includes('API key')) {
      console.error('💡 Check that your RESEND_API_KEY is correct');
    }
    if (error?.message?.includes('domain') || error?.message?.includes('from')) {
      console.error('💡 For development, use: RESEND_FROM_EMAIL="NEK <onboarding@resend.dev>"');
      console.error('   For production, verify your domain in Resend dashboard');
    }
    
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  total: number
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
          }
          .header { 
            background: #000; 
            color: #fff; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .content { 
            padding: 30px 20px; 
          }
          .order-details { 
            background: #f9f9f9; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px;
            border-left: 4px solid #000;
          }
          .order-details p {
            margin: 8px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
          }
          .footer {
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NEK</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0;">Order Confirmed!</h2>
            <p>Thank you for your purchase. Your order has been confirmed and we're preparing it for shipment.</p>
            <div class="order-details">
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Total:</strong> $${total.toFixed(2)}</p>
            </div>
            <p>We'll send you another email when your order ships with tracking information.</p>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/order-tracking/${orderNumber}" class="button">Track Your Order</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} NEK. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order Confirmation - ${orderNumber}`,
    html,
  });
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
          }
          .header { 
            background: #000; 
            color: #fff; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .content { 
            padding: 30px 20px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NEK</h1>
          </div>
          <div class="content">
            <h2>Welcome to NEK, ${firstName}!</h2>
            <p>Thank you for joining us. We're excited to have you as part of our community.</p>
            <p>Start exploring our exquisite collection of handcrafted jewelry pieces.</p>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/products" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 20px;">Shop Now</a>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to NEK',
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${
    process.env.NEXTAUTH_URL || 'http://localhost:3000'
  }/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Reset Your Password</h2>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - NEK',
    html,
  });
}


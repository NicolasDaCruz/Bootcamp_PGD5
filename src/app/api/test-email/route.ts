import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json();

    console.log('🧪 Testing email with Resend...');

    const { data, error } = await resend.emails.send({
      from: 'Sneaker Store <onboarding@resend.dev>',
      to: to || 'delivered@resend.dev',
      subject: subject || 'Test Email from Sneaker Store',
      html: html || '<h1>Hello!</h1><p>This is a test email from your Sneaker Store.</p>',
    });

    if (error) {
      console.error('❌ Email test failed:', error);
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    console.log('✅ Email test successful:', data?.id);
    return NextResponse.json({ success: true, emailId: data?.id });

  } catch (error) {
    console.error('💥 Email test error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
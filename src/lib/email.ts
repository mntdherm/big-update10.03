import type { Appointment, User, Vendor } from '../types/database';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { getActionBaseUrl } from './tokens';

// Production Mailgun API key - keep this secure
const MAILGUN_API_KEY = '4573175144a542dfd9c9ad28e304c01b-e298dd8e-b75a04bc';
const MAILGUN_DOMAIN = 'bilo.fi';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

async function sendEmail({ to, subject, html, from = 'Bilo <noreply@bilo.fi>' }: EmailOptions) {
  try {
    const response = await fetch(`https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        from,
        to,
        subject,
        html
      })
    });

    if (!response.ok) {
      throw new Error(`Mailgun API error: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Email templates
function getAppointmentConfirmationTemplate(appointment: Appointment, vendor: Vendor, serviceName: string) {
  const appointmentDate = appointment.date instanceof Date 
    ? appointment.date 
    : new Date(appointment.date.seconds * 1000);

  return `
    <h2>Varaus vahvistettu</h2>
    <p>Hei ${appointment.customerDetails.firstName},</p>
    <p>Varauksesi on vahvistettu:</p>
    <ul>
      <li>Palvelu: ${serviceName}</li>
      <li>Päivämäärä: ${format(appointmentDate, "d.M.yyyy 'klo' HH:mm", { locale: fi })}</li>
      <li>Yritys: ${vendor.businessName}</li>
      <li>Osoite: ${vendor.address}</li>
      <li>Hinta: ${appointment.totalPrice}€</li>
    </ul>
    <p>Voit tarkastella varausta kirjautumalla Bilo -palveluun: <a href="https://bilo.fi/customer/appointments">https://bilo.fi/customer/appointments</a></p>
  `;
}

function getAppointmentReminderTemplate(appointment: Appointment, vendor: Vendor, serviceName: string) {
  const appointmentDate = appointment.date instanceof Date 
    ? appointment.date 
    : new Date(appointment.date.seconds * 1000);

  return `
    <h2>Muistutus huomisesta varauksesta</h2>
    <p>Hei ${appointment.customerDetails.firstName},</p>
    <p>Muistathan huomisen varauksesi:</p>
    <ul>
      <li>Palvelu: ${serviceName}</li>
      <li>Päivämäärä: ${format(appointmentDate, "d.M.yyyy 'klo' HH:mm", { locale: fi })}</li>
      <li>Yritys: ${vendor.businessName}</li>
      <li>Osoite: ${vendor.address}</li>
    </ul>
    <p>Voit tarkastella varausta kirjautumalla Bilo -palveluun: <a href="https://bilo.fi/customer/appointments">https://bilo.fi/customer/appointments</a></p>
  `;
}

function getWelcomeEmailTemplate(user: User) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tervetuloa Biloon!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .logo { text-align: center; margin-bottom: 20px; }
        .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="logo">
        <h1>Bilo</h1>
      </div>
      
      <div class="card">
        <h2>Tervetuloa Biloon!</h2>
        <p>Hei ${user.firstName || 'käyttäjä'},</p>
        <p>Kiitos rekisteröitymisestäsi. Olemme antaneet sinulle 10 kolikkoa tervetuliaislahjana.</p>
        <p>Voit käyttää kolikoita alennuksiin varatessasi palveluita.</p>
        
        <div style="text-align: center;">
          <a href="https://bilo.fi/customer/appointments" class="button">Tutustu palveluihin</a>
        </div>
      </div>
      
      <div class="footer">
        <p>Tämä on automaattinen viesti, älä vastaa tähän viestiin.</p>
        <p>&copy; ${new Date().getFullYear()} Bilo. Kaikki oikeudet pidätetään.</p>
      </div>
    </body>
    </html>
  `;
}

// Authentication email templates
function getEmailVerificationTemplate(email: string, verificationLink: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vahvista sähköpostiosoitteesi</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .logo { text-align: center; margin-bottom: 20px; }
        .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="logo">
        <h1>Bilo</h1>
      </div>
      
      <div class="card">
        <h2>Vahvista sähköpostiosoitteesi</h2>
        <p>Hei,</p>
        <p>Kiitos rekisteröitymisestäsi. Vahvista sähköpostiosoitteesi klikkaamalla alla olevaa painiketta:</p>
        
        <div style="text-align: center;">
          <a href="${verificationLink}" class="button">Vahvista sähköpostiosoite</a>
        </div>
        
        <p>Jos et rekisteröitynyt Biloon, voit jättää tämän viestin huomiotta.</p>
        <p>Vahvistuslinkki on voimassa 24 tuntia.</p>
      </div>
      
      <div class="footer">
        <p>Tämä on automaattinen viesti, älä vastaa tähän viestiin.</p>
        <p>&copy; ${new Date().getFullYear()} Bilo. Kaikki oikeudet pidätetään.</p>
      </div>
    </body>
    </html>
  `;
}

function getPasswordResetTemplate(email: string, resetLink: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Salasanan palautus</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .logo { text-align: center; margin-bottom: 20px; }
        .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="logo">
        <h1>Bilo</h1>
      </div>
      
      <div class="card">
        <h2>Salasanan palautus</h2>
        <p>Hei,</p>
        <p>Olemme vastaanottaneet pyynnön palauttaa salasanasi. Voit asettaa uuden salasanan klikkaamalla alla olevaa painiketta:</p>
        
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">Palauta salasana</a>
        </div>
        
        <p>Jos et pyytänyt salasanan palautusta, voit jättää tämän viestin huomiotta.</p>
        <p>Palautuslinkki on voimassa 1 tunnin.</p>
      </div>
      
      <div class="footer">
        <p>Tämä on automaattinen viesti, älä vastaa tähän viestiin.</p>
        <p>&copy; ${new Date().getFullYear()} Bilo. Kaikki oikeudet pidätetään.</p>
      </div>
    </body>
    </html>
  `;
}

// Email sending functions
export async function sendAppointmentConfirmation(appointment: Appointment, vendor: Vendor) {
  try {
    const html = getAppointmentConfirmationTemplate(appointment, vendor, appointment.serviceName || 'Palvelu');
    return sendEmail({
      to: appointment.customerDetails.email,
      subject: 'Varauksesi on vahvistettu',
      html
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
}

export async function sendAppointmentReminder(appointment: Appointment, vendor: Vendor) {
  try {
    const html = getAppointmentReminderTemplate(appointment, vendor, appointment.serviceName || 'Palvelu');
    return sendEmail({
      to: appointment.customerDetails.email,
      subject: 'Muistutus huomisesta varauksesta',
      html
    });
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(user: User) {
  try {
    return sendEmail({
      to: user.email,
      subject: 'Tervetuloa Biloon',
      html: getWelcomeEmailTemplate(user)
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

export async function sendVendorNotification(vendor: Vendor, subject: string, message: string) {
  try {
    return sendEmail({
      to: vendor.email,
      subject,
      html: `<p>${message}</p>`
    });
  } catch (error) {
    console.error('Error sending vendor notification:', error);
    return false;
  }
}

// Authentication email functions
export async function sendVerificationEmail(email: string, token: string) {
  try {
    const verificationLink = `${getActionBaseUrl()}?mode=verifyEmail&oobCode=${token}`;
    const html = getEmailVerificationTemplate(email, verificationLink);
    
    return sendEmail({
      to: email,
      subject: 'Vahvista sähköpostiosoitteesi - Bilo',
      html
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const resetLink = `${getActionBaseUrl()}?mode=resetPassword&oobCode=${token}`;
    const html = getPasswordResetTemplate(email, resetLink);
    
    return sendEmail({
      to: email,
      subject: 'Salasanan palautus - Bilo',
      html
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

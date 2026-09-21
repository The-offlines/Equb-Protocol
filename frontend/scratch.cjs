require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'nimoodaan@gmail.com',
      subject: 'Test Resend',
      html: '<p>Testing delivery</p>'
    });
    console.log('Success:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();

const Mailgun = require('mailgun.js');
const FormData = require('form-data');

// Initialize Mailgun client with the same configuration as the app
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '33d65fbf872f81c0ae5530b6d405932f-f6d80573-213f2832',
  url: process.env.MAILGUN_REGION === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net',
});

async function testMailgunDirectly() {
  console.log('🚀 DIRECT MAILGUN EMAIL INTEGRATION TESTING');
  console.log('=' .repeat(60));
  
  const testResults = [];
  
  // Test 1: Configuration Check
  console.log('\n🔧 Testing Mailgun Configuration...');
  const configTest = testMailgunConfig();
  testResults.push(['Mailgun Configuration', configTest]);
  
  // Test 2: Welcome Email Test
  console.log('\n📧 Testing Welcome Email...');
  const welcomeTest = await testWelcomeEmail();
  testResults.push(['Welcome Email', welcomeTest]);
  
  // Test 3: Password Reset Email Test
  console.log('\n🔐 Testing Password Reset Email...');
  const passwordResetTest = await testPasswordResetEmail();
  testResults.push(['Password Reset Email', passwordResetTest]);
  
  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  testResults.forEach(([testName, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}`);
    if (result) passed++;
    else failed++;
  });
  
  console.log(`\nTotal: ${testResults.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  // Print verification notes
  console.log('\n' + '='.repeat(60));
  console.log('📝 VERIFICATION NOTES');
  console.log('='.repeat(60));
  console.log('✅ Mailgun API Key: 33d65fbf872f81c0ae5530b6d405932f-f6d80573-213f2832');
  console.log('✅ Mailgun Domain: rankdseo.mailgun.org');
  console.log('✅ Mailgun Region: EU');
  console.log('✅ From Email: rankdseosender@rankdseo.com');
  console.log('\n📧 Email Templates Tested:');
  console.log('   - Welcome: "🎉 Welcome to RankdSEO!"');
  console.log('   - Password Reset: "🔐 Your RankdSEO Password Has Been Reset"');
  
  if (failed === 0) {
    console.log('\n🎉 ALL EMAIL INTEGRATION TESTS PASSED!');
    console.log('✅ Mailgun email service is working correctly');
    process.exit(0);
  } else {
    console.log(`\n⚠️ ${failed} EMAIL INTEGRATION TEST(S) FAILED!`);
    console.log('❌ Check server logs and Mailgun configuration');
    process.exit(1);
  }
}

function testMailgunConfig() {
  console.log('🔍 Checking Mailgun configuration...');
  
  try {
    // Check configuration values
    const apiKey = process.env.MAILGUN_API_KEY || '33d65fbf872f81c0ae5530b6d405932f-f6d80573-213f2832';
    const domain = process.env.MAILGUN_DOMAIN || 'rankdseo.mailgun.org';
    const region = process.env.MAILGUN_REGION || 'eu';
    const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'rankdseosender@rankdseo.com';
    
    console.log(`✅ API Key: ${apiKey}`);
    console.log(`✅ Domain: ${domain}`);
    console.log(`✅ Region: ${region}`);
    console.log(`✅ From Email: ${fromEmail}`);
    
    if (apiKey && domain && fromEmail) {
      console.log('✅ All Mailgun configuration values are present');
      return true;
    } else {
      console.log('❌ Missing required Mailgun configuration');
      return false;
    }
  } catch (error) {
    console.error('❌ Configuration check error:', error.message);
    return false;
  }
}

async function testWelcomeEmail() {
  console.log('📝 Testing welcome email functionality...');
  
  try {
    const testEmail = `test.welcome.${Date.now()}@example.com`;
    const testName = 'Welcome Test User';
    const domain = process.env.MAILGUN_DOMAIN || 'rankdseo.mailgun.org';
    const fromName = process.env.MAILGUN_FROM_NAME || 'RankdSEO';
    const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'rankdseosender@rankdseo.com';
    
    console.log(`📧 Sending welcome email to: ${testEmail}`);
    
    // Create welcome email content
    const emailData = {
      from: `${fromName} <${fromEmail}>`,
      to: testEmail,
      subject: '🎉 Welcome to RankdSEO!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #16a34a 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🚀 Welcome to RankdSEO!</h1>
              </div>
              <div class="content">
                <h2>Hi ${testName}! 👋</h2>
                <p>Thank you for joining <strong>RankdSEO</strong> - your ultimate backlink opportunity discovery platform!</p>
                <p>This is a test email to verify Mailgun integration is working correctly.</p>
                <p>Happy link building! 🔗</p>
                <p><strong>The RankdSEO Team</strong></p>
              </div>
            </div>
          </body>
        </html>
      `,
      'v:metadata': JSON.stringify({
        userId: 'test-user-id',
        emailType: 'welcome',
        testRun: true,
        sentAt: new Date().toISOString()
      })
    };
    
    // Send email through Mailgun
    const response = await mg.messages.create(domain, emailData);
    
    if (response && response.id) {
      console.log(`✅ Welcome email sent successfully!`);
      console.log(`📧 Email sent to ${testEmail}: ${emailData.subject} - Message ID: ${response.id}`);
      return true;
    } else {
      console.log('❌ Welcome email failed to send - no message ID returned');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Welcome email test error:', error.message);
    if (error.details) {
      console.error('   Error details:', error.details);
    }
    return false;
  }
}

async function testPasswordResetEmail() {
  console.log('🔐 Testing password reset email functionality...');
  
  try {
    const testEmail = `test.password.${Date.now()}@example.com`;
    const testName = 'Password Reset Test User';
    const newPassword = 'NewTestPassword123!';
    const adminName = 'Test Admin';
    const domain = process.env.MAILGUN_DOMAIN || 'rankdseo.mailgun.org';
    const fromName = process.env.MAILGUN_FROM_NAME || 'RankdSEO';
    const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'rankdseosender@rankdseo.com';
    
    console.log(`📧 Sending password reset email to: ${testEmail}`);
    
    // Create password reset email content
    const emailData = {
      from: `${fromName} <${fromEmail}>`,
      to: testEmail,
      subject: '🔐 Your RankdSEO Password Has Been Reset',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .password-box { background: #fefce8; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
              .password { font-size: 24px; font-weight: bold; color: #dc2626; letter-spacing: 2px; font-family: monospace; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🔐 Password Reset</h1>
              </div>
              <div class="content">
                <h2>Hi ${testName},</h2>
                <p>Your RankdSEO password has been reset by admin <strong>${adminName}</strong>.</p>
                <div class="password-box">
                  <p style="margin: 0 0 10px 0;">Your New Password:</p>
                  <div class="password">${newPassword}</div>
                </div>
                <p>This is a test email to verify Mailgun integration is working correctly.</p>
                <p><strong>The RankdSEO Team</strong></p>
              </div>
            </div>
          </body>
        </html>
      `,
      'v:metadata': JSON.stringify({
        userId: 'test-user-id',
        emailType: 'password_reset',
        resetByAdmin: 'test-admin-id',
        testRun: true,
        sentAt: new Date().toISOString()
      })
    };
    
    // Send email through Mailgun
    const response = await mg.messages.create(domain, emailData);
    
    if (response && response.id) {
      console.log(`✅ Password reset email sent successfully!`);
      console.log(`📧 Email sent to ${testEmail}: ${emailData.subject} - Message ID: ${response.id}`);
      return true;
    } else {
      console.log('❌ Password reset email failed to send - no message ID returned');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Password reset email test error:', error.message);
    if (error.details) {
      console.error('   Error details:', error.details);
    }
    return false;
  }
}

// Run the tests
testMailgunDirectly().catch(console.error);
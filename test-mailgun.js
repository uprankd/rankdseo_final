// Test Mailgun Integration
const { sendEmail, emailTemplates } = require('./lib/mailgun');

async function testEmailIntegration() {
  console.log('🧪 Testing Mailgun Integration...\n');
  
  try {
    // Test welcome email
    console.log('📧 Sending test welcome email...');
    const welcomeEmail = emailTemplates.welcome('Test User', 'test@example.com');
    
    const result = await sendEmail({
      to: 'admin@rankseo.com', // Send to admin email for testing
      subject: welcomeEmail.subject,
      html: welcomeEmail.html,
      metadata: {
        userId: 'test-user-id',
        emailType: 'welcome',
        test: true,
      },
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', result.messageId);
    console.log('\n🎉 Mailgun integration is working!');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    throw error;
  }
}

testEmailIntegration()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });

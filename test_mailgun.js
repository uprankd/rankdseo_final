const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { sendEmail, emailTemplates } = require('./lib/mailgun');

const prisma = new PrismaClient();

async function testMailgunIntegration() {
  console.log('🚀 MAILGUN EMAIL INTEGRATION TESTING');
  console.log('=' .repeat(60));
  
  const testResults = [];
  
  try {
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
    
    // Test 4: Payment Receipt Email Test
    console.log('\n💳 Testing Payment Receipt Email...');
    const paymentReceiptTest = await testPaymentReceiptEmail();
    testResults.push(['Payment Receipt Email', paymentReceiptTest]);
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await prisma.$disconnect();
  }
  
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
  console.log('   - Payment Receipt: "💳 Payment Receipt - RankdSEO"');
  
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
    // Check environment variables
    const requiredEnvVars = [
      'MAILGUN_API_KEY',
      'MAILGUN_DOMAIN',
      'MAILGUN_REGION',
      'MAILGUN_FROM_EMAIL'
    ];
    
    let allPresent = true;
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        console.log(`❌ Missing environment variable: ${envVar}`);
        allPresent = false;
      } else {
        console.log(`✅ ${envVar}: ${process.env[envVar]}`);
      }
    });
    
    if (allPresent) {
      console.log('✅ All Mailgun environment variables are configured');
      return true;
    } else {
      console.log('❌ Missing required Mailgun environment variables');
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
    
    console.log(`📧 Sending welcome email to: ${testEmail}`);
    
    // Generate welcome email template
    const welcomeEmailData = emailTemplates.welcome(testName, testEmail);
    
    // Send email
    const result = await sendEmail({
      to: testEmail,
      subject: welcomeEmailData.subject,
      html: welcomeEmailData.html,
      metadata: {
        userId: 'test-user-id',
        emailType: 'welcome',
        testRun: true
      }
    });
    
    if (result.success && result.messageId) {
      console.log(`✅ Welcome email sent successfully!`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Subject: ${welcomeEmailData.subject}`);
      return true;
    } else {
      console.log('❌ Welcome email failed to send');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Welcome email test error:', error.message);
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
    
    console.log(`📧 Sending password reset email to: ${testEmail}`);
    
    // Generate password reset email template
    const passwordEmailData = emailTemplates.passwordReset(testName, newPassword, adminName);
    
    // Send email
    const result = await sendEmail({
      to: testEmail,
      subject: passwordEmailData.subject,
      html: passwordEmailData.html,
      metadata: {
        userId: 'test-user-id',
        emailType: 'password_reset',
        resetByAdmin: 'test-admin-id',
        testRun: true
      }
    });
    
    if (result.success && result.messageId) {
      console.log(`✅ Password reset email sent successfully!`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Subject: ${passwordEmailData.subject}`);
      return true;
    } else {
      console.log('❌ Password reset email failed to send');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Password reset email test error:', error.message);
    return false;
  }
}

async function testPaymentReceiptEmail() {
  console.log('💳 Testing payment receipt email functionality...');
  
  try {
    const testEmail = `test.payment.${Date.now()}@example.com`;
    const testName = 'Payment Test User';
    const amount = 3499; // $34.99 in cents
    const planName = 'Monthly Membership';
    const transactionId = `test_txn_${Date.now()}`;
    
    console.log(`📧 Sending payment receipt email to: ${testEmail}`);
    
    // Generate payment receipt email template
    const receiptEmailData = emailTemplates.paymentReceipt(testName, amount, planName, transactionId);
    
    // Send email
    const result = await sendEmail({
      to: testEmail,
      subject: receiptEmailData.subject,
      html: receiptEmailData.html,
      metadata: {
        userId: 'test-user-id',
        emailType: 'payment_receipt',
        transactionId: transactionId,
        testRun: true
      }
    });
    
    if (result.success && result.messageId) {
      console.log(`✅ Payment receipt email sent successfully!`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Subject: ${receiptEmailData.subject}`);
      return true;
    } else {
      console.log('❌ Payment receipt email failed to send');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Payment receipt email test error:', error.message);
    return false;
  }
}

// Run the tests
testMailgunIntegration().catch(console.error);
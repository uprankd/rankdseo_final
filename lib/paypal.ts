// PayPal configuration
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Get PayPal access token
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

// Helper function to create PayPal order
export async function createPayPalOrder(amount: number, currency: string = 'USD') {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: (amount / 100).toFixed(2), // Convert cents to dollars
            },
          },
        ],
      }),
    });

    const order = await response.json();
    
    if (!response.ok) {
      throw new Error(order.message || 'Failed to create PayPal order');
    }

    console.log('✅ PayPal order created:', order.id);
    
    return {
      success: true,
      orderId: order.id,
      order: order,
    };
  } catch (error: any) {
    console.error('❌ PayPal order creation error:', error);
    throw new Error(error.message || 'Failed to create PayPal order');
  }
}

// Helper function to capture PayPal order
export async function capturePayPalOrder(orderId: string) {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const capture = await response.json();
    
    if (!response.ok) {
      throw new Error(capture.message || 'Failed to capture PayPal order');
    }

    console.log('✅ PayPal payment captured:', orderId);
    
    return {
      success: true,
      captureId: capture.id,
      status: capture.status,
      order: capture,
    };
  } catch (error: any) {
    console.error('❌ PayPal capture error:', error);
    throw new Error(error.message || 'Failed to capture PayPal payment');
  }
}

// Helper function to get order details
export async function getPayPalOrderDetails(orderId: string) {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const order = await response.json();
    
    if (!response.ok) {
      throw new Error(order.message || 'Failed to get PayPal order');
    }
    
    return {
      success: true,
      order: order,
    };
  } catch (error: any) {
    console.error('❌ PayPal get order error:', error);
    throw new Error(error.message || 'Failed to get PayPal order details');
  }
}

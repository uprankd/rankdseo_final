import { Client, Environment, LogLevel } from '@paypal/paypal-server-sdk';

// Initialize PayPal client
const environment = process.env.PAYPAL_MODE === 'live' 
  ? Environment.Production 
  : Environment.Sandbox;

export const paypalClient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID!,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  },
  timeout: 0,
  environment: environment,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});

// Helper function to create PayPal order
export async function createPayPalOrder(amount: number, currency: string = 'USD') {
  try {
    const ordersController = paypalClient.ordersController;
    
    const collect = {
      body: {
        intent: 'CAPTURE',
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: (amount / 100).toFixed(2), // Convert cents to dollars
            },
          },
        ],
      },
      prefer: 'return=representation',
    };

    const response = await ordersController.ordersCreate(collect);
    const order = response.result;
    
    return {
      success: true,
      orderId: order.id,
      order: order,
    };
  } catch (error: any) {
    console.error('PayPal order creation error:', error);
    throw new Error(error.message || 'Failed to create PayPal order');
  }
}

// Helper function to capture PayPal order
export async function capturePayPalOrder(orderId: string) {
  try {
    const ordersController = paypalClient.ordersController;
    
    const collect = {
      id: orderId,
      prefer: 'return=representation',
    };

    const response = await ordersController.ordersCapture(collect);
    const capture = response.result;
    
    return {
      success: true,
      captureId: capture.id,
      status: capture.status,
      order: capture,
    };
  } catch (error: any) {
    console.error('PayPal order capture error:', error);
    throw new Error(error.message || 'Failed to capture PayPal order');
  }
}

// Helper function to get order details
export async function getPayPalOrderDetails(orderId: string) {
  try {
    const ordersController = paypalClient.ordersController;
    
    const collect = {
      id: orderId,
    };

    const response = await ordersController.ordersGet(collect);
    const order = response.result;
    
    return {
      success: true,
      order: order,
    };
  } catch (error: any) {
    console.error('PayPal get order error:', error);
    throw new Error(error.message || 'Failed to get PayPal order');
  }
}

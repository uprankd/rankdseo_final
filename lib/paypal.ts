import { Client, Environment, LogLevel, OrdersController } from '@paypal/paypal-server-sdk';

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

// Create orders controller instance
export const ordersController = new OrdersController(paypalClient);

// Helper function to create PayPal order
export async function createPayPalOrder(amount: number, currency: string = 'USD') {
  try {
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

    const { body, ...httpResponse } = await ordersController.ordersCreate(collect);
    
    return {
      success: true,
      orderId: body.id,
      order: body,
    };
  } catch (error: any) {
    console.error('PayPal order creation error:', error);
    throw new Error(error.message || 'Failed to create PayPal order');
  }
}

// Helper function to capture PayPal order
export async function capturePayPalOrder(orderId: string) {
  try {
    const collect = {
      id: orderId,
      prefer: 'return=representation',
    };

    const { body, ...httpResponse } = await ordersController.ordersCapture(collect);
    
    return {
      success: true,
      captureId: body.id,
      status: body.status,
      order: body,
    };
  } catch (error: any) {
    console.error('PayPal order capture error:', error);
    throw new Error(error.message || 'Failed to capture PayPal order');
  }
}

// Helper function to get order details
export async function getPayPalOrderDetails(orderId: string) {
  try {
    const collect = {
      id: orderId,
    };

    const { body, ...httpResponse } = await ordersController.ordersGet(collect);
    
    return {
      success: true,
      order: body,
    };
  } catch (error: any) {
    console.error('PayPal get order error:', error);
    throw new Error(error.message || 'Failed to get PayPal order');
  }
}

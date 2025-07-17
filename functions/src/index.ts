import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import * as express from 'express';
import * as cors from 'cors';

admin.initializeApp();

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

// Express app for webhooks
const app = express();
app.use(cors({ origin: true }));

// Create payment intent
export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    const { amount, currency = 'usd', metadata } = data;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create payment intent');
  }
});

// Handle successful payments
export const handlePaymentSuccess = functions.https.onCall(async (data, context) => {
  try {
    const { paymentIntentId, orderData } = data;
    
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Create order in Firestore
      const orderRef = await admin.firestore().collection('orders').add({
        ...orderData,
        paymentIntentId,
        status: 'confirmed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update product inventory
      const batch = admin.firestore().batch();
      for (const item of orderData.items) {
        const productRef = admin.firestore().collection('products').doc(item.productId);
        batch.update(productRef, {
          inventory: admin.firestore.FieldValue.increment(-item.quantity)
        });
      }
      await batch.commit();

      // Send confirmation email (implement email service)
      await sendOrderConfirmationEmail(orderData);

      return { orderId: orderRef.id, success: true };
    } else {
      throw new functions.https.HttpsError('failed-precondition', 'Payment not successful');
    }
  } catch (error) {
    console.error('Error handling payment:', error);
    throw new functions.https.HttpsError('internal', 'Unable to process order');
  }
});

// Update order status
export const updateOrderStatus = functions.https.onCall(async (data, context) => {
  // Verify admin authentication
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin');
  }

  const { orderId, status, trackingNumber } = data;

  try {
    const updateData: any = { 
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    await admin.firestore().collection('orders').doc(orderId).update(updateData);

    // Send status update email to customer
    const order = await admin.firestore().collection('orders').doc(orderId).get();
    if (order.exists) {
      await sendOrderStatusEmail(order.data(), status);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating order:', error);
    throw new functions.https.HttpsError('internal', 'Unable to update order');
  }
});

// Get analytics data
export const getAnalytics = functions.https.onCall(async (data, context) => {
  // Verify admin authentication
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin');
  }

  try {
    const { startDate, endDate } = data;
    
    // Get orders in date range
    const ordersQuery = admin.firestore().collection('orders')
      .where('createdAt', '>=', new Date(startDate))
      .where('createdAt', '<=', new Date(endDate))
      .where('status', '==', 'confirmed');

    const ordersSnapshot = await ordersQuery.get();
    
    let totalRevenue = 0;
    let totalOrders = 0;
    const productSales: { [key: string]: number } = {};

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      totalRevenue += order.total;
      totalOrders++;

      order.items.forEach((item: any) => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
      });
    });

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      topProducts: Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw new functions.https.HttpsError('internal', 'Unable to get analytics');
  }
});

// Email functions (implement with your preferred email service)
async function sendOrderConfirmationEmail(orderData: any) {
  // Implement email sending logic
  console.log('Sending order confirmation email for order:', orderData.id);
}

async function sendOrderStatusEmail(orderData: any, status: string) {
  // Implement email sending logic
  console.log('Sending order status email:', status, 'for order:', orderData.id);
}

// Stripe webhook handler
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, functions.config().stripe.webhook_secret);
  } catch (err) {
    console.log('Webhook signature verification failed.', err);
    return res.status(400).send('Webhook Error');
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!', paymentIntent.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

export const stripeWebhook = functions.https.onRequest(app);

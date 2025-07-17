# 🛍️ Your E-commerce Store

Complete e-commerce platform with web app, mobile app, and admin dashboard for selling your products online.

## 🌟 Features

### Customer Experience
- **Web & Mobile Apps** - Shop on any device
- **Product Catalog** - Browse, search, and filter products
- **Secure Checkout** - Stripe payment integration
- **User Accounts** - Order history and profile management
- **Real-time Updates** - Live inventory and order status

### Business Management
- **Admin Dashboard** - Complete store management
- **Product Management** - Add, edit, organize products
- **Order Processing** - Track and fulfill orders
- **Analytics** - Sales reports and insights
- **Inventory Tracking** - Stock management and alerts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Firebase account
- Stripe account
- Git

### 1. Clone & Setup
```bash
git clone https://github.com/Parzival-07/ecommerce-app.git
cd ecommerce-app
npm run install:all
```

### 2. Firebase Configuration
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication, Firestore, and Storage
3. Create `web/src/config/firebase.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id"
};
```

4. Copy this same config to `admin/src/config/firebase.ts`

### 3. Stripe Configuration
1. Get your Stripe keys from https://dashboard.stripe.com
2. Create `.env` files in `web/` and `admin/`:

```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

3. Configure Firebase Functions:
```bash
cd functions
firebase functions:config:set stripe.secret_key="sk_test_your_key"
firebase functions:config:set stripe.webhook_secret="whsec_your_webhook_secret"
```

### 4. Deploy
```bash
# Deploy everything
npm run setup
firebase deploy

# Or deploy individually
npm run deploy:web      # Customer store
npm run deploy:admin    # Admin dashboard  
npm run deploy:functions # Backend
```

## 📱 Development

### Run Locally
```bash
# Web store (customer-facing)
npm run dev:web

# Admin dashboard
npm run dev:admin

# Mobile app
npm run dev:mobile

# Backend functions
cd functions && npm run serve
```

### Project Structure
```
ecommerce-app/
├── web/                 # Customer web store
├── admin/              # Admin dashboard
├── mobile/             # React Native app
├── functions/          # Firebase backend
├── shared/             # Shared utilities
└── docs/               # Documentation
```

## 🛠️ Key Components

### Product Management
- Multiple product images
- Variants (size, color, etc.)
- Inventory tracking
- SEO optimization
- Bulk operations

### Order Processing
- Real-time order updates
- Payment processing
- Email notifications
- Shipping integration
- Status tracking

### Analytics
- Sales dashboards
- Product performance
- Customer insights
- Revenue tracking
- Export capabilities

## 📧 Support

Need help? Contact support or check the documentation in the `/docs` folder.

## 🎯 Next Steps

1. **Add Your Products** - Use the admin dashboard to add your inventory
2. **Customize Design** - Update colors, logos, and branding
3. **Configure Shipping** - Set up shipping zones and rates
4. **Test Orders** - Process test transactions
5. **Go Live** - Switch to production Stripe keys

Your store is ready to start selling! 🎉

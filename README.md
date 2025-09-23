# Sneaker Store - E-Commerce Platform

A modern, full-featured e-commerce platform for sneaker enthusiasts built with Next.js 15, TypeScript, Supabase, and Stripe.

## Features

- 🛍️ Product catalog with variants (sizes, colors)
- 🔐 User authentication and authorization
- 🛒 Shopping cart with session-based stock reservations
- 💳 Stripe payment integration
- 📦 Inventory management system
- 👥 Vendor accounts and admin dashboard
- 📱 Responsive design with Tailwind CSS
- 🔄 Real-time stock updates
- 📧 Order confirmation emails

## Tech Stack

- **Frontend**: Next.js 15.5.3, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Resend (for emails)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
```

### Installation

```bash
# Clone the repository
git clone https://github.com/NicolasDaCruz/Bootcamp_PGD5.git
cd Bootcamp_PGD5

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

The project uses Supabase for the database. Key tables include:

- `products` - Product catalog
- `product_variants` - Size/color variants with stock levels
- `users` - User accounts
- `orders` - Order records
- `order_items` - Individual items in orders
- `stock_reservations` - Temporary stock reservations for carts

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## Project Structure

```
src/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   ├── checkout/    # Checkout flow
│   ├── products/    # Product pages
│   └── ...
├── components/      # React components
├── lib/            # Utility functions
│   ├── stripe.ts   # Stripe integration
│   ├── supabase.ts # Supabase client
│   └── ...
└── types/          # TypeScript types
```

## Key Features Implementation

### Stock Reservation System
- Automatic reservation when items added to cart
- 15-minute reservation timeout
- Real-time stock updates

### Payment Processing
- Stripe Elements integration
- Payment intent creation with metadata
- Order creation on successful payment

### Admin Features
- Inventory management
- Order tracking
- Customer management

## Testing

```bash
npm run test         # Run tests
npm run test:e2e     # Run E2E tests with Playwright
```

## Deployment

The app can be deployed on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/NicolasDaCruz/Bootcamp_PGD5)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

This project is licensed under the MIT License.

## Author

Nicolas Da Cruz - Bootcamp PGD5 Project
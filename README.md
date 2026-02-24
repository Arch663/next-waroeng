# Waroeng Online - POS & Inventory Management System

A comprehensive Point of Sale (POS) and Inventory Management System for small to medium-sized retail businesses, built with modern web technologies.

## 🚀 Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: MongoDB Atlas with Mongoose
- **State Management**: Zustand
- **Charts**: Chart.js / react-chartjs-2
- **Icons**: Lucide React
- **Backend**: Express.js API server

## ✨ Features

### Core Modules
- **Dashboard**: Real-time metrics, sales trends, and stock health visualization
- **Products**: Full CRUD with SKU auto-generation, categories, and stock tracking
- **Inventory**: Stock management with adjustment history
- **Cashier/POS**: Fast checkout with cart management and receipt generation
- **Purchases**: Track supplier purchases and restocking
- **Suppliers**: Manage supplier information
- **Reports**: Sales, profit, and inventory analytics
- **Settings**: Store configuration and preferences

### User Roles & Permissions
- **Admin**: Full access to all modules including user management
- **Manager**: Access to inventory, reports, purchases, and suppliers
- **Cashier**: Access to POS and basic operations

### Additional Features
- 🌙 Dark/Light mode toggle
- 🌐 Bilingual support (English & Indonesian)
- 📱 Responsive design (mobile-first)
- 🔐 JWT-based authentication
- 🎨 Premium UI with smooth animations
- 📊 Interactive charts and visualizations

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- MongoDB Atlas account or local MongoDB instance

## 🛠️ Installation

### 1. Clone the repository
```bash
cd waroeng
```

### 2. Install dependencies
```bash
pnpm install
cd server && pnpm install && cd ..
```

### 3. Configure environment variables

Create `.env.local` in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Create `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/waroeng
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waroeng

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development
```

### 4. Seed the database
```bash
cd server
pnpm run seed
```

This creates:
- Admin user (username: `admin`, password: `admin123`)
- Sample categories, products, and suppliers

## 🚀 Running the Application

### Option 1: Run both frontend and backend together
```bash
pnpm run dev:all
```

### Option 2: Run separately (in different terminals)

Terminal 1 - Backend API:
```bash
cd server
pnpm run dev
```

Terminal 2 - Frontend:
```bash
pnpm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## ▲ Vercel Deployment (Frontend)

Use this when deploying the Next.js app to Vercel and backend to another host (Railway/Render/VPS).

### 1. Required environment variable in Vercel

Set this in Vercel Project Settings -> Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

### 2. Import project

- Import this repository to Vercel.
- Root Directory: project root (`waroeng`).
- Framework Preset: Next.js.
- Build Command: `npm run build`.

### 3. Deploy

After env is set, redeploy. No code changes are needed for production URL switching.

## 📁 Project Structure

```
waroeng/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard module
│   ├── products/          # Product management
│   ├── inventory/         # Inventory management
│   ├── checkout/          # POS/Cashier module
│   ├── purchases/         # Purchase management
│   ├── suppliers/         # Supplier management
│   ├── reports/           # Reports & analytics
│   ├── login/             # Authentication
│   └── settings/          # App settings
├── components/
│   ├── layout/            # Layout components (Sidebar, Header)
│   ├── providers/         # Context providers (Theme, Language)
│   └── ui/                # Reusable UI components
├── lib/
│   ├── api.ts             # API client
│   ├── store.ts           # Zustand stores
│   ├── i18n.ts            # Translations
│   └── LanguageContext.tsx
├── server/
│   ├── config/            # Database configuration
│   ├── middleware/        # Auth middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   └── utils/             # Utilities (SKU generator, etc.)
└── public/                # Static assets
```

## 🔐 Default Credentials

```
Username: admin
Password: admin123
Role: Administrator
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction (checkout)

### Reports
- `GET /api/reports/dashboard` - Dashboard metrics
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/profit` - Profit analysis

## 🌐 Localization

The app supports two languages:
- **English** (default)
- **Indonesian** (Bahasa)

Language preference is stored in localStorage and persists across sessions.

## 🎨 UI Components

Built with Tailwind CSS v4 and custom components:
- Button (multiple variants)
- Card (with Header, Content, Footer)
- Input (with label and validation)
- Modal (dialog)
- ConfirmModal (confirmation dialog)
- ProductCard (grid view)
- InventoryTable (list view)
- StatCard (dashboard metrics)
- Skeleton (loading states)

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Protected API routes
- Input validation with express-validator
- CORS configuration

## 📈 Development Roadmap

- [ ] User management module
- [ ] Barcode scanner support
- [ ] Print receipt functionality
- [ ] Export reports to PDF/CSV
- [ ] Multi-store support
- [ ] Customer management
- [ ] Loyalty program
- [ ] Mobile app (React Native)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

Built with ❤️ for small business owners and retailers.

---

**Waroeng** - Your trusted shop management partner.

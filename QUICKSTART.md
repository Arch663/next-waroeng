# Quick Start Guide - Waroeng

## Prerequisites
- Node.js 18 or higher
- MongoDB Atlas account (free tier works)

## Setup Steps

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment Variables

**Backend (`server/.env`):**
```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/waroeng?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=5000
NODE_ENV=development
```

**Frontend (`.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Seed the Database (Optional but Recommended)

This creates sample data including an admin user:

```bash
npm run seed
```

Default credentials after seeding:
- Username: `admin`
- Password: `admin123`

### 4. Run the Application

**Option A: Run both servers together (recommended)**
```bash
npm run dev:all
```

**Option B: Run servers separately**

Terminal 1 (Backend):
```bash
npm run dev:server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 5. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/health

## Features Overview

| Page | Description |
|------|-------------|
| `/login` | User authentication |
| `/dashboard` | Shop statistics and charts |
| `/products` | Product catalog management |
| `/checkout` | Point-of-sale interface |
| `/inventory` | Stock management and history |
| `/purchases` | Restock from suppliers |
| `/suppliers` | Supplier management |
| `/reports` | Financial reports |

## Common Tasks

### Create a New User
After running the seed script, use the admin account to log in. The application doesn't have a registration page for security - users are created directly in the database.

### Test the API
```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Build for Production

```bash
# Build frontend
npm run build

# Build backend
cd server && npm run build
```

## Troubleshooting

### MongoDB Connection Error
- Check your `MONGODB_URI` in `server/.env`
- Ensure your IP address is whitelisted in MongoDB Atlas
- Verify username and password are correct

### Port Already in Use
- Change `PORT` in `server/.env`
- Update `NEXT_PUBLIC_API_URL` in `.env.local` accordingly

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `npm install`

## Project Structure

```
waroeng/
├── app/              # Next.js pages
├── components/       # React components
├── lib/              # Utilities, API client, store
├── server/           # Express backend
│   ├── config/       # Database config
│   ├── middleware/   # Auth middleware
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API routes
│   └── utils/        # Utilities
└── ...
```

## Next Steps

1. Customize the theme colors in `app/globals.css`
2. Add your own products via the UI
3. Set up suppliers for your business
4. Start tracking sales and inventory

Enjoy using Waroeng! 🎉

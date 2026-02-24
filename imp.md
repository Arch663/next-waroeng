Implementation Plan - Waroeng Application (Full-stack)
Build a comprehensive shop management application with Next.js (frontend) and Express (backend), using MongoDB Atlas as the data store.

Proposed Changes
Backend (Express + MongoDB)
The backend will be located in a /server directory within the project root.

Schema Design
Users: username, password (hashed).
Products: name, price, stock, categoryId (Ref), image.
Categories: name.
Suppliers: name, contact, address.
Transactions (Sales): items (Product Ref, quantity, price), totalAmount, cashPaid, change, createdAt.
Purchases (Restock): items (Product Ref, quantity, buyPrice), supplierId (Ref), totalAmount, createdAt.
History: Log of all stock movements (Sold or Bought).
API Endpoints
POST /api/auth/login
GET /api/products, POST /api/products, PUT /api/products/:id, DELETE /api/products/:id
GET /api/categories, POST /api/categories
GET /api/suppliers, POST /api/suppliers
POST /api/transactions (Checkout)
POST /api/purchases (Restock)
GET /api/reports (Aggregated statistics)
Frontend (Next.js + Tailwind)
Next.js app using App Router.

Design System
Theme: Dark/Light mode using Tailwind's dark selector and CSS variables for smooth transitions.
Components:
StatCard: For dashboard highlights.
ProductCard: For the shop view.
InventoryTable: With pagination and actions.
Modal: Generic slot-based modal for CRUD.
Skeleton: Loading states for all pages.
Pages
/login: Secure entry point.
/dashboard: Stats and Chart.js visualizations.
/products: Searchable product grid + checkout sidebar.
/inventory: Product management with history audit.
/purchases: Restock tracking from suppliers.
/suppliers: Supplier contact list.
/reports: Detailed financial and performance analysis.
Verification Plan
Automated Tests
Postman/Insomnia or curl for API testing.
Manual verification of state management (Zustand or React Context).
Manual Verification
Login flow (with show/hide password).
Theme toggle persistence.
Checkout calculation (Change = Cash - Total).
Stock update synchronization (Buy/Sell effects stock).
Search parameters (?search=...) synchronization.
Responsive layout testing (Desktop vs Mobile).
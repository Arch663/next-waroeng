import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5000/api" : "/api");

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    api.post("/auth/login", { username, password }),
  register: (data: { username: string; password: string; fullName?: string; email?: string }) =>
    api.post("/auth/register", data),
};

// Products API
export const productsAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) =>
    api.get("/products", { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: { 
    name: string; 
    price: number; 
    costPrice?: number;
    stock?: number; 
    categoryId: string; 
    unit?: string;
    minStock?: number;
    image?: string 
  }) =>
    api.post("/products", data),
  update: (id: string, data: Partial<{ 
    name: string; 
    price: number; 
    costPrice: number;
    stock: number; 
    categoryId: string; 
    unit: string;
    minStock: number;
    image: string 
  }>) =>
    api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get("/categories"),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: { name: string }) => api.post("/categories", data),
  update: (id: string, data: { name: string }) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: () => api.get("/suppliers"),
  getById: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: { name: string; contact: string; address: string }) =>
    api.post("/suppliers", data),
  update: (id: string, data: Partial<{ name: string; contact: string; address: string }>) =>
    api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get("/transactions", { params }),
  getById: (id: string) => api.get(`/transactions/${id}`),
  create: (data: { items: { productId: string; quantity: number; price: number }[]; cashPaid: number }) =>
    api.post("/transactions", data),
};

// Purchases API
export const purchasesAPI = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get("/purchases", { params }),
  getById: (id: string) => api.get(`/purchases/${id}`),
  create: (data: { supplierId: string; items: { productId: string; quantity: number; buyPrice: number }[] }) =>
    api.post("/purchases", data),
  delete: (id: string) => api.delete(`/purchases/${id}`),
};

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get("/reports/dashboard"),
  getSales: (params?: { startDate?: string; endDate?: string }) =>
    api.get("/reports/sales", { params }),
  getPurchases: (params?: { startDate?: string; endDate?: string }) =>
    api.get("/reports/purchases", { params }),
  getHistory: (params?: { page?: number; limit?: number; productId?: string; type?: string }) =>
    api.get("/reports/history", { params }),
  getProfit: (params?: { startDate?: string; endDate?: string }) =>
    api.get("/reports/profit", { params }),
};

// Users API
export const usersAPI = {
  getAll: () => api.get("/users"),
  updateRole: (id: string, role: "admin" | "manager" | "cashier") =>
    api.patch(`/users/${id}/role`, { role }),
};

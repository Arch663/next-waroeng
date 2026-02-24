import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  role: 'admin' | 'manager' | 'cashier';
  email?: string;
  fullName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
    }
  )
);

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: { _id: string; name: string; price: number; stock: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  addItem: (product) =>
    set((state) => {
      const existingItem = state.items.find((item) => item.productId === product._id);
      if (existingItem) {
        if (existingItem.quantity < existingItem.stock) {
          return {
            items: state.items.map((item) =>
              item.productId === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          };
        }
        return state;
      }
      return {
        items: [
          ...state.items,
          {
            productId: product._id,
            productName: product.name,
            price: product.price,
            quantity: 1,
            stock: product.stock,
          },
        ],
      };
    }),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
          : item
      ),
    })),
  clearCart: () => set({ items: [] }),
  getTotalAmount: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

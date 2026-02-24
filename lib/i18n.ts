export type Language = 'en' | 'id';

export interface Translation {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    loading: string;
    success: string;
    error: string;
    confirm: string;
    actions: string;
    close: string;
    export: string;
    import: string;
    settings: string;
    logout: string;
    login: string;
    back: string;
    next: string;
    previous: string;
    yes: string;
    no: string;
  };
  auth: {
    title: string;
    username: string;
    password: string;
    rememberMe: string;
    forgotPassword: string;
    signIn: string;
    signOut: string;
    invalidCredentials: string;
    required: string;
  };
  dashboard: {
    title: string;
    totalSales: string;
    totalProfit: string;
    lowStock: string;
    recentTransactions: string;
    salesTrend: string;
    today: string;
    thisWeek: string;
    thisMonth: string;
    thisYear: string;
  };
  products: {
    title: string;
    addProduct: string;
    editProduct: string;
    deleteProduct: string;
    name: string;
    sku: string;
    category: string;
    costPrice: string;
    sellingPrice: string;
    stock: string;
    unit: string;
    minStock: string;
    image: string;
    description: string;
    selectCategory: string;
    selectUnit: string;
    lowStockAlert: string;
    outOfStock: string;
    inStock: string;
  };
  inventory: {
    title: string;
    adjustStock: string;
    stockIn: string;
    stockOut: string;
    currentStock: string;
    stockHistory: string;
    adjustNotes: string;
  };
  cashier: {
    title: string;
    checkout: string;
    cart: string;
    subtotal: string;
    tax: string;
    total: string;
    cashPaid: string;
    change: string;
    processPayment: string;
    searchProduct: string;
    addToCart: string;
    quantity: string;
    removeItem: string;
    emptyCart: string;
    receiptTitle: string;
    transactionSuccess: string;
  };
  purchases: {
    title: string;
    addPurchase: string;
    supplier: string;
    purchaseDate: string;
    items: string;
    totalCost: string;
    status: string;
    pending: string;
    completed: string;
    cancelled: string;
  };
  suppliers: {
    title: string;
    addSupplier: string;
    editSupplier: string;
    name: string;
    contact: string;
    address: string;
    email: string;
    phone: string;
    selectSupplier: string;
  };
  reports: {
    title: string;
    salesReport: string;
    purchaseReport: string;
    profitReport: string;
    inventoryReport: string;
    dateRange: string;
    startDate: string;
    endDate: string;
    generate: string;
    exportCSV: string;
    exportPDF: string;
  };
  settings: {
    title: string;
    storeName: string;
    storeAddress: string;
    storePhone: string;
    storeEmail: string;
    language: string;
    theme: string;
    lightMode: string;
    darkMode: string;
    saveSettings: string;
  };
  units: {
    pcs: string;
    box: string;
    kg: string;
    liter: string;
    pack: string;
    bottle: string;
    can: string;
    sachet: string;
  };
  roles: {
    admin: string;
    manager: string;
    cashier: string;
  };
  messages: {
    deleteConfirm: string;
    saveSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    errorOccurred: string;
    noData: string;
  };
}

export const translations: Record<Language, Translation> = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      confirm: 'Confirm',
      actions: 'Actions',
      close: 'Close',
      export: 'Export',
      import: 'Import',
      settings: 'Settings',
      logout: 'Logout',
      login: 'Login',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      yes: 'Yes',
      no: 'No',
    },
    auth: {
      title: 'Sign In to Waroeng',
      username: 'Username',
      password: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      invalidCredentials: 'Invalid username or password',
      required: 'This field is required',
    },
    dashboard: {
      title: 'Dashboard',
      totalSales: 'Total Sales',
      totalProfit: 'Total Profit',
      lowStock: 'Low Stock',
      recentTransactions: 'Recent Transactions',
      salesTrend: 'Sales Trend',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      thisYear: 'This Year',
    },
    products: {
      title: 'Products',
      addProduct: 'Add Product',
      editProduct: 'Edit Product',
      deleteProduct: 'Delete Product',
      name: 'Product Name',
      sku: 'SKU / Code',
      category: 'Category',
      costPrice: 'Cost Price',
      sellingPrice: 'Selling Price',
      stock: 'Stock Level',
      unit: 'Unit',
      minStock: 'Min Stock',
      image: 'Image',
      description: 'Description',
      selectCategory: 'Select Category',
      selectUnit: 'Select Unit',
      lowStockAlert: 'Low Stock Alert',
      outOfStock: 'Out of Stock',
      inStock: 'In Stock',
    },
    inventory: {
      title: 'Inventory',
      adjustStock: 'Adjust Stock',
      stockIn: 'Stock In',
      stockOut: 'Stock Out',
      currentStock: 'Current Stock',
      stockHistory: 'Stock History',
      adjustNotes: 'Adjustment Notes',
    },
    cashier: {
      title: 'Cashier / POS',
      checkout: 'Checkout',
      cart: 'Shopping Cart',
      subtotal: 'Subtotal',
      tax: 'Tax',
      total: 'Total',
      cashPaid: 'Cash Paid',
      change: 'Change',
      processPayment: 'Process Payment',
      searchProduct: 'Search products...',
      addToCart: 'Add to Cart',
      quantity: 'Quantity',
      removeItem: 'Remove Item',
      emptyCart: 'Empty Cart',
      receiptTitle: 'Receipt',
      transactionSuccess: 'Transaction Successful',
    },
    purchases: {
      title: 'Purchases',
      addPurchase: 'Add Purchase',
      supplier: 'Supplier',
      purchaseDate: 'Purchase Date',
      items: 'Items',
      totalCost: 'Total Cost',
      status: 'Status',
      pending: 'Pending',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
    suppliers: {
      title: 'Suppliers',
      addSupplier: 'Add Supplier',
      editSupplier: 'Edit Supplier',
      name: 'Supplier Name',
      contact: 'Contact Person',
      address: 'Address',
      email: 'Email',
      phone: 'Phone',
      selectSupplier: 'Select Supplier',
    },
    reports: {
      title: 'Reports & Analytics',
      salesReport: 'Sales Report',
      purchaseReport: 'Purchase Report',
      profitReport: 'Profit & Loss',
      inventoryReport: 'Inventory Report',
      dateRange: 'Date Range',
      startDate: 'Start Date',
      endDate: 'End Date',
      generate: 'Generate Report',
      exportCSV: 'Export CSV',
      exportPDF: 'Export PDF',
    },
    settings: {
      title: 'Settings',
      storeName: 'Store Name',
      storeAddress: 'Store Address',
      storePhone: 'Store Phone',
      storeEmail: 'Store Email',
      language: 'Language',
      theme: 'Theme',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      saveSettings: 'Save Settings',
    },
    units: {
      pcs: 'Piece(s)',
      box: 'Box',
      kg: 'Kilogram',
      liter: 'Liter',
      pack: 'Pack',
      bottle: 'Bottle',
      can: 'Can',
      sachet: 'Sachet',
    },
    roles: {
      admin: 'Administrator',
      manager: 'Manager',
      cashier: 'Cashier',
    },
    messages: {
      deleteConfirm: 'Are you sure you want to delete this item?',
      saveSuccess: 'Item saved successfully',
      updateSuccess: 'Item updated successfully',
      deleteSuccess: 'Item deleted successfully',
      errorOccurred: 'An error occurred',
      noData: 'No data available',
    },
  },
  id: {
    common: {
      save: 'Simpan',
      cancel: 'Batal',
      delete: 'Hapus',
      edit: 'Edit',
      add: 'Tambah',
      search: 'Cari',
      loading: 'Memuat...',
      success: 'Berhasil',
      error: 'Error',
      confirm: 'Konfirmasi',
      actions: 'Aksi',
      close: 'Tutup',
      export: 'Ekspor',
      import: 'Impor',
      settings: 'Pengaturan',
      logout: 'Keluar',
      login: 'Masuk',
      back: 'Kembali',
      next: 'Lanjut',
      previous: 'Sebelumnya',
      yes: 'Ya',
      no: 'Tidak',
    },
    auth: {
      title: 'Masuk ke Waroeng',
      username: 'Nama Pengguna',
      password: 'Kata Sandi',
      rememberMe: 'Ingat saya',
      forgotPassword: 'Lupa kata sandi?',
      signIn: 'Masuk',
      signOut: 'Keluar',
      invalidCredentials: 'Nama pengguna atau kata sandi salah',
      required: 'Kolom ini wajib diisi',
    },
    dashboard: {
      title: 'Dasbor',
      totalSales: 'Total Penjualan',
      totalProfit: 'Total Laba',
      lowStock: 'Stok Rendah',
      recentTransactions: 'Transaksi Terakhir',
      salesTrend: 'Tren Penjualan',
      today: 'Hari Ini',
      thisWeek: 'Minggu Ini',
      thisMonth: 'Bulan Ini',
      thisYear: 'Tahun Ini',
    },
    products: {
      title: 'Produk',
      addProduct: 'Tambah Produk',
      editProduct: 'Edit Produk',
      deleteProduct: 'Hapus Produk',
      name: 'Nama Produk',
      sku: 'SKU / Kode',
      category: 'Kategori',
      costPrice: 'Harga Modal',
      sellingPrice: 'Harga Jual',
      stock: 'Stok',
      unit: 'Satuan',
      minStock: 'Stok Min.',
      image: 'Gambar',
      description: 'Deskripsi',
      selectCategory: 'Pilih Kategori',
      selectUnit: 'Pilih Satuan',
      lowStockAlert: 'Peringatan Stok Rendah',
      outOfStock: 'Habis',
      inStock: 'Tersedia',
    },
    inventory: {
      title: 'Inventaris',
      adjustStock: 'Sesuaikan Stok',
      stockIn: 'Stok Masuk',
      stockOut: 'Stok Keluar',
      currentStock: 'Stok Saat Ini',
      stockHistory: 'Riwayat Stok',
      adjustNotes: 'Catatan Penyesuaian',
    },
    cashier: {
      title: 'Kasir / POS',
      checkout: 'Bayar',
      cart: 'Keranjang Belanja',
      subtotal: 'Subtotal',
      tax: 'Pajak',
      total: 'Total',
      cashPaid: 'Tunai',
      change: 'Kembalian',
      processPayment: 'Proses Pembayaran',
      searchProduct: 'Cari produk...',
      addToCart: 'Tambah ke Keranjang',
      quantity: 'Jumlah',
      removeItem: 'Hapus Item',
      emptyCart: 'Keranjang Kosong',
      receiptTitle: 'Struk',
      transactionSuccess: 'Transaksi Berhasil',
    },
    purchases: {
      title: 'Pembelian',
      addPurchase: 'Tambah Pembelian',
      supplier: 'Supplier',
      purchaseDate: 'Tanggal Pembelian',
      items: 'Item',
      totalCost: 'Total Biaya',
      status: 'Status',
      pending: 'Tertunda',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    },
    suppliers: {
      title: 'Supplier',
      addSupplier: 'Tambah Supplier',
      editSupplier: 'Edit Supplier',
      name: 'Nama Supplier',
      contact: 'Kontak Person',
      address: 'Alamat',
      email: 'Email',
      phone: 'Telepon',
      selectSupplier: 'Pilih Supplier',
    },
    reports: {
      title: 'Laporan & Analitik',
      salesReport: 'Laporan Penjualan',
      purchaseReport: 'Laporan Pembelian',
      profitReport: 'Laba & Rugi',
      inventoryReport: 'Laporan Inventaris',
      dateRange: 'Rentang Tanggal',
      startDate: 'Tanggal Mulai',
      endDate: 'Tanggal Akhir',
      generate: 'Buat Laporan',
      exportCSV: 'Ekspor CSV',
      exportPDF: 'Ekspor PDF',
    },
    settings: {
      title: 'Pengaturan',
      storeName: 'Nama Toko',
      storeAddress: 'Alamat Toko',
      storePhone: 'Telepon Toko',
      storeEmail: 'Email Toko',
      language: 'Bahasa',
      theme: 'Tema',
      lightMode: 'Mode Terang',
      darkMode: 'Mode Gelap',
      saveSettings: 'Simpan Pengaturan',
    },
    units: {
      pcs: 'Pcs',
      box: 'Dus',
      kg: 'Kg',
      liter: 'Liter',
      pack: 'Pack',
      bottle: 'Botol',
      can: 'Kaleng',
      sachet: 'Sachet',
    },
    roles: {
      admin: 'Administrator',
      manager: 'Manajer',
      cashier: 'Kasir',
    },
    messages: {
      deleteConfirm: 'Apakah Anda yakin ingin menghapus item ini?',
      saveSuccess: 'Item berhasil disimpan',
      updateSuccess: 'Item berhasil diperbarui',
      deleteSuccess: 'Item berhasil dihapus',
      errorOccurred: 'Terjadi kesalahan',
      noData: 'Tidak ada data',
    },
  },
};

export const defaultLanguage: Language = 'en';

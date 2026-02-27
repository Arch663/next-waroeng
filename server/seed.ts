import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Category } from './models/Category';
import { Product } from './models/Product';
import { Supplier } from './models/Supplier';
import { Purchase } from './models/Purchase';
import { Transaction } from './models/Transaction';

dotenv.config();

// SKU Generator matching server/routes/products.ts
const buildCategoryAcronym = (categoryName: string): string => {
  const cleaned = categoryName.replace(/[^A-Za-z0-9\s]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (!words.length) return 'CAT';

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase().padEnd(3, 'X');
  }

  let acronym = words.map((w) => w[0]).join('').toUpperCase();
  if (acronym.length < 3) {
    const extra = words.join('').slice(acronym.length, 3).toUpperCase();
    acronym = `${acronym}${extra}`;
  }

  return acronym.slice(0, 3).padEnd(3, 'X');
};

const formatSku = (prefix: string, sequence: number): string => {
  return `${prefix}-${sequence.toString().padStart(3, '0')}`;
};

const generateCategorySku = (categoryName: string, index: number): string => {
  const prefix = buildCategoryAcronym(categoryName);
  return formatSku(prefix, index + 1);
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Supplier.deleteMany({}),
      Purchase.deleteMany({}),
      Transaction.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      email: 'admin@waroeng.com',
      fullName: 'Administrator',
    });
    console.log('👤 Created admin user (username: admin, password: admin123)');

    // Create categories
    const categories = await Category.insertMany([
      { name: 'Makanan' },
      { name: 'Minuman' },
      { name: 'Snack' },
      { name: 'Kebutuhan Pokok' },
      { name: 'Bumbu & Saus' },
      { name: 'Sembako' },
      { name: 'Mie & Pasta' },
      { name: 'Kopi & Teh' },
      { name: 'Susu & Bayi' },
      { name: 'Kesehatan' },
      { name: 'Kebersihan' },
      { name: 'Rokok' },
    ]);
    console.log('📦 Created categories');

    // Create suppliers
    const suppliers = await Supplier.insertMany([
      {
        name: 'PT. Sumber Makmur',
        contact: '0812-3456-7890',
        address: 'Jl. Raya Utama No. 123, Jakarta',
      },
      {
        name: 'CV. Berkah Jaya',
        contact: '0813-4567-8901',
        address: 'Jl. Commerce Street No. 45, Surabaya',
      },
      {
        name: 'UD. Sentosa',
        contact: '0814-5678-9012',
        address: 'Jl. Industrial Park No. 78, Bandung',
      },
      {
        name: 'Toko Bangun Jaya',
        contact: '0815-6789-0123',
        address: 'Jl. Pasar Baru No. 56, Semarang',
      },
      {
        name: 'CV. Mitra Sejahtera',
        contact: '0816-7890-1234',
        address: 'Jl. Gajah Mada No. 89, Yogyakarta',
      },
    ]);
    console.log('🏭 Created suppliers');

    // Create 50+ products for a typical Indonesian grocery store (waroeng)
    const productsData = [
      // Makanan (Category 0)
      { name: 'Indomie Goreng', costPrice: 2800, price: 3500, stock: 200, unit: 'pcs', categoryIndex: 0 },
      { name: 'Indomie Ayam Bawang', costPrice: 2800, price: 3500, stock: 180, unit: 'pcs', categoryIndex: 0 },
      { name: 'Indomie Soto', costPrice: 2800, price: 3500, stock: 150, unit: 'pcs', categoryIndex: 0 },
      { name: 'Indomie Rendang', costPrice: 2800, price: 3500, stock: 120, unit: 'pcs', categoryIndex: 0 },
      { name: 'Mie Sedaap Goreng', costPrice: 2700, price: 3300, stock: 160, unit: 'pcs', categoryIndex: 0 },
      { name: 'Sarimi Ayam Jamur', costPrice: 2500, price: 3000, stock: 100, unit: 'pcs', categoryIndex: 0 },
      { name: 'Nasi Instan Indomie', costPrice: 3500, price: 4500, stock: 80, unit: 'pcs', categoryIndex: 0 },
      { name: 'Biskuit Roma Malkist', costPrice: 4500, price: 6000, stock: 60, unit: 'pack', categoryIndex: 0 },
      { name: 'Khong Guan Biskuit', costPrice: 8000, price: 10000, stock: 40, unit: 'box', categoryIndex: 0 },
      { name: 'Tango Wafer', costPrice: 3000, price: 4000, stock: 100, unit: 'pack', categoryIndex: 0 },

      // Minuman (Category 1)
      { name: 'Aqua 600ml', costPrice: 2500, price: 4000, stock: 100, unit: 'bottle', categoryIndex: 1 },
      { name: 'Aqua 1.5L', costPrice: 5000, price: 7000, stock: 50, unit: 'bottle', categoryIndex: 1 },
      { name: 'Le Minerale 600ml', costPrice: 2300, price: 3500, stock: 120, unit: 'bottle', categoryIndex: 1 },
      { name: 'Teh Botol Sosro 300ml', costPrice: 3000, price: 4500, stock: 80, unit: 'bottle', categoryIndex: 1 },
      { name: 'Fanta 330ml', costPrice: 3500, price: 5000, stock: 60, unit: 'can', categoryIndex: 1 },
      { name: 'Coca Cola 330ml', costPrice: 3500, price: 5000, stock: 70, unit: 'can', categoryIndex: 1 },
      { name: 'Sprite 330ml', costPrice: 3500, price: 5000, stock: 55, unit: 'can', categoryIndex: 1 },
      { name: 'Pocari Sweat 350ml', costPrice: 4500, price: 6500, stock: 45, unit: 'bottle', categoryIndex: 1 },
      { name: 'Energen Coklat', costPrice: 500, price: 1000, stock: 200, unit: 'sachet', categoryIndex: 1 },
      { name: 'Good Day Coffee', costPrice: 800, price: 1500, stock: 150, unit: 'sachet', categoryIndex: 1 },

      // Snack (Category 2)
      { name: 'Chitato Sapi Panggang', costPrice: 7000, price: 9000, stock: 50, unit: 'pack', categoryIndex: 2 },
      { name: 'Lays Original', costPrice: 8000, price: 10000, stock: 40, unit: 'pack', categoryIndex: 2 },
      { name: 'Taro Net', costPrice: 500, price: 1000, stock: 200, unit: 'pack', categoryIndex: 2 },
      { name: 'Jetz Cheese', costPrice: 500, price: 1000, stock: 180, unit: 'pack', categoryIndex: 2 },
      { name: 'Beng Beng', costPrice: 500, price: 1000, stock: 150, unit: 'pcs', categoryIndex: 2 },
      { name: 'Silverqueen', costPrice: 1500, price: 2500, stock: 100, unit: 'pcs', categoryIndex: 2 },
      { name: 'Delfi Coklat', costPrice: 500, price: 1000, stock: 120, unit: 'pcs', categoryIndex: 2 },
      { name: 'Oreo Original', costPrice: 6000, price: 8000, stock: 60, unit: 'pack', categoryIndex: 2 },
      { name: 'Roma Kelapa', costPrice: 4000, price: 5500, stock: 50, unit: 'pack', categoryIndex: 2 },
      { name: 'Pilus Garuda', costPrice: 3000, price: 4500, stock: 80, unit: 'pack', categoryIndex: 2 },

      // Kebutuhan Pokok (Category 3)
      { name: 'Minyak Goreng Bimoli 1L', costPrice: 18000, price: 25000, stock: 30, unit: 'bottle', categoryIndex: 3 },
      { name: 'Minyak Goreng Sunco 2L', costPrice: 35000, price: 45000, stock: 20, unit: 'bottle', categoryIndex: 3 },
      { name: 'Gula Pasir Gulaku 1kg', costPrice: 12000, price: 16000, stock: 40, unit: 'pack', categoryIndex: 3 },
      { name: 'Tepung Terigu Segitiga 1kg', costPrice: 10000, price: 14000, stock: 35, unit: 'pack', categoryIndex: 3 },
      { name: 'Telur Ayam 1kg', costPrice: 25000, price: 32000, stock: 25, unit: 'kg', categoryIndex: 3 },
      { name: 'Margarin Blueband 250g', costPrice: 8000, price: 11000, stock: 40, unit: 'pack', categoryIndex: 3 },
      { name: 'Susu Kental Manis Frisian 400ml', costPrice: 12000, price: 16000, stock: 30, unit: 'bottle', categoryIndex: 3 },
      { name: 'Kecap Bango 300ml', costPrice: 10000, price: 14000, stock: 35, unit: 'bottle', categoryIndex: 3 },
      { name: 'Saus ABC 300ml', costPrice: 6000, price: 8500, stock: 40, unit: 'bottle', categoryIndex: 3 },
      { name: 'Terasi ABC', costPrice: 2000, price: 3500, stock: 50, unit: 'pack', categoryIndex: 3 },

      // Bumbu & Saus (Category 4)
      { name: 'Royco Ayam 50g', costPrice: 3500, price: 5000, stock: 60, unit: 'pack', categoryIndex: 4 },
      { name: 'Royco Sapi 50g', costPrice: 3500, price: 5000, stock: 50, unit: 'pack', categoryIndex: 4 },
      { name: 'Masako Ayam 50g', costPrice: 3500, price: 5000, stock: 55, unit: 'pack', categoryIndex: 4 },
      { name: 'Sambal Indofood 100g', costPrice: 5000, price: 7500, stock: 40, unit: 'bottle', categoryIndex: 4 },
      { name: 'Saori Saus Tiram 200ml', costPrice: 8000, price: 11000, stock: 30, unit: 'bottle', categoryIndex: 4 },
      { name: 'Lada Bubuk 50g', costPrice: 4000, price: 6000, stock: 35, unit: 'pack', categoryIndex: 4 },
      { name: 'Ketumbar Bubuk 50g', costPrice: 3500, price: 5500, stock: 30, unit: 'pack', categoryIndex: 4 },
      { name: 'Bumbu Rendang Instan', costPrice: 5000, price: 7500, stock: 40, unit: 'pack', categoryIndex: 4 },
      { name: 'Bumbu Nasi Goreng Instan', costPrice: 4000, price: 6000, stock: 50, unit: 'pack', categoryIndex: 4 },
      { name: 'Cuka Makan 300ml', costPrice: 4000, price: 6000, stock: 35, unit: 'bottle', categoryIndex: 4 },

      // Sembako (Category 5)
      { name: 'Beras Pandan Wangi 5kg', costPrice: 55000, price: 70000, stock: 20, unit: 'pack', categoryIndex: 5 },
      { name: 'Beras Premium 5kg', costPrice: 50000, price: 65000, stock: 25, unit: 'pack', categoryIndex: 5 },
      { name: 'Beras 10kg', costPrice: 100000, price: 125000, stock: 10, unit: 'pack', categoryIndex: 5 },
      { name: 'Minyak Kita 2L', costPrice: 32000, price: 42000, stock: 25, unit: 'bottle', categoryIndex: 5 },
      { name: 'Gula Aren 250g', costPrice: 8000, price: 12000, stock: 30, unit: 'pack', categoryIndex: 5 },
      { name: 'Garam Dapur 500g', costPrice: 2000, price: 3500, stock: 60, unit: 'pack', categoryIndex: 5 },
      { name: 'Kopi Bubuk Kapal Api 100g', costPrice: 10000, price: 14000, stock: 40, unit: 'pack', categoryIndex: 5 },
      { name: 'Teh Celup Sariwangi 25s', costPrice: 6000, price: 8500, stock: 50, unit: 'box', categoryIndex: 5 },
      { name: 'Sabun Cuci Rinso 1kg', costPrice: 15000, price: 20000, stock: 30, unit: 'pack', categoryIndex: 5 },
      { name: 'Deterjen Daia 1kg', costPrice: 12000, price: 16000, stock: 35, unit: 'pack', categoryIndex: 5 },

      // Mie & Pasta (Category 6)
      { name: 'Spaghetti 500g', costPrice: 12000, price: 17000, stock: 25, unit: 'pack', categoryIndex: 6 },
      { name: 'Makaroni 250g', costPrice: 6000, price: 9000, stock: 30, unit: 'pack', categoryIndex: 6 },
      { name: 'Fusilli 250g', costPrice: 7000, price: 10000, stock: 20, unit: 'pack', categoryIndex: 6 },
      { name: 'Bihun Jagung 200g', costPrice: 4000, price: 6000, stock: 40, unit: 'pack', categoryIndex: 6 },
      { name: 'Soun 200g', costPrice: 3500, price: 5500, stock: 35, unit: 'pack', categoryIndex: 6 },

      // Kopi & Teh (Category 7)
      { name: 'Kopi Kapal Api 10s', costPrice: 15000, price: 20000, stock: 40, unit: 'box', categoryIndex: 7 },
      { name: 'Kopi Good Day 10s', costPrice: 12000, price: 17000, stock: 50, unit: 'box', categoryIndex: 7 },
      { name: 'Kopi Torabika 10s', costPrice: 13000, price: 18000, stock: 45, unit: 'box', categoryIndex: 7 },
      { name: 'Teh Celup Dandang 25s', costPrice: 5000, price: 7500, stock: 60, unit: 'box', categoryIndex: 7 },
      { name: 'Teh Kotak 250ml', costPrice: 4000, price: 6000, stock: 50, unit: 'box', categoryIndex: 7 },

      // Susu & Bayi (Category 8)
      { name: 'Susu Dancow 1+ 400g', costPrice: 45000, price: 60000, stock: 20, unit: 'pack', categoryIndex: 8 },
      { name: 'Susu SGM 1+ 400g', costPrice: 40000, price: 55000, stock: 25, unit: 'pack', categoryIndex: 8 },
      { name: 'Susu Bendera 400g', costPrice: 38000, price: 52000, stock: 20, unit: 'pack', categoryIndex: 8 },
      { name: 'Popok Bayi MamyPoko S', costPrice: 50000, price: 65000, stock: 15, unit: 'pack', categoryIndex: 8 },
      { name: 'Popok Bayi MamyPoko M', costPrice: 55000, price: 70000, stock: 20, unit: 'pack', categoryIndex: 8 },

      // Kesehatan (Category 9)
      { name: 'Paracetamol 10 tablet', costPrice: 3000, price: 5000, stock: 50, unit: 'pack', categoryIndex: 9 },
      { name: 'OBH Combi 60ml', costPrice: 12000, price: 17000, stock: 30, unit: 'bottle', categoryIndex: 9 },
      { name: 'Minyak Kayu Putih 60ml', costPrice: 15000, price: 22000, stock: 25, unit: 'bottle', categoryIndex: 9 },
      { name: 'Betadine 30ml', costPrice: 18000, price: 25000, stock: 20, unit: 'bottle', categoryIndex: 9 },
      { name: 'Hansaplast 10s', costPrice: 8000, price: 12000, stock: 40, unit: 'pack', categoryIndex: 9 },

      // Kebersihan (Category 10)
      { name: 'Sabun Mandi Lifebuoy 80g', costPrice: 3000, price: 5000, stock: 60, unit: 'pcs', categoryIndex: 10 },
      { name: 'Sabun Mandi Lux 80g', costPrice: 3500, price: 5500, stock: 50, unit: 'pcs', categoryIndex: 10 },
      { name: 'Shampoo Sunsilk 170ml', costPrice: 8000, price: 12000, stock: 40, unit: 'bottle', categoryIndex: 10 },
      { name: 'Shampoo Clear 170ml', costPrice: 9000, price: 13000, stock: 35, unit: 'bottle', categoryIndex: 10 },
      { name: 'Pasta Gigi Pepsodent 70g', costPrice: 5000, price: 7500, stock: 50, unit: 'tube', categoryIndex: 10 },
      { name: 'Sikat Gigi Oral-B', costPrice: 6000, price: 9000, stock: 40, unit: 'pcs', categoryIndex: 10 },
      { name: 'Tisu Wajah Paseo', costPrice: 8000, price: 12000, stock: 35, unit: 'pack', categoryIndex: 10 },
      { name: 'Pembalut Laurier 10s', costPrice: 12000, price: 17000, stock: 30, unit: 'pack', categoryIndex: 10 },

      // Rokok (Category 11)
      { name: 'Rokok Djarum Super 12s', costPrice: 22000, price: 28000, stock: 50, unit: 'pack', categoryIndex: 11 },
      { name: 'Rokok Sampoerna A 12s', costPrice: 24000, price: 30000, stock: 45, unit: 'pack', categoryIndex: 11 },
      { name: 'Rokok Gudang Garam 12s', costPrice: 23000, price: 29000, stock: 40, unit: 'pack', categoryIndex: 11 },
      { name: 'Rokok Bentoel 12s', costPrice: 20000, price: 26000, stock: 35, unit: 'pack', categoryIndex: 11 },
      { name: 'Rokok Marlboro 12s', costPrice: 32000, price: 40000, stock: 30, unit: 'pack', categoryIndex: 11 },
    ];

    // Create products with auto-generated SKU (per-category sequence)
    const categoryCounters = new Map<number, number>();
    const products = await Product.insertMany(
      productsData.map((product) => {
        const count = categoryCounters.get(product.categoryIndex) || 0;
        categoryCounters.set(product.categoryIndex, count + 1);
        const categoryName = categories[product.categoryIndex].name;
        return {
          name: product.name,
          costPrice: product.costPrice,
          price: product.price,
          stock: product.stock,
          unit: product.unit,
          categoryId: categories[product.categoryIndex]._id,
          sku: generateCategorySku(categoryName, count),
          image: '',
          minStock: 10,
        };
      })
    );
    console.log(`🛒 Created ${products.length} products`);

    // Create purchase records
    const purchases = await Purchase.insertMany([
      {
        items: [
          { productId: products[0]._id, productName: products[0].name, quantity: 100, buyPrice: 2800, subtotal: 280000 },
          { productId: products[1]._id, productName: products[1].name, quantity: 80, buyPrice: 2800, subtotal: 224000 },
          { productId: products[2]._id, productName: products[2].name, quantity: 60, buyPrice: 2800, subtotal: 168000 },
        ],
        supplierId: suppliers[0]._id,
        supplierName: suppliers[0].name,
        totalAmount: 672000,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        items: [
          { productId: products[10]._id, productName: products[10].name, quantity: 50, buyPrice: 2500, subtotal: 125000 },
          { productId: products[11]._id, productName: products[11].name, quantity: 30, buyPrice: 5000, subtotal: 150000 },
          { productId: products[12]._id, productName: products[12].name, quantity: 60, buyPrice: 2300, subtotal: 138000 },
        ],
        supplierId: suppliers[1]._id,
        supplierName: suppliers[1].name,
        totalAmount: 413000,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        items: [
          { productId: products[20]._id, productName: products[20].name, quantity: 30, buyPrice: 7000, subtotal: 210000 },
          { productId: products[21]._id, productName: products[21].name, quantity: 25, buyPrice: 8000, subtotal: 200000 },
          { productId: products[25]._id, productName: products[25].name, quantity: 80, buyPrice: 1500, subtotal: 120000 },
        ],
        supplierId: suppliers[2]._id,
        supplierName: suppliers[2].name,
        totalAmount: 530000,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        items: [
          { productId: products[30]._id, productName: products[30].name, quantity: 20, buyPrice: 18000, subtotal: 360000 },
          { productId: products[32]._id, productName: products[32].name, quantity: 25, buyPrice: 12000, subtotal: 300000 },
          { productId: products[35]._id, productName: products[35].name, quantity: 30, buyPrice: 8000, subtotal: 240000 },
        ],
        supplierId: suppliers[3]._id,
        supplierName: suppliers[3].name,
        totalAmount: 900000,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        items: [
          { productId: products[40]._id, productName: products[40].name, quantity: 40, buyPrice: 3500, subtotal: 140000 },
          { productId: products[41]._id, productName: products[41].name, quantity: 35, buyPrice: 3500, subtotal: 122500 },
          { productId: products[50]._id, productName: products[50].name, quantity: 15, buyPrice: 55000, subtotal: 825000 },
        ],
        supplierId: suppliers[4]._id,
        supplierName: suppliers[4].name,
        totalAmount: 1087500,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    ]);
    console.log(`📥 Created ${purchases.length} purchase records`);

    // Create transaction records
    const transactions = await Transaction.insertMany([
      {
        items: [
          { productId: products[0]._id, productName: products[0].name, quantity: 2, price: 3500, subtotal: 7000 },
          { productId: products[10]._id, productName: products[10].name, quantity: 1, price: 4000, subtotal: 4000 },
          { productId: products[22]._id, productName: products[22].name, quantity: 3, price: 1000, subtotal: 3000 },
        ],
        totalAmount: 14000,
        cashPaid: 20000,
        change: 6000,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      },
      {
        items: [
          { productId: products[30]._id, productName: products[30].name, quantity: 1, price: 25000, subtotal: 25000 },
          { productId: products[32]._id, productName: products[32].name, quantity: 1, price: 16000, subtotal: 16000 },
          { productId: products[37]._id, productName: products[37].name, quantity: 2, price: 14000, subtotal: 28000 },
        ],
        totalAmount: 69000,
        cashPaid: 100000,
        change: 31000,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        items: [
          { productId: products[55]._id, productName: products[55].name, quantity: 1, price: 28000, subtotal: 28000 },
          { productId: products[60]._id, productName: products[60].name, quantity: 2, price: 5000, subtotal: 10000 },
          { productId: products[65]._id, productName: products[65].name, quantity: 1, price: 12000, subtotal: 12000 },
        ],
        totalAmount: 50000,
        cashPaid: 50000,
        change: 0,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        items: [
          { productId: products[5]._id, productName: products[5].name, quantity: 5, price: 3000, subtotal: 15000 },
          { productId: products[15]._id, productName: products[15].name, quantity: 2, price: 5000, subtotal: 10000 },
          { productId: products[24]._id, productName: products[24].name, quantity: 4, price: 1000, subtotal: 4000 },
          { productId: products[33]._id, productName: products[33].name, quantity: 1, price: 14000, subtotal: 14000 },
        ],
        totalAmount: 43000,
        cashPaid: 50000,
        change: 7000,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        items: [
          { productId: products[70]._id, productName: products[70].name, quantity: 1, price: 60000, subtotal: 60000 },
          { productId: products[75]._id, productName: products[75].name, quantity: 2, price: 5000, subtotal: 10000 },
          { productId: products[80]._id, productName: products[80].name, quantity: 1, price: 22000, subtotal: 22000 },
        ],
        totalAmount: 92000,
        cashPaid: 100000,
        change: 8000,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
      {
        items: [
          { productId: products[3]._id, productName: products[3].name, quantity: 3, price: 3500, subtotal: 10500 },
          { productId: products[13]._id, productName: products[13].name, quantity: 2, price: 4500, subtotal: 9000 },
          { productId: products[26]._id, productName: products[26].name, quantity: 5, price: 2500, subtotal: 12500 },
        ],
        totalAmount: 32000,
        cashPaid: 50000,
        change: 18000,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
      {
        items: [
          { productId: products[45]._id, productName: products[45].name, quantity: 1, price: 17000, subtotal: 17000 },
          { productId: products[48]._id, productName: products[48].name, quantity: 2, price: 7500, subtotal: 15000 },
          { productId: products[52]._id, productName: products[52].name, quantity: 1, price: 70000, subtotal: 70000 },
        ],
        totalAmount: 102000,
        cashPaid: 100000,
        change: 0,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    ]);
    console.log(`📤 Created ${transactions.length} transaction records`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: 1`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Purchases: ${purchases.length}`);
    console.log(`   - Transactions: ${transactions.length}`);
    console.log('\n🔐 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

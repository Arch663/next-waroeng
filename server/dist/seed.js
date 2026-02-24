"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("./models/User");
const Category_1 = require("./models/Category");
const Product_1 = require("./models/Product");
const Supplier_1 = require("./models/Supplier");
dotenv_1.default.config();
const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        // Clear existing data
        await Promise.all([
            User_1.User.deleteMany({}),
            Category_1.Category.deleteMany({}),
            Product_1.Product.deleteMany({}),
            Supplier_1.Supplier.deleteMany({}),
        ]);
        console.log('🗑️  Cleared existing data');
        // Create admin user
        const adminUser = await User_1.User.create({
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            email: 'admin@waroeng.com',
            fullName: 'Administrator',
        });
        console.log('👤 Created admin user (username: admin, password: admin123)');
        // Create categories
        const categories = await Category_1.Category.insertMany([
            { name: 'Makanan' },
            { name: 'Minuman' },
            { name: 'Snack' },
            { name: 'Kebutuhan Pokok' },
            { name: 'Elektronik' },
        ]);
        console.log('📦 Created categories');
        // Create suppliers
        const suppliers = await Supplier_1.Supplier.insertMany([
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
        ]);
        console.log('🏭 Created suppliers');
        // Create products with SKU, costPrice, and unit
        const products = await Product_1.Product.insertMany([
            {
                name: 'Nasi Goreng',
                sku: 'PRD-20250101-0001',
                costPrice: 8000,
                price: 15000,
                stock: 50,
                unit: 'pcs',
                categoryId: categories[0]._id,
                image: '',
            },
            {
                name: 'Mie Goreng',
                sku: 'PRD-20250101-0002',
                costPrice: 6000,
                price: 12000,
                stock: 45,
                unit: 'pcs',
                categoryId: categories[0]._id,
                image: '',
            },
            {
                name: 'Es Teh Manis',
                sku: 'PRD-20250101-0003',
                costPrice: 2500,
                price: 5000,
                stock: 100,
                unit: 'bottle',
                categoryId: categories[1]._id,
                image: '',
            },
            {
                name: 'Es Jeruk',
                sku: 'PRD-20250101-0004',
                costPrice: 3000,
                price: 6000,
                stock: 80,
                unit: 'bottle',
                categoryId: categories[1]._id,
                image: '',
            },
            {
                name: 'Kopi Hitam',
                sku: 'PRD-20250101-0005',
                costPrice: 2000,
                price: 4000,
                stock: 60,
                unit: 'cup',
                categoryId: categories[1]._id,
                image: '',
            },
            {
                name: 'Keripik Kentang',
                sku: 'PRD-20250101-0006',
                costPrice: 5000,
                price: 8000,
                stock: 30,
                unit: 'pack',
                categoryId: categories[2]._id,
                image: '',
            },
            {
                name: 'Coklat Batang',
                sku: 'PRD-20250101-0007',
                costPrice: 6000,
                price: 10000,
                stock: 40,
                unit: 'pcs',
                categoryId: categories[2]._id,
                image: '',
            },
            {
                name: 'Biskuit',
                sku: 'PRD-20250101-0008',
                costPrice: 4000,
                price: 7000,
                stock: 55,
                unit: 'pack',
                categoryId: categories[2]._id,
                image: '',
            },
            {
                name: 'Minyak Goreng 1L',
                sku: 'PRD-20250101-0009',
                costPrice: 18000,
                price: 25000,
                stock: 20,
                unit: 'bottle',
                categoryId: categories[3]._id,
                image: '',
            },
            {
                name: 'Gula Pasir 1kg',
                sku: 'PRD-20250101-0010',
                costPrice: 10000,
                price: 14000,
                stock: 25,
                unit: 'pack',
                categoryId: categories[3]._id,
                image: '',
            },
            {
                name: 'Beras 5kg',
                sku: 'PRD-20250101-0011',
                costPrice: 50000,
                price: 65000,
                stock: 15,
                unit: 'pack',
                categoryId: categories[3]._id,
                image: '',
            },
            {
                name: 'Baterai AA',
                sku: 'PRD-20250101-0012',
                costPrice: 3000,
                price: 5000,
                stock: 100,
                unit: 'pcs',
                categoryId: categories[4]._id,
                image: '',
            },
            {
                name: 'Lampu LED',
                sku: 'PRD-20250101-0013',
                costPrice: 10000,
                price: 15000,
                stock: 8,
                unit: 'pcs',
                categoryId: categories[4]._id,
                image: '',
            },
        ]);
        console.log('🛒 Created products');
        console.log('\n✅ Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Users: 1`);
        console.log(`   - Categories: ${categories.length}`);
        console.log(`   - Suppliers: ${suppliers.length}`);
        console.log(`   - Products: ${products.length}`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};
seedDatabase();
//# sourceMappingURL=seed.js.map
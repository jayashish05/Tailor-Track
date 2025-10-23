const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Admin Schema (must match your Admin model)
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

async function createAdmin() {
  try {
    console.log('\n🔧 New Admin Creation Script\n');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get admin details
    const username = await new Promise(resolve => {
      rl.question('Enter admin username: ', resolve);
    });

    const email = await new Promise(resolve => {
      rl.question('Enter admin email: ', resolve);
    });

    const password = await new Promise(resolve => {
      rl.question('Enter admin password (min 6 characters): ', resolve);
    });

    const name = await new Promise(resolve => {
      rl.question('Enter admin full name: ', resolve);
    });

    // Validate
    if (!username || !email || !password || !name) {
      console.error('\n❌ Username, email, password, and name are required!');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('\n❌ Password must be at least 6 characters!');
      process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('\n❌ Invalid email format!');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username: username.trim() }, { email: email.trim() }]
    });

    if (existingAdmin) {
      if (existingAdmin.username === username.trim()) {
        console.log(`\n❌ Error: Username "${username}" already exists!`);
      }
      if (existingAdmin.email === email.trim()) {
        console.log(`\n❌ Error: Email "${email}" already exists!`);
      }
      console.log('\n💡 Please run the script again with different credentials.\n');
      process.exit(1);
    }

    // Hash password
    console.log('\n🔐 Creating admin account...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await Admin.create({
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword,
      name: name.trim(),
      role: 'admin',
      isActive: true,
    });

    console.log('\n✅ Admin created successfully!');
    console.log('\n📋 Admin Details:');
    console.log('==================');
    console.log('Username:', admin.username);
    console.log('Email:', admin.email);
    console.log('Name:', admin.name);
    console.log('Role:', admin.role);
    console.log('Status:', admin.isActive ? 'Active' : 'Inactive');
    console.log('ID:', admin._id);
    console.log('\n✨ You can now login with these credentials at /admin/login\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();

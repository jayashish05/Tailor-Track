const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

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

async function listAdmins() {
  try {
    console.log('\n🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const admins = await Admin.find({}).select('-password').sort({ createdAt: -1 });

    if (admins.length === 0) {
      console.log('📭 No admins found in the database.\n');
      process.exit(0);
    }

    console.log(`📋 Total Admins: ${admins.length}\n`);
    console.log('==========================================\n');

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Admin Details:`);
      console.log('   ----------------');
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Status: ${admin.isActive ? '🟢 Active' : '🔴 Inactive'}`);
      console.log(`   Created: ${admin.createdAt.toLocaleString()}`);
      console.log(`   ID: ${admin._id}`);
      console.log('');
    });

    console.log('==========================================\n');

  } catch (error) {
    console.error('\n❌ Error listing admins:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed\n');
    process.exit(0);
  }
}

// Run the script
listAdmins();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
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

async function deleteAdmin() {
  try {
    console.log('\n🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // List all admins first
    const admins = await Admin.find({}).select('-password').sort({ createdAt: -1 });

    if (admins.length === 0) {
      console.log('📭 No admins found in the database.\n');
      process.exit(0);
    }

    if (admins.length === 1) {
      console.log('⚠️  Warning: Only one admin exists!');
      console.log('   Deleting the last admin will leave your system without any admin access.\n');
    }

    console.log(`📋 Current Admins (${admins.length}):\n`);
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.username} (${admin.name}) - ${admin.email}`);
    });
    console.log('');

    // Ask which admin to delete
    const usernameToDelete = await new Promise(resolve => {
      rl.question('Enter the username of the admin to delete: ', resolve);
    });

    if (!usernameToDelete || usernameToDelete.trim() === '') {
      console.log('\n❌ No username provided. Operation cancelled.\n');
      process.exit(0);
    }

    // Find the admin
    const adminToDelete = await Admin.findOne({ username: usernameToDelete.trim() });

    if (!adminToDelete) {
      console.log(`\n❌ Admin with username "${usernameToDelete}" not found.\n`);
      process.exit(1);
    }

    // Show details and confirm
    console.log('\n⚠️  You are about to delete this admin:\n');
    console.log(`   Username: ${adminToDelete.username}`);
    console.log(`   Email: ${adminToDelete.email}`);
    console.log(`   Name: ${adminToDelete.name}`);
    console.log('');

    const confirmation = await new Promise(resolve => {
      rl.question('Are you sure you want to delete this admin? (yes/no): ', resolve);
    });

    if (confirmation.toLowerCase() !== 'yes' && confirmation.toLowerCase() !== 'y') {
      console.log('\n❌ Operation cancelled.\n');
      process.exit(0);
    }

    // Delete the admin
    await Admin.deleteOne({ _id: adminToDelete._id });

    console.log('\n✅ Admin deleted successfully!\n');
    console.log(`   Deleted: ${adminToDelete.username} (${adminToDelete.name})\n`);

    // Show remaining admins
    const remainingAdmins = await Admin.countDocuments();
    console.log(`📊 Remaining admins: ${remainingAdmins}\n`);

    if (remainingAdmins === 0) {
      console.log('⚠️  WARNING: No admins remain in the system!');
      console.log('   Run "node scripts/createAdmin.js" to create a new admin.\n');
    }

  } catch (error) {
    console.error('\n❌ Error deleting admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed\n');
    process.exit(0);
  }
}

// Run the script
deleteAdmin();

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../api/models/Admin');

const createFirstAdmin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if any admin exists
    const existingAdmin = await Admin.findOne();
    
    if (existingAdmin) {
      console.log('⚠️  An admin already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log('\n❓ Do you want to create another admin? (Press Ctrl+C to cancel)');
      
      // Wait 3 seconds before proceeding
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Create first admin
    const adminData = {
      username: 'admin',
      email: 'admin@tailortrack.com',
      password: 'admin123', // Change this password after first login!
      name: 'Admin User',
      role: 'super_admin',
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log('\n✅ Admin created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🔗 Login URL: http://localhost:3002/admin/login');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
      console.error('\n❌ Error: Admin with this username or email already exists');
      console.log('\n💡 Try using different credentials or delete existing admin first');
    } else {
      console.error('\n❌ Error creating admin:', error.message);
    }
    process.exit(1);
  }
};

createFirstAdmin();

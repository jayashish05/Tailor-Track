require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['customer', 'staff', 'admin'], default: 'customer' },
  phone: String,
  businessName: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('\n🔧 Admin Creation Script\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get admin details
    const email = await new Promise(resolve => {
      rl.question('Enter admin email: ', resolve);
    });

    const password = await new Promise(resolve => {
      rl.question('Enter admin password (min 6 characters): ', resolve);
    });

    const name = await new Promise(resolve => {
      rl.question('Enter admin name: ', resolve);
    });

    const phone = await new Promise(resolve => {
      rl.question('Enter admin phone (optional): ', resolve);
    });

    // Validate
    if (!email || !password || !name) {
      console.error('❌ Email, password, and name are required!');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters!');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('\n⚠️  User already exists!');
      const update = await new Promise(resolve => {
        rl.question('Update to admin role? (yes/no): ', resolve);
      });

      if (update.toLowerCase() === 'yes' || update.toLowerCase() === 'y') {
        existingUser.role = 'admin';
        existingUser.name = name;
        if (phone) existingUser.phone = phone;
        existingUser.password = await bcrypt.hash(password, 10);
        await existingUser.save();
        console.log('\n✅ User updated to admin role!');
      } else {
        console.log('\n❌ Operation cancelled');
        process.exit(0);
      }
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin user
      const admin = await User.create({
        email,
        password: hashedPassword,
        name,
        phone: phone || undefined,
        role: 'admin',
        isActive: true,
      });

      console.log('\n✅ Admin user created successfully!');
      console.log('\nAdmin Details:');
      console.log('==============');
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('Role:', admin.role);
      console.log('ID:', admin._id);
    }

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();

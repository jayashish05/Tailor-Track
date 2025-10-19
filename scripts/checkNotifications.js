const mongoose = require('mongoose');
require('dotenv').config();

const Notification = require('../api/models/Notification');
const User = require('../api/models/User');

async function checkNotifications() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if notifications collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasNotificationsCollection = collections.some(col => col.name === 'notifications');
    
    console.log('\n📚 Available Collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    if (!hasNotificationsCollection) {
      console.log('\n⚠️  "notifications" collection does NOT exist in database');
      console.log('   Creating collection by inserting a test document...');
      
      // Find a customer user to test with
      const customerUser = await User.findOne({ role: 'customer' });
      
      if (customerUser) {
        const testNotification = await Notification.create({
          type: 'admin_broadcast',
          title: 'Test Notification',
          message: 'This is a test notification to verify the collection is created.',
          recipient: customerUser._id,
          metadata: {
            sentBy: 'System',
            sentAt: new Date(),
          },
        });
        
        console.log('✅ Test notification created:', testNotification._id);
      } else {
        console.log('❌ No customer users found to create test notification');
      }
    } else {
      console.log('\n✅ "notifications" collection EXISTS in database');
    }

    // Count notifications
    const totalNotifications = await Notification.countDocuments();
    console.log(`\n📊 Total Notifications: ${totalNotifications}`);

    // Get sample notifications
    if (totalNotifications > 0) {
      console.log('\n📬 Recent Notifications:');
      const recentNotifications = await Notification.find()
        .populate('recipient', 'name email role')
        .sort({ createdAt: -1 })
        .limit(5);

      recentNotifications.forEach((notif, index) => {
        console.log(`\n${index + 1}. ${notif.title}`);
        console.log(`   Type: ${notif.type}`);
        console.log(`   Recipient: ${notif.recipient?.name || notif.recipient?.email} (${notif.recipient?.role})`);
        console.log(`   Read: ${notif.isRead ? 'Yes' : 'No'}`);
        console.log(`   Created: ${notif.createdAt}`);
      });
    } else {
      console.log('\n⚠️  No notifications found in database');
      console.log('   Try sending a broadcast notification from admin panel');
    }

    // Check customer users
    const customerCount = await User.countDocuments({ role: 'customer' });
    console.log(`\n👥 Total Customer Users: ${customerCount}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkNotifications();

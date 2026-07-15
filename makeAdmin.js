require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node makeAdmin.js <email>');
  process.exit(1);
}

async function makeAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ User "${user.name}" (${user.email}) is now role: ${user.role}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

makeAdmin();

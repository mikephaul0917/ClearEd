const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const User = mongoose.connection.collection('users');
  const StudentProfile = mongoose.connection.collection('studentprofiles');
  
  const student = await User.findOne({ email: 'student@dummy.edu' });
  console.log('User:', student);
  
  if (student) {
    const profile = await StudentProfile.findOne({ userId: student._id });
    console.log('StudentProfile:', profile);
  }
  
  process.exit(0);
}

check();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || '', { dbName: 'e-clearance' });
        const hashedPassword = await bcrypt.hash('Phaul123!', 12);

        await mongoose.connection.db.collection('users').updateOne(
            { email: 'admin@dummy.edu' },
            { $set: { password: hashedPassword } }
        );

        await mongoose.connection.db.collection('users').updateOne(
            { email: 'superadmin@eclearance.system' },
            { $set: { password: hashedPassword } }
        );

        console.log('Passwords for admin@dummy.edu and superadmin@eclearance.system have been reset to Phaul123!');
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();

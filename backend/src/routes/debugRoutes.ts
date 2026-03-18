/**
 * Debug endpoint to check Super Admin account
 */

import express from 'express';
import User from '../models/User';
import mongoose from 'mongoose';

const router = express.Router();

// Debug endpoint to check Super Admin account
router.get('/debug-super-admin', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking Super Admin account...');
    
    // Check database connection
    const dbState = mongoose.connection.readyState;
    console.log('Database state:', dbState);
    
    // Try to find Super Admin
    const superAdmin = await User.findOne({ 
      email: "superadmin@eclearance.system" 
    });
    
    if (superAdmin) {
      console.log('✅ Super Admin found:', {
        email: superAdmin.email,
        role: superAdmin.role,
        enabled: superAdmin.enabled,
        id: superAdmin._id
      });
      
      res.json({
        success: true,
        message: 'Super Admin account found',
        data: {
          email: superAdmin.email,
          role: superAdmin.role,
          enabled: superAdmin.enabled,
          id: superAdmin._id
        }
      });
    } else {
      console.log('❌ Super Admin NOT found');
      
      // Check if any users exist
      const userCount = await User.countDocuments();
      const allUsers = await User.find({}, { email: 1, role: 1, enabled: 1 }).limit(5);
      
      res.json({
        success: false,
        message: 'Super Admin account not found',
        debug: {
          userCount,
          sampleUsers: allUsers
        }
      });
    }
    
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

export default router;

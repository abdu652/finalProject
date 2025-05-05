import User from '../models/user.model.js';
import mongoose from 'mongoose';  
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateEmail } from '../helpers/userUtils.js';

const signup = async (req, res) => {
  try {
    const { name, email, password, salary, status, role, assignments, phone } = req.body;
    // Validation
    if (!name || !email || !password || salary === undefined) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email, password and salary are required fields' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      name,
      email,
      password: hashedPassword,
      phone: phone || '', 
      salary,
      role: role || 'worker',
      status: {
        availability: status?.availability || 'available',
        lastActive: Date.now()
      },
      assignments: assignments || []
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        token
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last active
    user.status.lastActive = new Date();
    await user.save();

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return response without password
    const { password: _, ...userData } = user.toObject();
    return res.json({ token, user: userData });

  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, status, password,salary } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    if(salary) user.salary = salary;
    if (password) user.password = await bcrypt.hash(password, 12);
    
    await user.save();

    // Remove password before sending response
    const userData = user.toObject();
    delete userData.password;

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userData
    });

  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User found',
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    
    return res.status(200).json({
      success: true,
      message: 'Users found',
      data: users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { signin, signup, getAllUsers, getUser, updateUser, deleteUser };
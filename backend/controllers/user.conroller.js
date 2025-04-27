import User from '../models/user.model.js';
import mongoose from 'mongoose';  
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {validateEmail} from '../helpers/userUtils.js';
const signup = async (req, res) => {
  try {
    const { name, email, password, salary, status, role, assignments, phone } = req.body;
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

// Signin Controller
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last active time
    user.status.lastActive = Date.now();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Remove sensitive data before sending response
    user.password = undefined;
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone:user.phone,
          role: user.role,
          status: user.status
        }
      }
    });

  } catch (error) {
    console.error('Signin error:', error.message);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateUser = async (req,res)=>{
  const {id} = req.params;
  const {name, email, phone, role, status,password} = req.body;
  const user = await User.findById(id);
  if(!user){
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  if(!validateEmail(email)){
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }
  if(name) user.name = name;
  if(email) user.email = email;
  if(phone) user.phone = phone;
  if(role) user.role = role;
  if(status) user.status = status;
  if(password) user.password = await bcrypt.hash(password, 12);
  
  await user.save();
}

const getUser = async (req,res)=>{
  const {id} = req.params;
  const user = await User.findById(id);
  if(!user){
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
}

const getAllUsers = async (req,res)=>{
  const users = await User.find();
  if(!users){
    return res.status(404).json({
      success: false,
      message: 'No users found'
    });
  }
  return res.status(200).json({
    success: true,
    message: 'Users found',
    data: users
  });
}

const deleteUser = async (req,res)=>{
  const {id} = req.params;
  const user = await
  User.findById(id);
  if(!user){
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  await user.remove();
  return res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
}

export {signin, signup, getAllUsers, getUser, updateUser, deleteUser};
import User from '../models/user.model.js';
import mongoose from 'mongoose';  
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const signup = async (req, res) => {
    try {
        const { name, email, password, salary, status, role, assignments, phone } = req.body;

        // Validation
        if (!name || !email || !password || salary === undefined) { 
            return res.status(400).json({ message: 'Please fill all the required fields' });
        }

        if (!email.includes('@') || !email.includes('.')) {  
            return res.status(400).json({ message: 'Please enter a valid email' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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

        return res.status(201).json({
            message: 'User created successfully',
            userId: newUser._id,
            email: newUser.email  
        });

    } catch (error) {
        console.error('Signup error:', error.message);
        return res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

export default signup;

const signin = async (req,res)=>{
    try {
        console.log('Signin request body:', req.body); 
        const { email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({message:'Please fill all the required fields'})
        }
        if(!email.includes('@') || !email.includes('.')){
            return res.status(400).json({message:'Please enter a valid email'})
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message:'User not found'});
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({message:'Invalid credentials'});
        }
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET);
        res.status(200).json({
            message:'Login successful',
            token,
            user:{id:user._id,name:user.name,email:user.email,phone:user.phone}
        })
        console.log('User last active time:', user.status.lastActive); // Log the last active time
        user.status.lastActive = Date.now();
        await user.save(); // Save the updated lastActive time
        console.log('User last active time updated:', user.status.lastActive);
    } catch (err) {
        console.error('Signin error:', err);
        return res.status(500).json({ 
            message: 'Internal server error',
            error: err.message 
        });
    }
}

export {signin} 
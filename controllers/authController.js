import User from "../models/userModels.js";
import jwt from 'jsonwebtoken'
import bcrypt from "bcryptjs";


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
}


export const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }
        const user = await User.create({
            name,
            email,
            password,
            role,
        });
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                // FIX: Include all profile fields for client persistence
                photoUrl: user.photoUrl,
                resumeUrl: user.resumeUrl,
                skills: user.skills,
                expectedSalary: user.expectedSalary,
                website: user.website,
                contactInfo: user.contactInfo,
                officeAddress: user.officeAddress,
                description: user.description,
            });
        }
        else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });

    }
};

export const getUsersByRole = async (req, res) => {
    const { role } = req.query;

    if (!['seeker', 'company', 'admin'].includes(role)) {
        res.status(400);
        throw new Error('Invalid user role specified.');
    }

    const users = await User.find({ role }).select('-password').sort({ name: 1 });

    res.json(users);
};


export const loginUser = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please provide both email and password" });
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    if (!user.password) return res.status(500).json({ message: "User password missing in DB" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

  
    if (user.role !== role && user.role !== 'admin') {
      return res.status(401).json({ message: "Unauthorized: Role mismatch" });
    }

    const finalRole = user.role;

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: finalRole, 
      token: generateToken(user._id),
      photoUrl: user.photoUrl,
      resumeUrl: user.resumeUrl,
      skills: user.skills,
      expectedSalary: user.expectedSalary,
      website: user.website,
      contactInfo: user.contactInfo,
      officeAddress: user.officeAddress,
      description: user.description,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserProfile = (req, res) => {
 
    res.json(req.user.toObject());
};

export const updateUserProfile =async (req, res) => {
    const user = await User.findById(req.user._id);
    if(!user){
        return res.status(401).json({message : 'User Not Found'});
    }

    try{
     if(user){
         user.name = req.body.name || user.name;
         user.email =req.body.email || user.email;
         
        if (req.body.hasOwnProperty('logo')) {
            user.photoUrl = req.body.logo;
        } else if (req.body.hasOwnProperty('photoUrl')) {
            user.photoUrl = req.body.photoUrl;
        }
         
         user.resumeUrl = req.body.hasOwnProperty('resumeUrl') ? req.body.resumeUrl : user.resumeUrl;
         
       if (req.body.skills && typeof req.body.skills === 'string') {
            user.skills = req.body.skills.split(',').map(s => s.trim());
         } else if (Array.isArray(req.body.skills)) {
             user.skills = req.body.skills;
         } else if (req.body.hasOwnProperty('skills')) {
             user.skills = req.body.skills;
         }
         user.expectedSalary = req.body.hasOwnProperty('expectedSalary') ? req.body.expectedSalary : user.expectedSalary;
         
         user.website = req.body.hasOwnProperty('website') ? req.body.website : user.website;
         user.contactInfo = req.body.hasOwnProperty('contactInfo') ? req.body.contactInfo : user.contactInfo;
         user.officeAddress = req.body.hasOwnProperty('officeAddress') ? req.body.officeAddress : user.officeAddress;
         user.description = req.body.hasOwnProperty('description') ? req.body.description : user.description;
         if(req.body.password){
             user.password = req.body.password;
         }

         const updatedUser = await user.save();
         
     res.json({
             _id : updatedUser._id,
             name: updatedUser.name,
             email: updatedUser.email,
             role: updatedUser.role,
             token : generateToken(updatedUser._id),
             photoUrl : updatedUser.photoUrl,
             resumeUrl : updatedUser.resumeUrl,
             skills : updatedUser.skills, 
             expectedSalary : updatedUser.expectedSalary,
             website : updatedUser.website,
             contactInfo : updatedUser.contactInfo,
             officeAddress : updatedUser.officeAddress,
             description : updatedUser.description,
             message : "User Updated"
         })
     }

     else{
         res.status(401).json({message : "User Not Found"});
     }
    }catch(error){
     if(error.code=== 11000){
         return res.status(400).json({message : "A user with this email already exists."})
     }
     res.status(500).json({message : `Server error during profile update ${error.message}`})
    }
    
};

export const getAllUsers = async (req , res)=>{
    try{
        const users = await User.find({}).select('-password').sort({createdAt : -1});
        res.json(users)
    }catch(error){
        res.status(500).json({message : "server error : failed to fetch users "})
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed successfully' });
        } else {
            // Correctly handles valid ID format but no matching user
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        // Correctly handles invalid ID format (CastError)
        if (error.name === 'CastError') {
            return res.status(404).json({ message: 'User not found (Invalid ID format)' });
        }
        
        // Fallback for true server errors
        res.status(500).json({ message: 'Server error: Failed to delete user' });
    }
};
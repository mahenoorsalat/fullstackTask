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

    // Fetch users, excluding the password field for security
    const users = await User.find({ role }).select('-password').sort({ name: 1 });

    res.json(users);
};




export const loginUser = async (req, res) => {

    const { email, password, role } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (user && (await bcrypt.compare(password, user.password))) {
            if (user.role !== role) {
                return res.status(401).json({ message: "Unauthorized: Role mismatch" });
            }
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        }
        else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getUserProfile = (req, res) => {
    res.send("Get User Profile");
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
        user.photoUrl = req.body.photoUrl || user.photoUrl;
        user.resumeUrl = req.body.resumeUrl || user.resumeUrl;
        user.skills = req.body.skills || user.skills;
        user.expectedSalary = req.body.expectedSalary || user.expectedSalary;

        if(req.body.password){
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json({
            id : updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role:updatedUser.role,
            token : generateToken(updatedUser._id),
            photoUrl : updateUserProfile.photoUrl , 
            resumeUrl : updateUserProfile.resumeUrl,
            skills : updateUserProfile.skills , 
            expectedSalary : updateUserProfile.expectedSalary , 
            message : "User Updated"
        })
    }

    else{
        res.status(401).json({message : "User Not Found"});
    }
   }catch(error){
    if(error.code=== 11000){
        return res.status(400).json({message : "A user with this email already exists or the email field is required."})
    }
    res.status(500).json({message : `Server error during profile update ${error.message}`})
   }
    
};

import User from "../models/userModels.js";


const generateToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:'30d',
    });
    }


    export const registerUser=async(req,res)=>{
        const{name,email,password,role}=req.body;
        try{
            const userExists=await User.findOne({email});
            if(userExists){
                return  res.status(400).json({message:"User already exists"});
            }
            const user=await User.create({
                name,
                email,  
                password,
                role,
            });
            if(user){
                res.status(201).json({
                    _id:user._id,
                    name:user.name,
                    email:user.email,
                    role:user.role,
                    token:generateToken(user._id),
                });
            }
            else{
                res.status(400).json({message:"Invalid user data"});
            }
        }catch(error){
            res.status(500).json({message:"Server error"});

        }
    };
    




    export const loginUser=async(req,res)=>{
        const{email,password}=req.body;
        try{
            const user=await User.findOne({email});
            if(user && (await bcrypt.compare(password,user.password))){
                if(user.role!==role){
                        return res.status(401).json({message:"Unauthorized: Role mismatch"});
                }
                res.json({  
                    _id:user._id,
                    name:user.name,
                    email:user.email,
                    role:user.role,
                    token:generateToken(user._id),
                });
            }
            else{
                res.status(401).json({message:"Invalid email or password"});
            }
        }catch(error){
            res.status(500).json({message:"Server error"});
        }
    };

export const getUserProfile=(req,res)=>{
    res.send("Get User Profile");
};
export const updateUserProfile=(req,res)=>{
    res.send("Update User Profile");
};

import User from "../models/userModels.js";
import jwt from 'jsonwebtoken'

export const protect = async(req , res , next)=>{
    let token ; 
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try{
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token , process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();

        }catch(error){
            res.status(401);
            throw new Error('Not authorized , token failed');
        }
    };


    if(!token){
        res.status(401);
        throw new Error('Not authorized , no token');
    }
}


export const role = (...roles) =>{
    return (req , res , next) =>{
        if(!roles.includes(req.user.role)){
            res.status(403);
            throw new Error('User role not authorized to access this route');
        }
        next();
    }
}
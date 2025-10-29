import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = mongoose.Schema(
    {
        name: {
            type: String,   
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role:{
            type: String,
            enum :['admin' , 'company' , 'seeker'],
            required: true,
        },
 
    } , {timestamps: true});

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model("User", UserSchema);

export default User;
        
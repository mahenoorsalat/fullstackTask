import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId , 
        ref:"User" , 
        required : true
    } , 
    type : {
        type : String , 
        enum : ['like' , 'love' , 'dislike'],
        required : true
    }
});

const commentSchema = new mongoose.Schema({
    authorId : {
        type : mongoose.Schema.Types.ObjectId , 
        ref : 'User' , 
        required : true 
    },
    authorName : {
        type : String , 
        required : true
    },
    content : {
        type : String  , 
        required : true
    },
    authorPhotoUrl : {
        type : String, 
        default : 'https://via.placeholder.com/150'
    },
    timestamp:{
        type : Date , 
        default : Date.now
    }
});


const blogSchema = new mongoose.Schema({
    authorId : {
        type : mongoose.Schema.Types.ObjectId, 
        ref : "User" , 
        required : true 
    } , 
    authorRole : {
        type : String , 
        enum : ['seeker' , 'company' , 'admin'],
        required : true 
    },
    authorName : {
  type : String , 
  required : true
    },
     content : {
        type : String  , 
        required : true
    },
    authorPhotoUrl : {
        type : String, 
    },
   comments:[commentSchema],
   reactions:[reactionSchema]
},{
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
})

const BlogPost = mongoose.model('BlogPost' , blogSchema);
export default BlogPost;
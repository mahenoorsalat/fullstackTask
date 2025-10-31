import mongoose from "mongoose";


const jobSchema = new mongoose.Schema({
    
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        location:{
            type: String,
            required: true,
        
        },
        salaryMin: {
            type: Number,
            required: true,
            min: 0,
        },
        salaryMax: {
            type: Number,
            required: true,
            min: 0,
        },
        locationType: {
            type: String,
            enum: ['On-site', 'Remote', 'Hybrid'],
            required: true,
        },
        jobType: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
            required: true,
        },
        experienceLevel: {
            type: String,
            required: true,
        },
    
        employerId:{
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User',
            required : true,
        }

        } , {
            timestamps:true,
            // FIX: Add toJSON configuration to map _id to id for the frontend
            toJSON: {
                virtuals: true,
                transform: (doc, ret) => {
                    ret.id = ret._id.toString();
                    delete ret._id;
                    delete ret.__v;
                }
            }
        }); // CHANGED: Added schema options

const Job = mongoose.model('Job', jobSchema);
export default Job;
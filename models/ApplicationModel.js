import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
    },
        seekerId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status:{
        type: String,
        enum: ['Shortlisted', 'Interviewed', 'Hired', 'Rejected'],
        default: 'Applied',
    }
});

const Application = mongoose.model('Application', applicationSchema);
export default Application;
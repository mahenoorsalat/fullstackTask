
import Application from "../models/ApplicationModel.js";
import Job from "../models/jobModels.js";
import User from "../models/userModels.js";

export const applyToJob = async (req, res) => {
    if (req.user.role !== 'seeker') {
        res.status(403)
        throw new Error('Only job seekers can apply to this job')
    }
    
    const jobId = req.params.jobId; 

    const seekerId = req.user._id;
    const job = await Job.findById(jobId);

    if (!job) {
        res.status(404);
        throw new Error('Job not found'); 
    }
    
    const existingApplication = await Application.findOne({ jobId, seekerId });
    if (existingApplication) {
        res.status(400);
        throw new Error('You have already applied to this job');
    }

    const application = await Application.create({
        jobId,
        seekerId,
        status: 'Shortlisted' 
    })

    await Job.findByIdAndUpdate(jobId, {
        $addToSet: { applicants: seekerId } 
    }, { new: true });
    
    await User.findByIdAndUpdate(seekerId, {
        $addToSet: { appliedJobs: jobId } 
    }, { new: true });

    res.status(201).json({
        message: 'Application submitted successfully ', application
    })
};

export const getSeekerApplications = async (req, res) => {
    if (req.user.role !== 'seeker') {
        res.status(403)
        throw new Error('Only job seekers can view their own applications');
    }

    const applications = await Application.find({ seekerId: req.user._id })
        .populate({
            path: 'jobId',
            select: 'title location salaryMin salaryMax',
            populate: {
                path: 'employerId',
                select: 'name logo'
            }
        })
        .sort({ createdAt: -1 })
    res.send(applications)
};

export const getApplicationForJob = async (req, res) => {
    if (req.user.role !== 'company') {
        res.status(403)
throw new Error('Only companies can view applications for this job')    }

    const jobId = req.params.id;

    const job = await Job.findById(jobId)
    if (!job || job.employerId.toString() !== req.user._id.toString()) {
        res.status(404);
        throw new Error('Job not found or unauthorized access');
    }

    const applications = await Application.find({ jobId })
        .populate({
            path: 'seekerId',
            select: 'name email photoUrl resumeUrl skills expectedSalary',

        })
        .sort({ createdAt: -1 })
    res.send(applications)
};

export const updateApplication = async (req, res) => {
    const { status } = req.body;

    const application = await Application.findById(req.params.id).populate('jobId');

    if (!application) {
        res.status(404);
        throw new Error('Application not found');
    }



    if (
        application.jobId.employerId.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
    ) {
        res.status(403);
        throw new Error('Not authorized to update this application status');
    }


    const validStatuses = ['Shortlisted', 'Interviewed', 'Hired', 'Rejected'];
    if (!validStatuses.includes(status)) {
        res.status(400)
        throw new Error(`Invalid Status : Must be one of the ${validStatuses.join(', ')}`)
    }

    application.status = status;
    const updatedApplication = await application.save();
    res.json(updatedApplication)

}

// export const getApplicationsForCompany = async (req , res) =>{
//     const company
// }
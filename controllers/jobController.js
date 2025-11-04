import Job from "../models/jobModels.js";
import User from "../models/userModels.js"; 
import Application from "../models/ApplicationModel.js";

export const getJobs = async(req,res)=>{
    // FIX 1: Removed 'location', Added 'experienceLevel'
    const {keyword , type , minSalary, companyName, experienceLevel }  = req.query; 
    const query = {};
    
    // 1. Company Name Filter (Correct)
    if (companyName) {
        const matchingEmployers = await User.find({
            role: 'company',
            name: { $regex: companyName, $options: 'i' }
        }).select('_id');

        const employerIds = matchingEmployers.map(employer => employer._id);

        if (employerIds.length > 0) {
            query.employerId = { $in: employerIds };
        } else {
            // This ensures no jobs are returned if no company name matches
            query.employerId = null;
        }
    }

    // FIX 2: Keyword Filter: Search Title OR Location using $or
    if(keyword){
        query.$or = [
            { title: { $regex: keyword, $options: 'i' } },
            { location: { $regex: keyword, $options: 'i' } }
        ];
    }
    
    // 3. Job Type Filter (Correct)
    if(type){
        query.jobType = type;
    };
    
    // 4. Min Salary Filter (Correct)
    if(minSalary){
        query.salaryMin = { $gte : Number(minSalary)}
    };

    // FIX 3: Experience Level Filter (NEW)
    if(experienceLevel){
        query.experienceLevel = experienceLevel;
    }

    const jobs = await Job.find(query)
    .populate({
        path : 'employerId',
        select:'name email logo'
    })
    .sort({created: -1})
    res.json(jobs);
};

export const getJobById = async(req , res) =>{
    const job = await Job.findById(req.params.id).populate('employerId');

    if(job){
        res.json(job);
    }else{
        res.status(404);
        throw new Error('Job Not Found ')
    }
};


export const createJob = async(req , res)=>{
    if(req.user.role !== 'company'){
        res.status(403)
        throw new Error('Only Employers can post job!')
    }

    const {title , description , location , experienceLevel , salaryMin , salaryMax , jobType , locationType } = req.body;

    const job = new Job({
        title , 
        description , 
        location , 
        experienceLevel , 
        salaryMax , 
        salaryMin , 
        jobType , 
        locationType ,
        employerId : req.user._id , 
    })

    const createdJob = await job.save()
    res.status(201).json(createdJob);

}

export const updateJob = async (req , res )=>{
    const job = await Job.findById(req.params.id);
   if(job){
     if(job.employerId.toString() !== req.user._id.toString()){
        res.status(403)
        throw new Error('Not authorized to update this job post')
    }
    job.title = req.body.title || job.title;
        job.description = req.body.description || job.description;
        job.location = req.body.location || job.location;
        job.experienceLevel = req.body.experienceLevel || job.experienceLevel;
        job.salaryMin = req.body.salaryMin || job.salaryMin;
        job.salaryMax = req.body.salaryMax || job.salaryMax;
        job.jobType = req.body.jobType || job.jobType;
        job.locationType = req.body.locationType || job.locationType;

        const updatedJob = await job.save()
        res.json(updatedJob)
   } else{
res.status(404);
        throw new Error('Job not found');
   }
}

export const deleteJob = async(req , res)=>{
    const job = await Job.findById(req.params.id);

    if(job){
        const isOwner = job.employerId.toString() === req.user._id.toString();

        if(req.user.role === 'admin' || isOwner){
          await job.deleteOne(); 
          await Application.deleteMany({ jobId: req.params.id }); 
          res.json('Job and all associated applications removed successfully')
        }
        else{
            res.status(403)
            throw new Error('Not authorized to delete this job')
        }
    }
    else{
        res.status(404);
        throw new Error('Job not found');
   };
};

export const getEmployerJobs = async (req , res)=>{
    const jobs = await Job.find({employerId : req.user._id}).sort({createdAt : -1});
    res.json(jobs)
}


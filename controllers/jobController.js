import Job from "../models/jobModels.js";

export const getJobs = async(req,res)=>{
    const {keyword , location , type , minSalary }  = req.query;
    const query = {};
    if(keyword){
        query.title = {$regex : keyword  , $options : 'i'};
    };
    if(location){
        query.location = {$regex : location , $options : 'i'};
    };
    if(type){
        query.jobType = type;
    };
    if(minSalary){
        query.salaryMin = { $regex : Number(minSalary)}
    };

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
        res.job(job);
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

    const {title , description , location , experienceLevel , salaryMin , salaryMax , jobType , LocationType } = req.body;

    const job = new Job({
        title , 
        description , 
        location , 
        experienceLevel , 
        salaryMax , 
        salaryMin , 
        jobType , 
        LocationType , 
        employerId : req.user._id , 
    })

    const createdJob = await Job.bulkSave()
    res.status(201).json(createJob);

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

        const updatedJob = await Job.save()
        res.json(updatedJob)
   } else{
res.status(404);
        throw new Error('Job not found');
   }
}

export const deleteJob = async(req , res)=>{
    const job = await Job.findById(req.params.id);

    if(job){
        if(req.user.role === 'admin' || job.employerId.toString() !== req.user._id.toString()){
          await Job.deleteOne({id: job._id})
          res.json('job removed')
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
    const jobs = (await Job.find({employerId : req.user._id})).sort({createdAt : -1});
    res.json(jobs)
}
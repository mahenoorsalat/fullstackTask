import BlogPost from "../models/BlogPostModel.js";
import User from "../models/userModels.js"


// 1. Prepares the data for NEW posts and comments.
export const getUserDetails = async (userId) => {
    // FIX 1: Ensure we select company-specific fields ('description', 'website') 
    // in case 'name' is empty for companies.
    const user = await User.findById(userId).select('name email role photoUrl description website'); 

    if (!user) return null;

    let authorName;
    
    if (user.role === 'company') {
        // FIX 2: Prioritize user.name, then fallback to description, then website
        authorName = user.name || user.description || user.website || 'Unknown Company';
    } else {
        authorName = user.name || 'Anonymous User';
    }

    const photoUrl = user.photoUrl || `https://i.pravatar.cc/150?u=${user.email}`;

    return {
        authorId: user.id,
        authorName: authorName, 
        authorRole: user.role,
        authorPhotoUrl: photoUrl  
    }
};

// 2. Fetches the entire feed and ensures profile details are up-to-date.
export const getBlogPost = async (req, res) => {
    const posts = await BlogPost.find({})
        .sort({ createdAt: -1 })
        .populate({
            path: 'authorId',
            // Select all required fields
            select: 'name photoUrl description website contactInfo officeAddress email', 
        });
        
    const transformedPosts = posts.map(post => {
        const postObject = post.toObject({ virtuals: true }); 

        if (postObject.authorId) {
            const populatedUser = postObject.authorId;
            
            // FIX 3: Apply robust fallback for Name on existing posts.
            let newAuthorName = populatedUser.name;
            
            if (postObject.authorRole === 'company') {
                // Check for company name in description or website if primary name is empty.
                newAuthorName = populatedUser.name || populatedUser.description || populatedUser.website;
            }
            
            postObject.authorName = newAuthorName 
                || postObject.authorName 
                || (postObject.authorRole === 'company' ? 'Unknown Company' : 'Unknown User');

            // Robust Fallback Logic for Photo
            const emailForAvatar = populatedUser.email;
            const fallbackPhoto = `https://i.pravatar.cc/150?u=${emailForAvatar}`;
            postObject.authorPhotoUrl = populatedUser.photoUrl || postObject.authorPhotoUrl || fallbackPhoto;

            if (postObject.authorRole === 'company') {
                // Attach additional company details
                postObject.companyDescription = populatedUser.description;
                postObject.companyWebsite = populatedUser.website;
                postObject.companyContactInfo = populatedUser.contactInfo;
                postObject.companyOfficeAddress = populatedUser.officeAddress;
            }
        }
        
        delete postObject.authorId; 
        
        return postObject;
    });

    res.json(transformedPosts);
}

export const createBlogPost = async (req, res) => {
    // 💡 CHANGE 1: Destructure imageUrl from req.body to accept it from the client
    const { content, imageUrl } = req.body;
    const userDetails = await getUserDetails(req.user._id); 

    if (!userDetails) {
        res.status(401).json({ message: "User Not found" });
        return;
    }

    const newPosts = new BlogPost({
        ...userDetails, 
        content,
        // 💡 CHANGE 2: Save the provided imageUrl to the database
        imageUrl 
    });
    
    // 1. Save the raw post
    let createdPost = await newPosts.save();

    // Explicitly populate the User details after saving so the response has the current profile data.
    createdPost = await createdPost.populate({
        path: 'authorId',
        select: 'name photoUrl description website contactInfo officeAddress email',
    });

    // 2. Transform the single post document using the same robust logic as getBlogPost
    const postObject = createdPost.toObject({ virtuals: true });
    
    // Apply the profile overwrites using the populated data
    if (postObject.authorId) {
        const populatedUser = postObject.authorId;
        const emailForAvatar = populatedUser.email;
        const defaultAvatar = `https://i.pravatar.cc/150?u=${emailForAvatar}`;
        
        // FIX 4: Apply robust fallback for Name on newly created post object.
        let newAuthorName = populatedUser.name;
            
        if (postObject.authorRole === 'company') {
            newAuthorName = populatedUser.name || populatedUser.description || populatedUser.website;
        }

        postObject.authorName = newAuthorName
            || postObject.authorName 
            || (postObject.authorRole === 'company' ? 'Unknown Company' : 'Unknown User');

        postObject.authorPhotoUrl = populatedUser.photoUrl 
            || postObject.authorPhotoUrl 
            || defaultAvatar;

        if (postObject.authorRole === 'company') {
            postObject.companyDescription = populatedUser.description;
            postObject.companyWebsite = populatedUser.website;
            postObject.companyContactInfo = populatedUser.contactInfo;
            postObject.companyOfficeAddress = populatedUser.officeAddress;
        }
    }
    
    delete postObject.authorId; 
    
    // 3. Send the fully structured post to the frontend
    res.status(201).json({ 
        message: "New Blog Post Created", 
        post: postObject // <-- Sending the fully prepared postObject
    });
};

export const updateBlogPost = async (req, res) => {
    const postId = req.params.id;
    // 💡 CHANGE 3: Destructure imageUrl from req.body to allow updating it
    const { content, imageUrl } = req.body;
    const post = await BlogPost.findById(postId)
    if (!post) {
        res.status(404);
        throw new Error('Post Not Found')
    }
    if (req.user.role !== 'admin' && post.authorId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not Authorized to update this post ')
    }
    
    // Update content (original logic preserved)
    post.content = content || post.content;
    
    // 💡 CHANGE 4: Update imageUrl if it is present in the request body. 
    // This allows setting it to null or "" to clear the image.
    if (imageUrl !== undefined) {
        post.imageUrl = imageUrl;
    }
    
    const updatedPost = await post.save()
    res.json(updatedPost)
    return;
};

export const deleteBlogPost = async (req, res) => {
    const postId = req.params.id;
    const post = await BlogPost.findById(postId)
    if (!post) {
        res.status(404);
        throw new Error('Post Not Found')
    }
    if (req.user.role !== 'admin' && post.authorId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not Authorized to update this post ')
    }

    await BlogPost.findByIdAndDelete(postId);
    res.status(204).send()
};

export const addOrUpdateReactions = async (req, res) => {
    const postId = req.params.id;
    const { type } = req.body;
    
    const validReactionTypes = ['like', 'love', 'dislike'];
    if (!type || !validReactionTypes.includes(type)) {
        res.status(400); 
        throw new Error(`Invalid reaction type provided: "${type}". Must be one of: ${validReactionTypes.join(', ')}`);
    }

    const userDetails = await getUserDetails(req.user._id);
    if (!userDetails) {
        res.status(401).json({ message: "User Not found" });
        return;
    }
    const reactionUserId = userDetails.authorId;
    const post = await BlogPost.findById(postId)

    if (!post) {
        res.status(404);
        throw new Error('Post Not Found')
    }

    const existingReactionIndex = post.reactions.findIndex(r => r.userId.toString() === reactionUserId.toString());
    const existingReaction = existingReactionIndex !== -1 ? post.reactions[existingReactionIndex] : null;
    
    if (existingReaction) {
        if (existingReaction.type === type) {
            post.reactions.splice(existingReactionIndex, 1)
        }
        else {
            existingReaction.type = type;
        }
    }
    else {
        post.reactions.push({ userId: reactionUserId, type })
    }

    const updatedPost = await post.save();
    res.json(updatedPost);
}

export const addComment = async (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;
    const post = await BlogPost.findById(postId)
    const userDetails = await getUserDetails(req.user._id);

    if (!userDetails) {
        res.status(401).json({ message: "User Not found" });
        return;
    }
    if (!post) {
        res.status(404);
        throw new Error('Post Not Found')
    }

    const newComment = {
      
        ...userDetails, 
        content,
        createdAt: new Date()
    }

    post.comments.push(newComment)
    const updatedPost = await post.save();
    res.json(updatedPost)
}

export const updateComment = async (req, res) => {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const post = await BlogPost.findById(postId)
    const comment = post.comments.id(commentId);
    if (!comment) { res.status(404); throw new Error('Comment not found'); }

    if (req.user.role !== 'admin' && comment.authorId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this comment');
    }

    if (!post) {
        res.status(404);
        throw new Error('Post Not Found')
    }

    comment.content = content || comment.content;
    const updatedPost = await post.save();
    res.json(updatedPost)
};

export const deleteComment = async (req, res) => {
    const { postId, commentId } = req.params;
    const post = await BlogPost.findById(postId)
    const comment = post.comments.id(commentId);
    if (!comment) { res.status(404); throw new Error('Comment not found'); }

    if (req.user.role !== 'admin' && comment.authorId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this comment');
    };

    comment.deleteOne();
    const updatedPost = await post.save();
    res.json(updatedPost);
}
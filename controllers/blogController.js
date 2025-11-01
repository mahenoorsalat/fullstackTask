import BlogPost from "../models/BlogPostModel.js";
import User from "../models/userModels.js"


export const getUserDetails = async (userId) => {
    const user = await User.findById(userId).select('name email role photoUrl');

    if (!user) return null;

    const photoUrl = user.photoUrl || `https://i.pravatar.cc/150?u=${user.email}`;

    return {
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
      
        authorPhotoUrl: photoUrl  
    }
};

export const getBlogPost = async (req, res) => {
    const post = await BlogPost.find({})
        .sort({ createdAt: -1 })

    res.json(post);
}

export const createBlogPost = async (req, res) => {
    const { content } = req.body;
    const userDetails = await getUserDetails(req.user._id); // This now returns the correct authorPhotoUrl

    if (!userDetails) {
        res.status(401).json({ message: "User Not found" });
        return;
    }

    const newPosts = new BlogPost({
        ...userDetails, // This spreads authorId, authorName, authorRole, and the CORRECT authorPhotoUrl
        content
    })
    const createPost = await newPosts.save()

    res.status(201).json({ message: "New Blog Post Created", post: createPost })
    return;
}

export const updateBlogPost = async (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;
    const post = await BlogPost.findById(postId)
    if (!post) {
        res.status(404);
        throw new Error('Post Not Found')
    }
    if (req.user.role !== 'admin' && post.authorId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not Authorized to update this post ')
    }
    post.content = content || post.content;
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
    const { content } = req.body;
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
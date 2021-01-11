const Campground = require('./models/campground');
const Review = require('./models/review');
const AppError = require('./utils/AppError');

exports.ensureLogin = function(req,res,next){
    if(req.isAuthenticated()) next();
    else{
        req.session.returnTo = req.originalUrl;
        req.flash('error','You must be logged in');
        res.redirect('/login');
    }
}

exports.ensureNoLogin = function(req,res,next){
    if(!req.isAuthenticated()) next();
    else{
        req.flash('error','You must be logged out');
        res.redirect('/campgrounds');
    }
}

exports.authorizeCampground = async function(req,res,next){
    try{
        const {id} = req.params;
        const campground = await Campground.findById(id).exec();
        if(!campground) throw new AppError('Not found',404);
        if(!campground.author.equals(req.user._id)) throw new AppError('Forbidden',403);
        else next();
    }catch(err){
        next(err);
    }
}

exports.authorizeReview = async function(req,res,next){
    try{
        const {reviewId} = req.params;
        const review = await Review.findById(reviewId).populate('author').exec();
        if(!review) throw new AppError('Not found',404);
        if(review.author.equals(req.user)) next();
        else throw new AppError('Forbidden',403);
    }catch(err){
        next(err);
    }
}
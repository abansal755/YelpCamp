const express = require('express');
const router = express.Router({mergeParams: true});
const middleware = require('../middleware');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrapAsync');
const Campground = require('../models/campground');
const Review = require('../models/review');

// /campgrounds/:campgroundId/reviews

router.post('/',middleware.ensureLogin,wrapAsync(async (req,res) => {
    const {campgroundId} = req.params;
    const campground = await Campground.findById(campgroundId).exec();
    if(!campground){
        req.flash('error','Campground not found');
        res.redirect('/campgrounds');
        return;
    }
    const review = new Review(req.body.review);
    review.author = req.user._id;
    await review.save();
    campground.reviews.push(review);
    await campground.save();
    req.flash('success','Successfully added a review');
    res.redirect(`/campgrounds/${campgroundId}`);
}));

router.delete('/:reviewId',middleware.ensureLogin,middleware.authorizeReview,wrapAsync(async (req,res) => {
    const {campgroundId,reviewId} = req.params;
    await Campground.findByIdAndUpdate(campgroundId,{$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash('success','Successfully deleted the review');
    res.redirect(`/campgrounds/${campgroundId}`);
}));

module.exports = router;
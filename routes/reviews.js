const express = require('express');
const router = express.Router({mergeParams: true});
const middleware = require('../middleware');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrapAsync');
const Campground = require('../models/campground');
const Review = require('../models/review');

// /campgrounds/:id/reviews

router.post('/',middleware.findCampground,middleware.ensureLogin,wrapAsync(async (req,res) => {
    if(req.body.review.rating == 0){
        req.flash('error','Rating must be atleast 1 star');
        res.redirect(`/campgrounds/${req.params.id}`);
        return;
    }
    const review = new Review(req.body.review);
    review.author = req.user._id;
    await review.save();
    req.campgroundQuery.reviews.push(review);
    await req.campgroundQuery.save();
    req.flash('success','Successfully added the review');
    res.redirect(`/campgrounds/${req.params.id}`);
}));

router.delete('/:reviewId',middleware.findCampground,middleware.ensureLogin,middleware.authorizeReview,wrapAsync(async (req,res) => {
    const {id,reviewId} = req.params;
    await req.campgroundQuery.update({$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash('success','Successfully deleted the review');
    res.redirect(`/campgrounds/${id}`);
}));

module.exports = router;
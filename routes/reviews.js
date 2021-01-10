const express = require('express');
const router = express.Router({mergeParams: true});
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrapAsync');
const Campground = require('../models/campground');
const Review = require('../models/review');

// /campgrounds/:campgroundId/reviews

router.post('/',wrapAsync(async (req,res) => {
    const {campgroundId} = req.params;
    const campground = await Campground.findById(campgroundId).exec();
    if(!campground){
        req.flash('error','Campground not found');
        res.redirect('/campgrounds');
    }else{
        const review = new Review(req.body.review);
        await review.save();
        campground.reviews.push(review);
        await campground.save();
        req.flash('success','Successfully added a review');
        res.redirect(`/campgrounds/${campgroundId}`);
    }
}));

router.delete('/:reviewId',wrapAsync(async (req,res) => {
    const {campgroundId,reviewId} = req.params;
    await Campground.findByIdAndUpdate(campgroundId,{$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash('success','Successfully deleted the review');
    res.redirect(`/campgrounds/${campgroundId}`);
}));

module.exports = router;
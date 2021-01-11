const express = require('express');
const router = express.Router();
const flash = require('connect-flash');
const middleware = require('../middleware');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrapAsync');
const Campground = require('../models/campground');
const Review = require('../models/review');

/*
home GET / => home page
index GET /campgrounds => shows all campgrounds
new GET /campgrounds/new => form for new campgrounds
show GET /campgrounds/:id => shows specific campgrounds
create POST /campgrounds => creates a new campgrounds on server
edit GET /campgrounds/:id/edit => form to edit a specific campgrounds
update PUT /campgrounds/:id => edits form on server
delete DELETE /campgrounds/:id => deletes form on server
*/

// /campgrounds

router.get('/',wrapAsync(async (req,res) => {
    const campgrounds = await Campground.find({}).exec();
    res.render('campgrounds/index',{campgrounds});
}));

router.get('/new',middleware.ensureLogin,(req,res) => {
    res.render('campgrounds/new');
});

router.get('/:id',wrapAsync(async (req,res) => {
    const {id} = req.params;
    const campground = await Campground.findById(id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author').exec();
    if(!campground){
        req.flash('error','Campground not found');
        res.redirect('/campgrounds');
    }
    else res.render('campgrounds/show',{campground});
}));

router.post('/',middleware.ensureLogin,wrapAsync(async (req,res) => {
    const campground = new Campground(req.body.campground);
    campground.author = req.user._id;
    await campground.save();
    req.flash('success','Successfully created a campground');
    res.redirect(`/campgrounds/${campground._id}`);
}));

router.get('/:id/edit',middleware.ensureLogin,middleware.authorizeCampground,wrapAsync(async (req,res) => {
    const {id} = req.params;
    const campground = await Campground.findById(id).exec();
    if(!campground){
        req.flash('error','Campground not found');
        res.redirect('/campgrounds');
    }
    else res.render('campgrounds/edit',{campground});
}));

router.put('/:id',middleware.ensureLogin,middleware.authorizeCampground,wrapAsync(async (req,res) => {
    const {id} = req.params;
    const {campground} = req.body;
    await Campground.findByIdAndUpdate(id,campground,{runValidators:true}).exec();
    req.flash('success','Successfully updated the campground');
    res.redirect(`/campgrounds/${id}`);
}));

router.delete('/:id',middleware.ensureLogin,middleware.authorizeCampground,wrapAsync(async (req,res) => {
    const {id} = req.params;
    const campground = await Campground.findByIdAndDelete(id).exec();
    if(campground) await Review.deleteMany({_id:{$in:campground.reviews}});
    req.flash('success','Successfully deleted the campground');
    res.redirect('/campgrounds');
}));

module.exports = router;
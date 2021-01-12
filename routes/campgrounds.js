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

router.get('/:id',middleware.findCampground,wrapAsync(async (req,res) => {
    req.campgroundQuery.populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    },function(){
        req.campgroundQuery.populate('author',function(){
            res.render('campgrounds/show',{campground:req.campgroundQuery});
        });
    });
}));

router.post('/',middleware.ensureLogin,wrapAsync(async (req,res) => {
    const campground = new Campground(req.body.campground);
    campground.author = req.user._id;
    await campground.save();
    req.flash('success','Successfully created a campground');
    res.redirect(`/campgrounds/${campground._id}`);
}));

router.get('/:id/edit',middleware.findCampground,middleware.ensureLogin,middleware.authorizeCampground,(req,res) => {
    res.render('campgrounds/edit',{campground:req.campgroundQuery});
});

router.put('/:id',middleware.findCampground,middleware.ensureLogin,middleware.authorizeCampground,wrapAsync(async (req,res) => {
    const {id} = req.params;
    const {campground} = req.body;
    for(const key in campground) req.campgroundQuery[key] = campground[key];
    await req.campgroundQuery.save();
    req.flash('success','Successfully updated the campground');
    res.redirect(`/campgrounds/${id}`);
}));

router.delete('/:id',middleware.findCampground,middleware.ensureLogin,middleware.authorizeCampground,wrapAsync(async (req,res) => {
    // TODO: Can be made more efficient using less middleware and writing the function instead
    const {id} = req.params;
    const campground = await Campground.findByIdAndDelete(id).exec();
    await Review.deleteMany({_id:{$in:campground.reviews}});
    req.flash('success','Successfully deleted the campground');
    res.redirect('/campgrounds');
}));

module.exports = router;
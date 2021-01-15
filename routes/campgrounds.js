const express = require('express');
const router = express.Router();
const flash = require('connect-flash');
const fs = require('fs/promises');
const path = require('path');
const middleware = require('../middleware');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrapAsync');
const Campground = require('../models/campground');
const Review = require('../models/review');

//Multer
const multer = require('multer');
const storage = multer.diskStorage({
    destination: async function(req,file,cb){
        await fs.mkdir(`public/images/uploads/${req.user._id}`,{recursive: true});
        cb(null,`public/images/uploads/${req.user._id}`);
    }
});
const upload = multer({
    storage,
    limits: {
        fileSize: 10*1024*1024
    }
});

//Mapbox
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocoder = mbxGeocoding({accessToken: process.env.mbxToken});

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

router.post('/',middleware.ensureLogin,upload.array('image',10),wrapAsync(async (req,res) => {
    //Adding text fields to campground
    const campground = new Campground(req.body.campground);
    campground.author = req.user._id;
    for(const file of req.files) campground.image.push(`/images/uploads/${req.user._id}/${file.filename}`); 
    if(req.files.length === 0) throw new AppError('Atleast 1 image is required',400);

    try{
        //Adding geometry to campground
        const geo = await geocoder.forwardGeocode({
            query: campground.location,
            limit: 1
        }).send();
        if(geo.body.features.length === 0) throw new AppError('Location not found. Please enter a valid location',400);
        campground.geometry = geo.body.features[0].geometry
    
        await campground.save();
        req.flash('success','Successfully created a campground');
        res.redirect(`/campgrounds/${campground._id}`);
    }catch(err){
        //If there is any error in fetching geometry or saving the campground, remove all its uploaded files as it is not being saved
        for(const file of campground.image) await fs.unlink(`public/${file}`);
        throw err;
    }
}));

router.get('/:id/edit',middleware.findCampground,middleware.ensureLogin,middleware.authorizeCampground,(req,res) => {
    res.render('campgrounds/edit',{campground:req.campgroundQuery});
});

router.get('/:id/delete',middleware.findCampground,middleware.ensureLogin,middleware.authorizeCampground,(req,res) => {
    res.render('campgrounds/delete',{campground:req.campgroundQuery});
});

router.patch('/:id',middleware.findCampground,middleware.ensureLogin,middleware.authorizeCampground,upload.array('image',10),wrapAsync(async (req,res) => {
    const {id} = req.params;
    const {campground,include} = req.body;
    const removeArray = [];//image urls to be removed are 1st added to this array and then the files are deleted in the end

    //Checking no. of images
    if(!include && req.files.length === 0) throw new AppError('Atleast 1 image is required',400);
    if(req.files.length+include.length > 10) throw new AppError('Atmax 10 images are allowed',400);

    //updating text fields in campground
    for(const key in campground) req.campgroundQuery[key] = campground[key];

    //adding image urls uploaded earlier which are not checked to removeArray[]
    for(let i=req.campgroundQuery.image.length-1;i>=0;i--){
        if((include && !include[i]) || !include){
            removeArray.push(`public${req.campgroundQuery.image[i]}`);
            req.campgroundQuery.image.splice(i,1);
        }
    }

    //adding newly uploaded images
    for(const file of req.files) req.campgroundQuery.image.push(`/images/uploads/${req.user._id}/${file.filename}`);
    await req.campgroundQuery.save();

    //removing the images from removeArray[]
    for(const url of removeArray) await fs.unlink(url);
    req.flash('success','Successfully updated the campground');
    res.redirect(`/campgrounds/${id}`);
}));

router.delete('/:id',middleware.findCampground,middleware.ensureLogin,middleware.authorizeCampground,wrapAsync(async (req,res) => {
    const {id} = req.params;
    const campground = await req.campgroundQuery.deleteOne();
    await Review.deleteMany({_id:{$in:campground.reviews}});
    for(const file of campground.image) await fs.unlink(`public/${file}`);
    req.flash('success','Successfully deleted the campground');
    res.redirect('/campgrounds');
}));

module.exports = router;
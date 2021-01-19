const Campground = require('../models/campground');
const Review = require('../models/review');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrapAsync');
const {cloudinary} = require('../config/multer');

const geocoder = require('../config/mapbox');

exports.index = wrapAsync(async (req,res) => {
    const campgrounds = await Campground.find({}).exec();
    res.render('campgrounds/index',{campgrounds});
})

exports.new = (req,res) => {
    res.render('campgrounds/new');
}

exports.show = wrapAsync(async (req,res) => {
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
})

exports.create = wrapAsync(async (req,res) => {
    const campground = new Campground(req.body.campground);
    campground.author = req.user._id;
    if(req.files.length === 0) throw new AppError('Atleast 1 image is required',400);
    for(const file of req.files) campground.image.push({path:file.path, filename:file.filename});

    try{
        const geo = await geocoder.forwardGeocode({
            query: campground.location,
            limit: 1
        }).send();
        if(geo.body.features.length === 0) throw new AppError('Location not found. Please enter a valid location',400);
        campground.geometry = geo.body.features[0].geometry;
    
        await campground.save();
        req.flash('success','Successfully created a campground');
        res.redirect(`/campgrounds/${campground._id}`);
    }catch(err){
        // delete images from server in case anything goes wrong in try
        for(const file of req.files) await cloudinary.uploader.destroy(file.filename);
        throw err;
    }
})

exports.edit = (req,res) => {
    res.render('campgrounds/edit',{campground:req.campgroundQuery});
}

exports.delete = (req,res) => {
    res.render('campgrounds/delete',{campground:req.campgroundQuery});
}

exports.update = wrapAsync(async (req,res) => {
    const {id} = req.params;
    const {campground,include} = req.body;
    const removeArray = [];//image urls to be removed are 1st added to this array and then the files are deleted in the end

    //Checking no. of images
    if(!include && req.files.length === 0) throw new AppError('Atleast 1 image is required',400);
    if(req.files.length+(include?include.length:0) > 10) throw new AppError('Atmax 10 images are allowed',400);

    //updating text fields in campground
    for(const key in campground) req.campgroundQuery[key] = campground[key];

    //Adding geometry to campground
    const geo = await geocoder.forwardGeocode({
        query: req.campgroundQuery.location,
        limit: 1
    }).send();
    if(geo.body.features.length === 0) throw new AppError('Location not found. Please enter a valid location',400);
    req.campgroundQuery.geometry = geo.body.features[0].geometry;

    //adding image urls uploaded earlier which are not checked to removeArray[]
    for(let i=req.campgroundQuery.image.length-1;i>=0;i--){
        if((include && !include[i]) || !include){
            removeArray.push(req.campgroundQuery.image[i].filename);
            req.campgroundQuery.image.splice(i,1);
        }
    }

    //adding newly uploaded images
    for(const file of req.files) req.campgroundQuery.image.push({path:file.path,filename:file.filename});
    await req.campgroundQuery.save();

    //removing the images from removeArray[]
    for(const url of removeArray) await cloudinary.uploader.destroy(url);
    req.flash('success','Successfully updated the campground');
    res.redirect(`/campgrounds/${id}`);
})

exports.destroy = wrapAsync(async (req,res) => {
    const campground = await req.campgroundQuery.deleteOne();
    await Review.deleteMany({_id:{$in:campground.reviews}});
    req.flash('success','Successfully deleted the campground');
    res.redirect('/campgrounds');
})
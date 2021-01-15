const express = require('express');
const router = express.Router();
const passport = require('passport');
const fs = require('fs/promises');
const middleware = require('../middleware');
const User = require('../models/user');
const Campground = require('../models/campground');
const Review = require('../models/review');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrapAsync');

router.get('/register',middleware.ensureNoLogin,(req,res) => {
    res.render('users/register');
});

router.post('/register',middleware.ensureNoLogin,async (req,res) => {
    try{
        const {username,email,password} = req.body;
        const user = new User({username,email});
        await User.register(user,password);
        req.logIn(user,(err) => {
            if(err) throw err;
            req.flash('success','Welcome to YelpCamp');
            res.redirect('/campgrounds');
        });
    }catch(err){
        req.flash('error',err.message);
        res.redirect('/register');
    }
});

router.get('/login',middleware.ensureNoLogin,(req,res) => {
    res.render('users/login');
});

router.post('/login',middleware.ensureNoLogin,passport.authenticate('local',{failureFlash: true,failureRedirect: '/login'}),(req,res) => {
    req.flash('success','Successfully logged in');
    const Url = (req.session.returnTo)?req.session.returnTo:'/campgrounds';
    delete req.session.returnTo;
    res.redirect(Url);
});

router.post('/logout',middleware.ensureLogin,(req,res) => {
    req.logOut();
    req.flash('success','Successfully loggout out');
    res.redirect('/campgrounds');
});

router.get('/settings',middleware.ensureLogin,(req,res) => {
    res.render('users/settings');
});

router.get('/settings/change-password',middleware.ensureLogin,(req,res) => {
    res.render('users/change-password');
});

router.post('/settings/change-password',middleware.ensureLogin,wrapAsync(async (req,res) => {
    const {current:oldPassword,'new':newPassword} = req.body;
    try{
        await req.user.changePassword(oldPassword,newPassword);
    }catch{
        req.flash('error','Incorrect current password');
        res.redirect('/settings/change-password');
        return;
    }
    req.flash('success','Successfully changed the password');
    res.redirect('/settings');
}));

router.get('/settings/delete',middleware.ensureLogin,(req,res) => {
    res.render('users/delete');
});

router.post('/settings/delete',middleware.ensureLogin,wrapAsync(async (req,res) => {
    //deleting the user
    const user = await req.user.deleteOne();

    //deleting all the campgrounds of the user
    const campgrounds = await Campground.find({author: user._id}).exec();
    for(const campground of campgrounds){
        await campground.deleteOne();

        //deleting all the reviews of a specific campground
        await Review.deleteMany({_id:{$in:campground.reviews}});

        //deleting all the images of the campground from the disk
        for(const file of campground.image) await fs.unlink(`public/${file}`);
    };

    //deleting all the reviews by the user
    const reviews = await Review.find({author: user._id}).populate('campground','reviews').exec();
    for(const review of reviews){
        await review.deleteOne();
        await review.campground.update({$pull:{reviews: review._id}});
    }
    res.redirect('/');
}));

module.exports = router;
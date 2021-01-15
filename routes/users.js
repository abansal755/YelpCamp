const express = require('express');
const router = express.Router();
const passport = require('passport');
const middleware = require('../middleware');
const User = require('../models/user');
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

module.exports = router;
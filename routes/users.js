const express = require('express');
const router = express.Router();
const passport = require('passport');
const middleware = require('../middleware');
const User = require('../models/user');
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

module.exports = router;
const {cloudinary} = require('../config/multer');
const User = require('../models/user');
const Campground = require('../models/campground');
const Review = require('../models/review');
const wrapAsync = require('../utils/wrapAsync');
const wrapAsyncFlash = require('../utils/wrapAsyncFlash');

exports.registerShow = (req,res) => {
    res.render('users/register');
}

exports.register = wrapAsyncFlash(async (req,res) => {
    const {username,email,password} = req.body;
    const user = new User({username,email});
    await User.register(user,password);
    req.logIn(user,(err) => {
        if(err) throw err;
        req.flash('success','Welcome to YelpCamp');
        res.redirect('/campgrounds');
    })
},'/register')

exports.loginShow = (req,res) => {
    res.render('users/login');
}

exports.login = (req,res) => {
    req.flash('success','Successfully logged in');
    const Url = (req.session.returnTo)?req.session.returnTo:'/campgrounds';
    delete req.session.returnTo;
    res.redirect(Url);
}

exports.logout = (req,res) => {
    req.logOut();
    req.flash('success','Successfully loggout out');
    res.redirect('/campgrounds');
}

exports.settings = (req,res) => {
    res.render('users/settings');
}

exports.changePasswordShow = (req,res) => {
    res.render('users/change-password');
}

exports.changePassword = wrapAsyncFlash(async (req,res) => {
    const {current:oldPassword,'new':newPassword} = req.body;
    await req.user.changePassword(oldPassword,newPassword);
    req.flash('success','Successfully changed the password');
    res.redirect('/settings');
},'/settings/change-password','Incorrect current password')

exports.delete = (req,res) => {
    res.render('users/delete');
}

exports.destroy = wrapAsync(async (req,res) => {
    await req.user.deleteOne();
    res.redirect('/');
})
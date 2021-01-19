const {cloudinary} = require('../config/multer');
const User = require('../models/user');
const Campground = require('../models/campground');
const Review = require('../models/review');
const wrapAsync = require('../utils/wrapAsync');

exports.registerShow = (req,res) => {
    res.render('users/register');
}

exports.register = async (req,res) => {
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
}

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

exports.changePassword = wrapAsync(async (req,res) => {
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
})

exports.delete = (req,res) => {
    res.render('users/delete');
}

exports.destroy = wrapAsync(async (req,res) => {
    await req.user.deleteOne();
    res.redirect('/');
})
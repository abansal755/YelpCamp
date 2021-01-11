const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const passportLocal = require('passport-local');

const AppError = require('./utils/AppError');

const User = require('./models/user');

const campgroundsRouter = require('./routes/campgrounds');
const reviewsRouter = require('./routes/reviews');
const usersRouter = require('./routes/users');

(async function(){
    try{
        await mongoose.connect('mongodb://localhost/YelpCamp',{
            useNewUrlParser: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        });
        console.log('Server is running...');
    }catch(err){
        console.log(err);
        process.exit(1);
    }
})();

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000*60*60*24*7
    }
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.user = req.user;
    console.log(req.session);
    next();
});

app.get('/',(req,res) => {
    res.render('home');
});

app.use('/',usersRouter);
app.use('/campgrounds',campgroundsRouter);
app.use('/campgrounds/:campgroundId/reviews',reviewsRouter);

app.use((req,res) => {
    throw new AppError('Not found', 404);
});

app.use((err,req,res,next) => {
    const {status = 500} = err;
    if(!err.message) err.message = 'Something went wrong';
    res.status(status).render('error',{err});
});

app.listen(3000,() => console.log('MongoDB is running...'));
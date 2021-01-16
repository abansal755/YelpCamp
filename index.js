if(process.env.NODE_ENV !== 'production') require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const passportLocal = require('passport-local');
const helmet = require('helmet');

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
        console.log('MongoDB is running...');
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
    name: 'session',
    secret: process.env.cookieSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000*60*60*24*7
    }
}));

const src = ["'self'","'unsafe-inline'","https://cdn.jsdelivr.net/","https://api.mapbox.com/","https://events.mapbox.com/"]

app.use(flash());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'connect-src': src,
            'style-src': src,
            'script-src': src,
            'worker-src':["'self'","blob:"],
            'img-src': ["'self'","blob:","data:"]
        }
    }
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.user = req.user;
    next();
});

app.get('/',(req,res) => {
    res.render('home');
});

app.use('/',usersRouter);
app.use('/campgrounds',campgroundsRouter);
app.use('/campgrounds/:id/reviews',reviewsRouter);

app.use((req,res) => {
    throw new AppError('Not found', 404);
});

app.use((err,req,res,next) => {
    const {status = 500} = err;
    if(!err.message) err.message = 'Something went wrong';
    res.status(status).render('error',{err});
});

app.listen(process.env.PORT,() => console.log(`Server is running on port ${process.env.PORT}...`));
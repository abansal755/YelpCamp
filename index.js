const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const AppError = require('./utils/AppError');
const campgrounds = require('./routes/campgrounds');
const reviews = require('./routes/reviews');

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

app.use((req,res,next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.get('/',(req,res) => {
    res.render('home');
});

app.use('/campgrounds',campgrounds);
app.use('/campgrounds/:campgroundId/reviews',reviews);

app.use((req,res) => {
    throw new AppError('Not found', 404);
});

app.use((err,req,res,next) => {
    const {status = 500} = err;
    if(!err.message) err.message = 'Something went wrong';
    res.status(status).render('error',{err});
});

app.listen(3000,() => console.log('MongoDB is running...'));
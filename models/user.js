const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Campground = require('../models/campground');
const Review = require('../models/review');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
        // unique: true
    }
});
userSchema.plugin(passportLocalMongoose);
//TODO: add email validation

userSchema.post('deleteOne',{document: true, query: false}, async function(){
    //deleting all campgrounds of the user
    const campgrounds = await Campground.find({author: this._id});
    for(const campground of campgrounds) await campground.deleteOne();

    //deleting all reviews of the user
    const reviews = await Review.find({author: this._id}).populate('campground','reviews').exec();
    for(const review of reviews){
        await review.deleteOne();
        await review.campground.update({$pull:{reviews: review._id}});
    }
})

module.exports = mongoose.model('User',userSchema);
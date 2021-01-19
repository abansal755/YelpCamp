const mongoose = require('mongoose');
const escape = require('escape-html');
const {cloudinary} = require('../config/multer');
const Review = require('../models/review');

const campgroundScheme = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    image: [{
        _id: false,
        path: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            required: true
        }
    }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
},{toJSON: {virtuals:true}});

campgroundScheme.virtual('properties.popupHtml').get(function(){
    return `
            <a href="/campgrounds/${this._id}">${this.title}</a>
            <br>
            ${this.location}`;
});

campgroundScheme.pre('save', function(next){
    this.title = escape(this.title);
    this.description = escape(this.description);
    this.location = escape(this.location);
    next();
});

campgroundScheme.post('deleteOne', {document: true, query: false},async function(){
    for(const file of this.image) await cloudinary.uploader.destroy(file.filename);
    await Review.deleteMany({_id:{$in:this.reviews}});
});

module.exports = mongoose.model('Campground',campgroundScheme);
const mongoose = require('mongoose');
const Review = require('./review');
const escape = require('escape-html');

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
        type: String
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

//TODO: add middleware for deleting images from disk after deleting campground

module.exports = mongoose.model('Campground',campgroundScheme);
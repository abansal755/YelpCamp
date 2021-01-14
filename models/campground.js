const mongoose = require('mongoose');

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
})

module.exports = mongoose.model('Campground',campgroundScheme);
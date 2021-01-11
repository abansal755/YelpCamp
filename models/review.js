const mongoose = require('mongoose');
const user = require('./user');

const reviewSchema = new mongoose.Schema({
    body: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: user,
        required: true
    }
});

module.exports = mongoose.model('Review',reviewSchema);
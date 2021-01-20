module.exports = function(fn) {
    return function(next){
        fn(this)
            .then(() => next())
            .catch(err => next(err));
    }
}
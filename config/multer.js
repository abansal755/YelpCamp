const fs = require('fs/promises');

const multer = require('multer');
const storage = multer.diskStorage({
    destination: async function(req,file,cb){
        await fs.mkdir(`public/images/uploads/${req.user._id}`,{recursive: true});
        cb(null,`public/images/uploads/${req.user._id}`);
    }
});
const upload = multer({
    storage,
    limits: {
        fileSize: 10*1024*1024
    }
});

module.exports = upload;
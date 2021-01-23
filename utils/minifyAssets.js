const fs = require('fs/promises');
const path = require('path');
const minify = require('minify');
const collapse = require('collapse-white-space');

async function minifyAssetsWrite(location,dir){
    try{
        const filePath = path.join(dir,'minified',path.relative(dir,location));
        const folder = path.parse(filePath).dir;
        await fs.mkdir(folder,{recursive:true});
        let data;
        if(path.extname(filePath) === '.ejs') data = collapse(await fs.readFile(location,'utf-8'));
        else data = await minify(location);
        await fs.writeFile(filePath,data);
    }
    catch(err){
        throw err;
    }
}

async function minifyAssets(location,dir){
    try{
        if(path.extname(location) !== '') await minifyAssetsWrite(location,dir);
        const files = await fs.readdir(location);
        for(const file of files){
            const newLocation = path.join(location,file);
            if(path.extname(newLocation) !== '') await minifyAssetsWrite(newLocation,dir);
            else await minifyAssets(newLocation,dir);
        }
    }catch(err){
        throw err;
    }
}

module.exports = async function(dir){
    try{
        if((await fs.readdir(dir)).includes('minified')) await fs.rmdir(path.join(dir,'minified'),{recursive:true});
        await minifyAssets(dir,dir);
    }catch(err){
        console.log(err);
    }
}
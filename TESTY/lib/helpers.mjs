//helpers for various tasks

//dependencies
import crypto from "crypto";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.join(__dirname, '/../');
const checkEmail = ()=>{
    return new Promise((res, rej)=>{
        helpers.read('users', 'userList', function(err, data){
            if(!err){
                res(data);                
            }        
            else rej('Problem z otwarciem pliku '+err);
        })
    })
}

const helpers = {};

helpers.renderHtml =function(res, file){
    fs.readFile(baseDir+'HTML/' + file,'utf8', function(err, data){
    if(!err){  
        res.writeHead(200, {
        'Content-Type': 'text/html'});
        res.write(data);
    }else{
        res.writeHead(401);
        res.write('nie znaleziono strony');
    }
    res.end();
})

}
//helpers.baseDir = path.join(__dirname, '/');
helpers.create = function(dir, file, data, callback){
    fs.open(path.join(baseDir+dir+'/'+file+'.json'), 'wx', function(err, fileDescriptor){
        if(!err&&fileDescriptor){
            strData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, strData, function(err){
                if(!err){
                    fs.close(fileDescriptor, function(err){
                        if(!err){
                            callback(false);
                        }
                        else{
                            callback("error closing new file");
                        }
                    });
                }
                else{
                    callback("error writing to new file");
                }
            })
        }
        else{
            callback("Nie udalo sie zapisac pliku, byc moze juz istnieje" + err);
        }
    })
}
helpers.read = function(dir, file, callback){
    fs.open(path.join(baseDir+dir+'/'+file+'.json'), 'r', function(err, fileDescriptor){
        if(!err&&fileDescriptor){
            fs.readFile(fileDescriptor, function(err, data){
                if(!err){
                    let parseData = helpers.parseJson(data);
                    fs.close(fileDescriptor, function(err){
                        if(!err){
                            callback(false, parseData);
                        }
                        else{
                            callback("error closing a file");
                        }
                    });
                }
                else{
                    callback("error reading a file");
                }
            })
        }
        else{
            callback("Nie udalo sie znaleźź pliku, byc moze nie istnieje" + err);
        }
    })
}

helpers.append = function(dir, file, obj, callback){
    fs.appendFile(path.join(baseDir+dir+'/'+file+'.json'), obj, function (err) {
        if (!err){
            callback(false);
        }else{
            callback(err);
        }
    });
}
helpers.write = function(dir, file, data, callback){
    fs.open(path.join(baseDir+dir+'/'+file+'.json'), 'w', function(err, fileDescriptor){
        if(!err&&fileDescriptor){
            const strData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, strData, function(err){
                if(!err){
                    fs.close(fileDescriptor, function(err){
                        if(!err){
                            callback(false);
                        }
                        else{
                            callback("error closing file");
                        }
                    });
                }
                else{
                    callback("error writing to file");
                }
            })
        }
        else{
            callback("Nie udalo sie zapisac pliku, byc moze nie istnieje" + err);
        }
    })
}

//Parse a JSON string to an object
helpers.parseJson = function(str){
    try{
        return JSON.parse(str);
    }
    catch(err){
        return {}
    }
}
helpers.hash = function(str){
    if(typeof(str)=="string" && str.length >0){
        const hash = crypto.createHmac('sha256', "Borzymow67").update(str).digest('hex');
        return hash;
    }
    else{
        return false;
    }
}

helpers.addToUser = async function(email, pwd, id, res, data){
    try{
        const obj = await checkEmail();
        if(obj.hasOwnProperty(email)){
            res.writeHead(403);
            res.end();
        }else{
            obj[email] = [pwd, id];
            helpers.write('users', 'userList', obj, function(err){
               if(!err){
                data.ankieta = false;
                data.wisconsin = false;
                data.stroop = false; 
                helpers.write('users', id, data, function(err){
                    if(!err){
                     res.writeHead(200);
                     res.end();
                    }else {
                     res.writeHead(503);
                     res.end();
                    }
                })
               }else {
                res.writeHead(503);
                res.end();
               }
           })
        }
    } catch(err){
        console.log(err);
    }
}

helpers.randomString = function(len){
    const str = 'abcdefghijklmnoprstuwzq1234567890';
    let ranStr = '';
    if(typeof(len)=='number'&& len > 0){
        for(let i = 0; i < len; i++){
        ranStr += str.charAt(Math.floor(Math.random()*str.length))
        }
        return ranStr;
    }
    else{
        return false;
    }
}
helpers.checkLogin = async function(email, pwd, res){
    try{
         const obj = await checkEmail();
         if(!obj.hasOwnProperty(email)){
             res.writeHead(403);
             res.end();
         }else if(obj[email][0] == pwd){
            const id = obj[email][1];
            const token = helpers.createToken(id);
             res.writeHead(200, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify(token));
         }else{
             res.writeHead(401);
             res.end();
         }
     } catch(err){
         console.log(err)
     }
 } 
 helpers.createToken = (id)=>{
    let exp = Date.now() + 60*60*1000;
    exp = exp.toString();
    const hash = helpers.hash(id+exp);
    return {exp:exp, id:id, hash: hash};
 }
 helpers.checkToken = (hs, ep, id) =>{
    return (hs == helpers.hash(id+ep)) ? true : false;
 }
export default helpers;
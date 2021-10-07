import https from 'https';
import http from 'http';
import url from 'url'
import fs from 'fs'
import path from 'path';
import handlers from './lib/handlers.mjs';
import helpers from './lib/helpers.mjs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { StringDecoder } from 'string_decoder';


const router = {
    '':handlers.home,
    'ankieta':handlers.ankieta,
    'testy': handlers.testy,
    'login': handlers.login,
    'signup': handlers.signup,
    'wisconsint': handlers.wisconsint,
    'wisconsinp': handlers.wisconsinp,
    'stroop_1': handlers.stroop_1,
    'stroop_2': handlers.stroop_2,
    'stroop_3': handlers.stroop_3,
    'results' : handlers.results,
    'home' : handlers.home
}
//common part for http and https server
const unifiedServer = function(req, res, urlParsed){
    //const urlParsed = url.parse(req.url, true);
    const decoder = new StringDecoder("utf-8");
    let buffer = "";
    req.on('data',function(data){
        buffer += decoder.write(data);
    })
    req.on("end", function(){
        buffer += decoder.end();
        const data = {
            'urlParsed': urlParsed,
            'path': urlParsed.pathname,
            'method': req.method.toLowerCase(),
            'queryStr': urlParsed.query,
            'headers': req.headers,
            'decoder':  decoder,
            'payload': helpers.parseJson(buffer)
        }
         //choose the handler
        let trimmedPath = data.path.replace("/", "");
        let chooseHandler = typeof(router[trimmedPath]) != 'undefined' ? router[trimmedPath] : handlers.notFound;
        //default handler
        chooseHandler(data, res);
    })  
}
const server = http.createServer(function(req, res){
    const urlParsed = url.parse(req.url, true);
    const reqUrl = urlParsed.pathname;
    if(reqUrl.match("\.gif$")){
        var imagePath = path.join(__dirname, 'gif', reqUrl);
        var readStream = fs.createReadStream(imagePath);
        readStream.on('open', function () {
            res.writeHead(200, {"Content-Type": "image/gif"});
            readStream.pipe(res);
          });
        readStream.on('error', function(err){
            console.log(err);
            res.end();
          });
    }else{
        unifiedServer(req, res, urlParsed);
    }
})
server.listen(3000, function(){
    console.log('Server start at port 3000')
})

const httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/CERT/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, 'CERT', 'cert.pem')),
}
const httpsServer = https.createServer(httpsServerOptions, function(req, res){
    const urlParsed = url.parse(req.url, true);
    const reqUrl = urlParsed.pathname;
    if(reqUrl.match("\.gif$")){
        var imagePath = path.join(__dirname, 'gif', reqUrl);
        var readStream = fs.createReadStream(imagePath);
        readStream.on('open', function () {
            res.writeHead(200, {"Content-Type": "image/gif"});
            readStream.pipe(res);
          });
        readStream.on('error', function(err){
            console.log(err);
            res.end();
          });
    }else{
        unifiedServer(req, res, urlParsed);
    }
});
httpsServer.listen(3001, function(){
    console.log('Server https start at port 3001')
})



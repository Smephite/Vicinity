const functions = require('firebase-functions');
const express = require('express');
const mcache = require('memory-cache');

const CACHE_DURATION = 3600;
const CACHE = true;

require('dotenv').config();

const app = express();

//app.use(require('cors'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());app.set('json spaces', 1)

app.get('*',
    (req, res, next) => {
        let key = '__express__' + req.originalUrl || req.url;
        let cachedBody = mcache.get(key);
        if (CACHE && cachedBody) {
            console.info('Cached!');
            res.send(cachedBody);
        } else {
            res.sendResponse = res.send;
            res.send = (body) => {
                mcache.put(key, body, CACHE_DURATION * 1000);
                res.sendResponse(body)
            };
            next();
        }
        return ()=>{};
    }
);

require('./handler/handlers')(app);



exports.app = functions.https.onRequest(app);


console.info("WebServer ready!");
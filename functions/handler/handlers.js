const ob2020 = require('./ob2020');
const lw2021 = require('./lw2021');
const districts = require('./districts');
const color = require('./colors');
const apis = {
    'elections':
        {
            'ob2020': {
                'city': ob2020.city,
                'district': ob2020.district,
                'votingdistrict': ob2020.votingdistrict,
            },
            'new_ob2020': {
                'city': ob2020.city_new,
                'district': ob2020.district_new,
                'votingdistrict': ob2020.votingdistrict_new,
            },
            'lw2021': {
                'city': lw2021.city,
                'district': lw2021.district,
                'votingdistrict': lw2021.votingdistrict
            }
        },
    'geo':
        {
            'election_districts':
            {
                '2020': districts.voting_ob2020,
                '2018': districts.voting_2018,
                'old': districts.voting_old
            },
            'districts': districts.districts
        },
    'color':
        {
            '2020': color._2020,
            'lw2021': color._lw2021
        }
};

module.exports = function (express) {
    add(express, '/api', undefined, apis);
};

function add(express, complete_path, path, obj)
{
    if(obj === undefined)
    {
        return;
    }
    //console.info(`Add ${complete_path} ${path} ${typeof obj}: `, obj);
    if(typeof obj === "function" && complete_path !== undefined){
        console.info(`Adding func ${complete_path}`);
        express.get(complete_path, obj);
    } else if(typeof obj === "string" && complete_path !== undefined)
    {
        console.info(`Adding string ${complete_path}`);
        express.get(complete_path, require(obj));
    } else if(typeof obj === "object")
    {
        //console.info("object! ", obj);
        for(let key in obj)
        {
            if(obj[key] === undefined)
            {
                continue;
            }
            //console.info(`Subpath: ${complete_path} ${key}`, obj[key], obj);
            add(express, complete_path + `/${key}`, key, obj[key]);
        }
        console.info(`Adding listing for ${complete_path}*`);
        express.get(`${complete_path}*`, (req, res, next) => handleListing(complete_path, req, res, next));
    }  else {
        console.error(`Invalid type: ${complete_path}: ${obj} ${typeof obj}`);
    }
}

function handleListing(path, req, res, next){
    console.info(`Handle Listing ${path}`);

    let paths = path.split('/');
    paths = paths.slice(2, paths.length);



    let children = apis;

    for(let p of paths)
    {
        children = children[p];
    }

    let methods = objToClean(children);

    if(Object.keys(methods).length === 1 && methods['methods'] !== undefined)
    {
        methods = methods['methods'];
    }

    res.status(200).json({'code': 404, 'message': 'Invalid api method', 'path': path, 'methods': methods});
}

function objToClean(obj)
{
    let res = {};
    for(let key in obj)
    {
        if(typeof obj[key] === "object")
        {
            res[key] = objToClean(obj[key]);
        } else {
            if(res['methods'] === undefined)
            {
                res['methods'] = [];
            }
            res['methods'].push(key);
        }
    }
    return res;
}
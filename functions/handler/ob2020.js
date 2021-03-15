const CITY_RESULTS = 'https://www.konstanz.de/konstanz/wahlen/OB-Wahl/08335043/html5/Open-Data-Oberbuergermeisterwahl-_Stadt-Konstanz_1-1.csv';
const DISTRICT_RESULTS = 'https://www.konstanz.de/konstanz/wahlen/OB-Wahl/08335043/html5/Open-Data-Oberbuergermeisterwahl-_Stadt-Konstanz_1-40.csv';
const VOTING_DISTRICT_RESULTS = 'https://www.konstanz.de/konstanz/wahlen/OB-Wahl/08335043/html5/Open-Data-Oberbuergermeisterwahl-_Stadt-Konstanz_16.csv';

const CITY_RESULTS_NEW = 'https://www.konstanz.de/konstanz/wahlen/OB-Wahl/08335043/html5/Open-Data-Oberbuergermeisterwahl-Neuwahl-_Stadt-Konstanz_6-43.csv';
const DISTRICT_RESULTS_NEW = 'https://www.konstanz.de/konstanz/wahlen/OB-Wahl/08335043/html5/Open-Data-Oberbuergermeisterwahl-Neuwahl-_Stadt-Konstanz_6-44.csv';
const VOTING_DISTRICT_RESULTS_NEW = 'https://www.konstanz.de/konstanz/wahlen/OB-Wahl/08335043/html5/Open-Data-Oberbuergermeisterwahl-Neuwahl-_Stadt-Konstanz_66.csv';

const csv = require("csvtojson");
const request = require('request-promise-native');

const csv_options = {
    noheader:false,
    output: "json",
    delimiter: ';'
};
var contestants = [];
var contestants_new = [];
let index = 0;
let index_new = 0;
function addContestant(name, surname, new_one = false)
{
    let i = 0;

    if(new_one)
    {
        i = index_new++;
    } else {
        i = index++;
    }
    let c = {'name': name, 'surname': surname, 'index': i};
    if(surname === 'other')
    {
        c.others = true;
    }
    if(!new_one)
        contestants.push(c);
    else
        contestants_new.push(c);
}

addContestant('Uli', 'Burchardt');
addContestant('Andreas', 'Matt');
addContestant('Jury', 'Martin');
addContestant('Andreas', 'Hennemann');
addContestant('Luigi', 'Pantisano');
addContestant('', 'Andere');

addContestant('Uli', 'Burchardt', true);
addContestant('Andreas', 'Matt', true);
addContestant('Luigi', 'Pantisano', true);
addContestant('', 'Andere', true);

module.exports.city = async (req, res)=>{
    let data = await csv(csv_options).fromStream(request.get(CITY_RESULTS));

    data = parse(data);
    data.result = data.result["1"];
    res.json(data);

};
module.exports.district = async (req, res)=>{
    let data = await csv(csv_options).fromStream(request.get(DISTRICT_RESULTS));

    res.json(parse(data));
};
module.exports.votingdistrict = async (req, res)=>{

    res.json(parse(await csv(csv_options).fromStream(request.get(VOTING_DISTRICT_RESULTS))));
};

module.exports.city_new = async (req, res)=>{
    let data = await csv(csv_options).fromStream(request.get(CITY_RESULTS_NEW));

    data = parse(data, true);
    data.result = data.result["1"];
    res.json(data);

};
module.exports.district_new = async (req, res)=>{
    let data = await csv(csv_options).fromStream(request.get(DISTRICT_RESULTS_NEW));

    res.json(parse(data, true));
};
module.exports.votingdistrict_new = async (req, res)=>{

    res.json(parse(await csv(csv_options).fromStream(request.get(VOTING_DISTRICT_RESULTS_NEW)),true));
};


function parse(json, new_one = false)
{

    let r = {};
    for(let el of json)
    {
        r[Number(el['gebiet-nr'])] = {
            'date': el['datum'],
            'election': el['wahl'],
            'district':
                {
                    'number': Number(el['gebiet-nr']),
                    'name': el['gebiet-name']
                },
            'reportings':
                {
                    'count': el['anz-schnellmeldungen'],
                    'max': el['max-schnellmeldungen']
                },
            'result':
                {
                    'eligible': el['A'],
                    'votes': el['B'],
                    'invalid': el['C'],
                    'valid': el['D'],
                    'contestants':
                        {
                            0: el['D1'],
                            1: el['D2'],
                            2: el['D3'],
                            3: el['D4'],
                            4: el['D5'],
                            5: el['D6'],
                        }
                }
        };
    }

    return {'contestants': new_one ? contestants_new : contestants, 'result': r};
}
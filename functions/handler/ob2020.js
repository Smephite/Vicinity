const CITY_RESULTS = 'https://www.konstanz.de/konstanz/wahlen/OB-Wahl/08335043/html5/Open-Data-Oberbuergermeisterwahl-_Stadt-Konstanz_1-1.csv';
const DISTRICT_RESULTS = 'https://www.konstanz.de/konstanz/wahlen/OB-Wahl/08335043/html5/Open-Data-Oberbuergermeisterwahl-_Stadt-Konstanz_1-40.csv';
const VOTING_DISTRICT_RESULTS = 'https://www.konstanz.de/konstanz/wahlen/OB-Wahl/08335043/html5/Open-Data-Oberbuergermeisterwahl-_Stadt-Konstanz_16.csv';

const csv = require("csvtojson");
const request = require('request-promise-native');

const csv_options = {
    noheader:false,
    output: "json",
    delimiter: ';'
};
var contestants = [];
let index = 0;
function addContestant(name, surname)
{
    let c = {'name': name, 'surname': surname, 'index': index++};
    if(surname === 'other')
    {
        c.others = true;
    }
    contestants.push(c);
}

addContestant('Uli', 'Burchardt');
addContestant('Andreas', 'Matt');
addContestant('Jury', 'Martin');
addContestant('Andreas', 'Hennemann');
addContestant('Luigi', 'Pantisano');
addContestant('Sonstige', 'others');

module.exports.city = async (req, res)=>{
    let data = await csv(csv_options).fromStream(request.get(CITY_RESULTS));

    data = parse(data);
    data.result = data.result[0];
    res.json(data);

};
module.exports.district = async (req, res)=>{
    let data = await csv(csv_options).fromStream(request.get(DISTRICT_RESULTS));

    res.json(parse(data));
};
module.exports.votingdistrict = async (req, res)=>{

    res.json(parse(await csv(csv_options).fromStream(request.get(VOTING_DISTRICT_RESULTS))));
};


function parse(json)
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

    return {'contestants': contestants, 'result': r};
}
const CITY_RESULTS = 'https://wahlergebnisse.komm.one/03/produktion/wahltermin-20210314/08335043/html5/Open-Data-Landtagswahl-BW-2021-_Land-BW_172-1618.csv';
const DISTRICT_RESULTS = 'https://wahlergebnisse.komm.one/03/produktion/wahltermin-20210314/08335043/html5/Open-Data-Landtagswahl-BW-2021-_Land-BW_172-1619.csv';
const VOTING_DISTRICT_RESULTS = 'https://wahlergebnisse.komm.one/03/produktion/wahltermin-20210314/08335043/html5/Open-Data-Landtagswahl-BW-2021-_Land-BW_1726.csv';

const csv = require("csvtojson");
const request = require('request-promise-native');

const csv_options = {
    noheader:false,
    output: "json",
    delimiter: ';'
};

let map_district = {
    0: [9, 10],
    1: [12],
    2: [4, 5],
    3: [3],
    4: [11],
    5: [6],
    6: [2, 1],
    7: [14],
    8: [8],
    9: [7],
    10: [13, 0]
}

var contestants = [];
let _index = 0; 

function addContestant(name, surname, party, id = undefined)
{
    let i = _index;
    if(id)
    {
        i = _index = id;
    }

    ++_index;

    let c = {'name': name, 'surname': surname, 'index': i, 'party': party};
    if(surname === 'other')
    {
        c.others = true;
    }
    
    contestants[i] = c;

}

addContestant("", "Erikli", "Grüne");
addContestant("", "Eisenmann", "CDU");
addContestant("", "Otterbach", "AfD");
addContestant("", "Rietzler", "SPD");
addContestant("", "Keck", "FDP");
addContestant("", "Behler", "Die Linke");
addContestant("", "Weber", "ÖDP");
addContestant("", "Weimer", "Die Partei", 9);
addContestant("", "Burkart", "Freie Wähler");
addContestant("", "Schiffer", "KlimalisteBW", 17);
addContestant("", "Huß", "W2020", 20);
addContestant("", "Antony", "Volt");


module.exports.city = async (req, res)=>{
    let data = await csv(csv_options).fromStream(request.get(CITY_RESULTS));

    data = parse(data);
    data.result = data.result["0"];
    res.json(data);

};
module.exports.district = async (req, res)=>{
    let data = await csv(csv_options).fromStream(request.get(DISTRICT_RESULTS));

    res.json(parse(data, true));
};
module.exports.votingdistrict = async (req, res)=>{

    res.json(parse(await csv(csv_options).fromStream(request.get(VOTING_DISTRICT_RESULTS))));
};


function parse(json, map = false)
{

    let r = {};
    var index = -1;
    for(let el of json)
    {
        

        number = el['gebiets-nr'] ? index = Number(el['gebiets-nr']) : ++index;

        r[number] = {
            'date': el['datum'],
            'election': el['wahl'],
            'district':
                {
                    'number': map ? map_district[number] : number,
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
                            6: el['D7'],

                            9: el['D9'],
                            10: el['D10'],

                            17: el['D17'],
                            20: el['D20'],
                            21: el['D21'],
                        }
                }
        };
    }

    return {'contestants': contestants, 'result': r};
}
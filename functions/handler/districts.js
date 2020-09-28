const GEO_DATA_OLD = 'https://opendata.arcgis.com/datasets/432d03ee77fd4a55ae1199c602829e3c_0.geojson';
const GEO_DATA_2018 = 'https://opendata.arcgis.com/datasets/a2820aa8331147d59e7ddb17b13205a3_0.geojson';
const GEO_DATA_2020 = 'https://offenedaten-konstanz.de/sites/default/files/Wahlbezirke-OB-Wahl-2020.json';
const GEO_DATA_DISTRICTS = 'https://opendata.arcgis.com/datasets/7863e8018ca24f63858cfaa289e7009d_0.geojson';

const request = require('request-promise-native');

module.exports.voting_ob2020 = async (req, res, next) =>{

        let r = await request(GEO_DATA_2020);
        let data = JSON.parse(r);

        data = data[1]['features'];

        let districts = [];

        for(let dis of data)
        {
            let district = {};
            district.name = dis['properties']['Beschriftung'];
            district.number = Number(dis['properties']['WB_NR']);

            let geo = [];

            for(let bounds of dis['geometry']['coordinates'])
            {
                let points = [];
                if(Array.isArray(bounds) && bounds.length === 1)
                {
                    bounds = bounds[0];
                }
                for(let point of bounds)
                {
                    points.push({lat: point[1],lng: point[0]})
                }
                geo.push(points);
            }


            district.geometry = geo;

            districts.push(district);
        }

        res.json(districts);

};
module.exports.voting_2018 = async (req, res, next)=>{
    let r = await request(GEO_DATA_2018);
    let data = JSON.parse(r);
    data = data['features'];
    let districts = [];

    for(let dis of data)
    {
        let district = {};
        district.name = dis['properties']['Gebäude'];
        district.number = Number(dis['properties']['WB_NR']);
        district.geometry = dis['geometry']['coordinates'];
        districts.push(district);
    }

    res.json(districts);
};
module.exports.voting_old = async (req, res, next)=>{
    let r = await request(GEO_DATA_OLD);
    let data = JSON.parse(r);
    data = data['features'];
    let districts = [];

    for(let dis of data)
    {
        let district = {};
        district.number = Number(dis['properties']['WB_NR']);
        district.geometry = dis['geometry']['coordinates'];
        districts.push(district);
    }

    res.json(districts);
};
module.exports.districts = async (req, res, next)=>{
    let r = await request(GEO_DATA_DISTRICTS);
    let data = JSON.parse(r);
    data = data['features'];
    let districts = [];

    for(let dis of data)
    {
        let district = {};
        district.name = dis['properties']['STT_NAME'];
        district.number = Number(dis['properties']['STT']);
        district.geometry = dis['geometry']['coordinates'];
        districts.push(district);
    }

    res.json(districts);
};
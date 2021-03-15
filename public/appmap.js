const Map = {
    map: null,
    infoWindow: null,
    mapResolve: null,
    drawnPolys: [],
    initiateMap()
    {
        Map.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 47.707216, lng: 9.168514},
            zoom: 13,
            styles: [{
                featureType: 'poi',
                stylers: [{ visibility: 'off' }]  // Turn off points of interest.
            }].concat(map_style),
            disableDoubleClickZoom: false,
            streetViewControl: false,
            disableDefaultUI: true,
            restriction: {
                latLngBounds: KONSTANZ_MAP_BOUNDS,
                strictBounds: false
            }
        });
        Map.mapResolve();
        //console.info("Map done");
        Map.infoWindow = new google.maps.InfoWindow();

        Map.map.controls[google.maps.ControlPosition.TOP_LEFT].push($('div.control')[0]);
    },
    drawDistricts(districts, clickHandler)
    {
        if(Map.drawnPolys !== [])
        {
            for(let poly of Map.drawnPolys)
            {
                poly.setMap(null);
                poly = null;
            }
            Map.drawnPolys = [];
        }

        let polygons = [];
        for(let district of districts)
        {
            //console.info(district)
            for(let bound of district.geometry)
            {
                let poly = new google.maps.Polygon({
                    paths: bound,
                    strokeColor: Map.getDistrictColor(district),
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: Map.getDistrictColor(district),
                    fillOpacity: 0.4,

                });
                poly.setMap(Map.map);
                poly.addListener("click", (e)=>clickHandler(e, district));
                polygons.push(poly);
            }
        }
        Map.drawnPolys = polygons;
        return polygons;
    },
    getDistrictColor(district)
    {
        return '#00000';
    }
};
const AppMap = {
    map: null,
    infoWindow: null,
    mapResolve: null,
    drawnPolys: [],
    initiateMap()
    {
        AppMap.map = new google.maps.Map(document.getElementById('map'), {
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
        AppMap.mapResolve();
        //console.info("AppMap done");
        AppMap.infoWindow = new google.maps.InfoWindow();

        AppMap.map.controls[google.maps.ControlPosition.TOP_LEFT].push($('div.control')[0]);
    },
    drawDistricts(districts, clickHandler)
    {
        if(AppMap.drawnPolys !== [])
        {
            for(let poly of AppMap.drawnPolys)
            {
                poly.setMap(null);
                poly = null;
            }
            AppMap.drawnPolys = [];
        }

        let polygons = [];
        for(let district of districts)
        {
            //console.info(district)
            for(let bound of district.geometry)
            {
                let poly = new google.maps.Polygon({
                    paths: bound,
                    strokeColor: AppMap.getDistrictColor(district),
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: AppMap.getDistrictColor(district),
                    fillOpacity: 0.4,

                });
                poly.setMap(AppMap.map);
                poly.addListener("click", (e)=>{if(clickHandler){clickHandler(e, district)}});
                polygons.push(poly);
            }
        }
        AppMap.drawnPolys = polygons;
        return polygons;
    },
    getDistrictColor: app.districtColor
};



const KONSTANZ_GPS = {lat: 47.707216, lng: 9.168514};

const map_style = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
    },
];

const KONSTANZ_MAP_BOUNDS = {
    north: 47.764495,
    west: 9.017154,
    east: 9.271572,
    south: 47.614151
};

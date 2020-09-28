const app = {
    loadingPromises: [],
    storage: {},
    mapResolve: null,
    infoWindow: null,
    map: null,
    load(){
        let color = app.loadColors();
        app.loadingPromises.push(color, app.loadElectionData(), app.loadElectionDistricts(), new Promise((resolve => app.mapResolve = resolve)));
        Promise.all(app.loadingPromises).then(app.drawMap);
        Promise.all([app.loadCityElectionData(), color]).then(app.initCityStats)
    },
    drawMap(){
        for(let district of app.storage.districts)
        {
            //console.info(district)
            for(let bound of district.geometry)
            {
                let poly = new google.maps.Polygon({
                    paths: bound,
                    strokeColor: app.districtWinnerColor(district),
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: app.districtColor(district),
                    fillOpacity: 0.4,
                });
                poly.setMap(map);
                poly.addListener("click", (e)=>app.showInfo(e, district));
            }
        }
    },
    getWinner(district) {
        let contestant = app.storage.election.result[district.number/10]['result']['contestants'];
        //console.info(district.number, district.number/10)
        let max_i = 0;

        for(let i = 0; i < Object.keys(contestant).length; ++i)
        {
            // console.info(contestant[max_i], contestant[i]);
            if(Number(contestant[max_i]) < Number(contestant[i]))
            {
                //console.info('<');
                max_i = i;
            }
        }

        return max_i;
    },
    districtWinnerColor(district) {

        return app.storage.colors[app.getWinner(district)];

    },
    districtColor(district) {

        let r = 0, g = 0, b = 0, votes = 0;
        let contestants = app.storage.election.result[district.number/10]['result']['contestants'];
        for(let i = 0; i < Object.keys(contestants).length; ++i)
        {
            let rgb = util.hexToRgb(app.storage.colors[i]);
            r+=rgb.r*contestants[i];
            g+=rgb.g*contestants[i];
            b+=rgb.b*contestants[i];
            votes+=Number(contestants[i]);
        }

        let winnerRgb = util.hexToRgb(app.districtWinnerColor(district));
        let perc = votes/100*100; // 10%
        votes+=perc;
        r+=winnerRgb.r*perc;
        g+=winnerRgb.g*perc;
        b+=winnerRgb.b*perc;
        //console.info(votes);

        r/=votes;
        g/=votes;
        b/=votes;

        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);

        return util.rgbToHex(r, g, b);

    },
    loadElectionData(){
        return new Promise((resolve)=>{
            $.get('/api/elections/ob2020/district', (data) =>{
                app.storage.election = typeof data === "string" ? JSON.parse(data) : data;
                //console.info('geo data done');
                resolve();
            });
        });
    },
    loadElectionDistricts(){
        return new Promise((resolve)=>{
            $.get('/api/geo/election_districts/2020', function (data) {
                app.storage.districts = typeof data === "string" ? JSON.parse(data) : data;
                //console.info('election data done');
                resolve();
            }) ;
        })
    },
    loadColors(){
        return new Promise((resolve =>
            $.get('/api/color/2020', function (data) {
                app.storage.colors = typeof data === "string" ? JSON.parse(data) : data;
                //console.info('color done');
                resolve();
        })));
    },
    loadCityElectionData(){
        return new Promise((resolve)=>{
            $.get('/api/elections/ob2020/city', (data) =>{
                app.storage.electionCity = typeof data === "string" ? JSON.parse(data) : data;
                resolve();
            });
        });
    },
    initCityStats(){

        let ctx = document.getElementById('election_result_chart');

        let data = app.storage.electionCity;
        let contestants = data.contestants;
        let result = data.result.result;

        let barChartData = {datasets: []};

        if(app.storage.colors[0] === undefined)
        {
            console.error(app.storage.colors);
        }

        for(let i = 0; i < contestants.length; ++i)
        {
            barChartData.datasets.push({label: `${contestants[i].name} ${contestants[i].surname}`, data: [(result.contestants[i]/result.valid*100).toFixed(2)], backgroundColor: app.storage.colors[i]});
        }
        barChartData.datasets.sort((a, b)=>{return b.data[0]-a.data[0]});

        var myChart = new Chart(ctx, {
            type: 'bar',
            data: barChartData,
            options: {
                legend: {
                    display: true
                },
                maintainAspectRatio: false
            }
        });
        $('#statbtn').show();
    },
    initMap(){
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 47.707216, lng: 9.168514},
            zoom: 13,
            styles: [{
                featureType: 'poi',
                stylers: [{ visibility: 'off' }]  // Turn off points of interest.
            }],
            disableDoubleClickZoom: false,
            streetViewControl: false,
            disableDefaultUI: true
        });
        app.mapResolve();
        //console.info("Map done");
        app.infoWindow = new google.maps.InfoWindow();
    }
};


app.showInfo = (event, district) => {
    const polygon = this;

    let content =
        `${district.name} (${district.number})<br>`;

    if(app.storage.election !== undefined) {
        let result = app.storage.election.result[district.number / 10].result;
        content += `Wähler / Berechtigte: ${result.votes} / ${result.eligible}<br>` +
            `Wahlquote: ${Math.fround(result.votes / result.eligible * 100).toFixed(2)}%<br>` +
            `Gewinner: <b>${app.storage.election.contestants[app.getWinner(district)].surname}</b><br>` +
            `Ungültig: ${result.invalid}</br><br>`;

        let pieChartData = {datasets: [{data:[], backgroundColor: []}], labels:[]};
        let barChartData = {datasets: []};

        for (let i = 0; i < Object.keys(result.contestants).length; ++i) {
            let winner = app.getWinner(district) === i;

            if (winner)
                content += `<b>`;

            content += `${app.storage.election.contestants[i].surname}: ${result.contestants[i]} (${(result.contestants[i]/result.votes*100).toFixed(2)}%)<br>`;

            if (winner)
                content += `</b>`;

            let color = app.storage.colors[i], surname = app.storage.election.contestants[i].surname, votes = result.contestants[i];

            pieChartData.datasets[0].data.push(votes);
            pieChartData.datasets[0].backgroundColor.push(app.storage.colors[i]);
            pieChartData.labels.push(surname);

            barChartData.datasets.push({label: surname, data: [votes], backgroundColor: color})


        }

        content += `<canvas id = "chart"> </canvas>`;


        app.infoWindow.setContent(content);
        app.infoWindow.setPosition(event.latLng);
        app.infoWindow.open(map);

        barChartData.datasets.sort((a, b)=>{return b.data[0]-a.data[0]});


        app.infoWindow.addListener("domready", (e) => {

            var ctx = document.getElementById("chart");
            var myChart = new Chart(ctx, {
                type: 'bar',
                data: barChartData,
                options: {
                    legend: {
                        display: false
                    }
                }
            });

        });
    }

};

const util = {
    hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    rgbToHex(r, g, b) {
        return "#" + util.componentToHex(r) + util.componentToHex(g) + util.componentToHex(b);
    },
    componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
};


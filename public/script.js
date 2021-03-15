const app = {
    loadingPromises: [],
    storage: {},
    load(){
        let color = app.loadColors();
        app.loadingPromises.push(color, app.loadElectionData(), app.loadElectionDistricts(), new Promise((resolve => AppMap.mapResolve = resolve)));
        Promise.all(app.loadingPromises).then(app.drawMap);
        Promise.all([app.loadCityElectionData(), color]).then(app.initCityStats)
    },
    drawMap(){
        AppMap.drawDistricts(app.storage.districts, app.showInfo);
    },
    getWinner(district) {
        let contestant = app.findDistrict(district)['result']['contestants'];
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
    findDistrict(district){
        if(typeof app.storage.election.result[0].district.number === "object")
            {
                for(let d in app.storage.election.result)
                {
                    let o = app.storage.election.result[d];
                    if(o.district.number.indexOf(Math.round(district.number/10)) === -1)
                        continue;
                    return o;
                }
            } else {
                return 
                app.storage.election.result[district.number/10];
            }
    },

    districtColor(district) {
        let districtResult = app.findDistrict(district);
        
        let r = 0, g = 0, b = 0, votes = 0;
        let contestants = districtResult['result']['contestants'];
        for(let i = 0; i < Object.keys(contestants).length; ++i)
        {
            if(!contestants[i])continue;
            let rgb = util.hexToRgb(app.storage.colors[i]);
            r+=rgb.r*contestants[i];
            g+=rgb.g*contestants[i];
            b+=rgb.b*contestants[i];
            votes+=Number(contestants[i]);
        }

        let winnerRgb = util.hexToRgb(app.districtWinnerColor(district));
        /*let perc = votes/100*5; // 10%
        votes+=perc;
        r-=winnerRgb.r*perc;
        g-=winnerRgb.g*perc;
        b-=winnerRgb.b*perc;
        //console.info(votes);
*/
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
            $.get('/api/elections/lw2021/district', (data) =>{
                app.storage.election = typeof data === "string" ? JSON.parse(data) : data;
                //console.info('geo data done');
                resolve();
            });
        });
    },
    loadElectionDistricts(){
        return new Promise((resolve)=>{
            $.get('/api/geo/districts', function (data) {
                app.storage.districts = typeof data === "string" ? JSON.parse(data) : data;
                //console.info('election data done');
                resolve();
            }) ;
        })
    },
    loadColors(){
        return new Promise((resolve =>
            $.get('/api/color/lw2021', function (data) {
                app.storage.colors = typeof data === "string" ? JSON.parse(data) : data;
                //console.info('color done');
                resolve();
        })));
    },
    loadCityElectionData(){
        return new Promise((resolve)=>{
            $.get('/api/elections/lw2021/city', (data) =>{
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
            if(!contestants[i])
                continue;
            let party = contestants[i].party ? `, ${contestants[i].party}` : "";
            barChartData.datasets.push({label: `${contestants[i].name} ${contestants[i].surname}${party}`, data: [(result.contestants[i]/result.valid*100).toFixed(2)], backgroundColor: app.storage.colors[i]});
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
    }
};


app.showInfo = (event, district) => {
    const polygon = this;

    let content =
        `${district.name} (${district.number})<br>`;

    if(app.storage.election !== undefined) {
        let result = app.findDistrict(district).result;
        content += `Wähler / Berechtigte: ${result.votes} / ${result.eligible}<br>` +
            `Wahlquote: ${Math.fround(result.votes / result.eligible * 100).toFixed(2)}%<br>` +
            `Gewinner: <b>${app.storage.election.contestants[app.getWinner(district)].surname}</b><br>` +
            `Ungültig: ${result.invalid}</br><br>`;

        let pieChartData = {datasets: [{data:[], backgroundColor: []}], labels:[]};
        let barChartData = {datasets: []};

        for (let i = 0; i < Object.keys(app.storage.election.contestants).length; ++i) {
            if(!app.storage.election.contestants[i])
                continue;
            let winner = app.getWinner(district) === i;

            if (winner)
                content += `<b>`;

            let votes = result.contestants[i] ? result.contestants[i] : 0;
            let party = app.storage.election.contestants[i].party ? `, ${app.storage.election.contestants[i].party}` : "";
            
            content += `${app.storage.election.contestants[i].surname}${party}: ${votes} (${(votes/result.votes*100).toFixed(2)}%)<br>`;

            if (winner)
                content += `</b>`;

            let color = app.storage.colors[i], surname = app.storage.election.contestants[i].surname;

            pieChartData.datasets[0].data.push(votes);
            pieChartData.datasets[0].backgroundColor.push(app.storage.colors[i]);
            pieChartData.labels.push(`${surname}${party}`);

            barChartData.datasets.push({label: `${surname}${party}`, data: [votes], backgroundColor: color})


        }

        content += `<canvas id = "chart"> </canvas>`;


        AppMap.infoWindow.setContent(content);
        AppMap.infoWindow.setPosition(event.latLng);
        AppMap.infoWindow.open(AppMap.map);

        barChartData.datasets.sort((a, b)=>{return b.data[0]-a.data[0]});


        google.maps.event.addListener(AppMap.infoWindow, 'domready', ()=>{
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

            google.maps.event.clearInstanceListeners(AppMap.infoWindow);
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
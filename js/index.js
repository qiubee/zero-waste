/*jshint esversion: 8 */

visualize();

async function visualize() {
const data = await d3.json("data/data(part).json");
drawMap(data);
createHeatmap(data);
createBarChart(data);
}

async function drawMap(data) {
    // Heatmap (http://www.d3noob.org/2014/02/generate-heatmap-with-leafletheat-and.html)
    // https://bl.ocks.org/mbostock/3074470, https://observablehq.com/@d3/volcano-contours
    // & https://github.com/d3/d3-contour

    // Zoom (source: https://bl.ocks.org/mbostock/2206590)

    const stadsdelen = await d3.json("data/GEBIED_STADSDELEN.json");
    const buurten = await d3.json("data/GEBIED_BUURTEN_EXWATER.json");

    const width = 675;
    const height = 485;
    // const proj = d3.geoMercator().scale(100000).translate([-8250, 107850]);
    // const proj = d3.geoMercator().scale(150000).translate([-12375, 161800]);
    // const proj = d3.geoMercator().scale(130000).translate([-10700, 140200]);
    const proj = d3.geoMercator().scale(110000).translate([-9075, 118630]);
    const path = d3.geoPath().projection(proj);

    const svg =  d3.select("#heatmap")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
        // .attr("viewBox", "0 0 " + width + " " + height);
    
    // svg.append("g")
    //     .selectAll("path")
    //     .data(buurten.features)
    //     .enter()
    //     .append("path")
    //     .attr("d", path);
    
    svg.append("g")
        .selectAll("path")
        .data(stadsdelen.features)
        .enter()
        .append("path")
        .attr("d", path)
        .on("click", function (d) {
            // zoom.call(this, d);
            addBuurten.call(this, d);
        });

    // Zoom function from Mike Bostock (source: https://bl.ocks.org/mbostock/2206590)
    function zoom(d) {
        let x, y, k, centered;

        console.log(this.getBBox().width / width);

        if (d && centered !== d) {
            let centroid = path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            k = this.getBBox().width / width + 1;
            centered = d;
        } 

        // if (d.properties.Stadsdeel_code == "N") {
        //     let centroid = path.centroid(d);
        //     x = centroid[0];
        //     y = centroid[1];
        //     k = 1.5;
        //     centered = d;
        // }

        svg.select("g")
            .selectAll("path")
            .classed("active", centered && function (d) { return d === centered; });

        svg.select("g").transition()
            .duration(600)
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");
    }

    function addBuurten(d) {

        svg.select("#buurten").remove();

        let data = [];
        buurten.features.map(function (item) {
            if (item.properties.Stadsdeel_code === d.properties.Stadsdeel_code) {
                data.push(item);
            }
        });

        svg.append("g")
            .attr("id", "buurten")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("d", path);

    }

    function resetZoom(d) {
            x = width / 2;
            y = height / 2;
            k = 1;
            centered = null;
        
        svg.select("g").selectAll("path")
            .classed("active", centered && function (d) { return d === centered; });
    }
}

function createHeatmap(data) {
    // Heatmap chart (https://www.d3-graph-gallery.com/graph/heatmap_style.html)

    const filtered = d3.nest().key(function (d) {
        return d.categorie;
    })
    .entries(data)
    .map(function (d) {
        let m, din, w, don, v, za, zo;
        m=din=w=don=v=za=zo=0;
        const dagen = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
        let f = [];
        for (let obj of d.values) {
            const arr = Object.entries(obj.afval);
            for (let item of arr) {
                switch (item[0]) {
                    case dagen[0].substring(0,2):
                        m += item[1];
                        break;
                    case dagen[1].substring(0,2):
                        din += item[1];
                        break;
                    case dagen[2].substring(0,2):
                        w += item[1];
                        break;
                    case dagen[3].substring(0,2):
                        don += item[1];
                        break;
                    case dagen[4].substring(0,2):
                        v += item[1];
                        break;
                    case dagen[5].substring(0,2):
                        za += item[1];
                        break;
                    case dagen[6].substring(0,2):
                        zo += item[1];
                        break;
                }
            }
        }
        for (let dag of dagen) {
            switch (dag) {
                case dagen[0]:
                    f.push({
                        categorie: d.key,
                        dag: dagen[0],
                        afval: m
                    });
                    break;
                case dagen[1]:
                    f.push({
                        categorie: d.key,
                        dag: dagen[1],
                        afval: din
                    });
                    break;
                case dagen[2]:
                    f.push({
                        categorie: d.key,
                        dag: dagen[2],
                        afval: w
                    });
                    break;
                case dagen[3]:
                    f.push({
                        categorie: d.key,
                        dag: dagen[3],
                        afval: don
                    });
                    break;
                case dagen[4]:
                    f.push({
                        categorie: d.key,
                        dag: dagen[4],
                        afval: v
                    });
                    break;
                case dagen[5]:
                    f.push({
                        categorie: d.key,
                        dag: dagen[5],
                        afval: za
                    });
                    break;
                case dagen[6]:
                    f.push({
                        categorie: d.key,
                        dag: dagen[6],
                        afval: zo
                    });
                    break;
            }
        }
        return f;
    });
    // source https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays
    const dataset = [].concat.apply([], filtered);
    
    const categorie = d3.map(dataset, function (d) {return d.categorie;}).keys();
    const dag = d3.map(dataset, function (d) {return d.dag;}).keys();
    const width = 700;
    const height = 700;

    const svg = d3.select("#comparison-chart")
        .append("svg")
        .attr("width", width + 200)
        .attr("height", height + 50)
        .append("g")
        .attr("transform", "translate(" + 200 + "," + 50 + ")");

    const x = d3.scaleBand()
        .range([0, width])
        .domain(dag)
        .padding(0.02);

    const y = d3.scaleBand()
        .range([height, 0])
        .domain(categorie)
        .padding(0.04);

    const colors = d3.scaleThreshold()
    .domain([1, 50, 100, 500, 1000, 5000])
    .range(["#f9f3cf", "#f5da93", "#f79767", "#f0594e", "#9b3040", "#5c1c26"]);

    svg.append("g")
        .attr("transform", "translate(0, -5)")
        .call(d3.axisTop(x).tickSize(0))
        .select(".domain").remove();
    
    svg.append("g")
        .attr("transform", "translate(-5, 0)")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll(".tick text")
        .call(wrap, 175);

    svg.select(".domain").remove();

    svg.selectAll()
        .data(dataset)
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d.dag); })
        .attr("y", function(d) { return y(d.categorie); })
        .attr("rx", 1)
        .attr("ry", 1)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", function(d) { return colors(d.afval); } );
}

function createBarChart(data) {
    const dataset = d3.nest().key(function (d) {
            return d.categorie;
        })
        .entries(data)
        .map(function (d) {
            for (let obj of d.values) {
                const arr = Object.entries(obj.afval);
                let i = 0,
                    totaal = 0;
                for (let item of arr) {
                    i += 1;
                    totaal += item[1];
                }
                return {
                    categorie: d.key,
                    gemiddelde: Math.round(totaal/i)
                };
            }
        });
    
    const width = 600;
    const height = 400;

    const svg = d3.select("#bar-chart")
        .append("svg")
        .attr("width", width + 50)
        .attr("height", height + 25)
        .append("g")
        .attr("transform", "translate(" + 50 + ",0)");

    const x = d3.scaleOrdinal()
        .domain([0, 11])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, 2500])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisBottom(x).tickSize(0))
        .attr("transform", "translate(0," + height + ")");

    svg.append("g")
        .call(d3.axisLeft(y).tickSize(0));

    svg.selectAll()
        .data(dataset)
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d.categorie); })
        .attr("y", function(d) { return y(d.gemiddelde); })
        .attr("width", 90)
        .attr("height", function(d) { return height - y(d.gemiddelde); });
}

// Wrap function from Mike Bostock (source: https://bl.ocks.org/mbostock/7555321)
function wrap(text, width) {
    text.each(function () {
        let text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", 0)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", 0)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
}
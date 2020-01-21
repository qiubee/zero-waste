/*jshint esversion: 8 */

visualize();

async function visualize() {
let data = await d3.json("data/data(complete).json");
drawMap(data);
createHeatmap(data);
createBarChart(data);
}

async function drawMap(data) {
    // Heatmap (http://www.d3noob.org/2014/02/generate-heatmap-with-leafletheat-and.html)
    // https://bl.ocks.org/mbostock/3074470, https://observablehq.com/@d3/volcano-contours
    // https://github.com/d3/d3-contour, https://bl.ocks.org/mbostock/3289530 
    // https://observablehq.com/@mbostock/diamonds-contours
    
    // Zoom 
    // https://bl.ocks.org/mbostock/2206590, https://observablehq.com/@d3/zoom-to-bounding-box
    // https://bl.ocks.org/mbostock/4699541

    const stadsdelen = await d3.json("data/GEBIED_STADSDELEN.json");
    const buurten = await d3.json("data/GEBIED_BUURTEN_EXWATER.json");

    const width = 680;
    const height = 485;
    const proj = d3.geoMercator().scale(110000).translate([-9075, 118630]);
    const path = d3.geoPath().projection(proj);

    const svg =  d3.select("#heatmap")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("rect")
        .attr("height", height)
        .attr("width", width)
        .on("click",  resetZoom);
    
    svg.append("g")
        .selectAll("path")
        .data(stadsdelen.features)
        .enter()
        .append("path")
        .attr("d", path)
        .on("click", function (d) {
            zoom.call(this, d);
            addBuurten.call(this, d);
            filterData.call(this, d);
        });


    // Zoom function from Mike Bostock (source: https://bl.ocks.org/mbostock/2206590)
    function zoom(d) {
        let x, y, k, centered;
        // console.log(this.__data__.properties.Stadsdeel + ":", this.__data__.properties.Stadsdeel_code);

        if (d && centered !== d) {
            let centroid = path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            switch (this.__data__.properties.Stadsdeel_code) {
                case "A":
                    y += -5;
                    k = 4.5;
                    break;
                case "B":
                    x += 15;
                    k = 2.2;
                    break;
                case "E":
                    y += 5;
                    k = 3.4;
                    break;
                case "F":
                    y += 8;
                    k = 2;
                    break;
                case "K":
                    x += -16;
                    k = 3.5;
                    break;
                case "M":
                    y += 20;
                    x += 10;
                    k = 2.25;
                    break;
                case "N":
                    x += - 15;
                    k = 1.5;
                    break;
                case "T":
                    x += 10;
                    y += 5;
                    k = 2.8;
                    break;
            }
            centered = d;
        }

        svg.select("g")
            .selectAll("path")
            .classed("zoom", centered && function (d) { return d === centered; });

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

        svg.select("g")
            .append("g")
            .attr("id", "buurten")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("d", path)
            .on("click", function (d) {
                filterData.call(this, d);
            });

    }

    function filterData (d) {

        if (d.properties.hasOwnProperty("Buurt")) {
            let f = [];
            data.map(function (item) {
                if (item.buurtcode === d.properties.Buurt_code) {
                    f.push(item);
                }
            });
            // check(f);
            updateHeatmap(f, d);
        } else if (d.properties.hasOwnProperty("Stadsdeel")) {
            let f = [];
            data.map(function (item) {
                if (item.stadsdeel === d.properties.Stadsdeel_code) {
                    f.push(item);
                }
            });
            // check(f);
            updateHeatmap(f, d);
        }
        
        function check(data) {
            if (data.length >= 1) {
                if (d.properties.hasOwnProperty("Buurt")) {
                    console.log("Buurt", d.properties.Buurt, "heeft data", data);
                } else {
                    console.log("Stadsdeel", d.properties.Stadsdeel, "heeft data:", data);
                }
            }
            if (data.length === 0) {
                if (d.properties.hasOwnProperty("Buurt")) {
                    console.log("Buurt", d.properties.Buurt, "heeft geen data");
                } else {
                    console.log("Stadsdeel", d.properties.Stadsdeel, "heeft geen data");
                }
            }
        }
        
        
    }

    function resetZoom() {
            let zoom = d3.select("#heatmap .zoom");
            zoom.classed("zoom", false);
            zoom = d3.select(null);

            x = width / 2;
            y = height / 2;
            k = 1;
            centered = null;

            svg.select("g")
                .transition()
                .duration(600)
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

            svg.selectAll("#buurten")
                .remove();

            updateHeatmap(data);
    }

}

function createHeatmap(data) {
    // Heatmap chart (https://www.d3-graph-gallery.com/graph/heatmap_style.html)

    setupDataHeatmap(data);

    const width = 1000;
    const height = 900;
    const margin = {left: 280, top: 180, right: 5};
    const labels = ["0", "1 - 50", "50 - 100", "100 - 500", "500 - 1000", "1000 - 5000", "5000+"];

    const colors = d3.scaleThreshold()
    .domain([0, 1, 50, 100, 500, 1000, 5000])
    .range(["#f9f3cf", "#f9f3cf", "#f5da93", "#f79767", "#f0594e", "#9b3040", "#5c1c26", "#240C10"]);

    const svg = d3.select("#comparison-chart")
        .append("svg")
        .attr("width", width + margin.left)
        .attr("height", height + margin.top)
        .append("g")
        .attr("transform", "translate(" + (margin.left - margin.right) + "," + margin.top + ")");

    const legend = svg.append("g")
        .attr("transform", "translate(" + (margin.left / 16.5) + "," + (-margin.top / 1.5) + ")");

    svg.append("text")
        .text("Amsterdam")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(-135, -85)");

    svg.append("g")
        .attr("class", "x")
        .attr("transform", "translate(0, -6)");
    
    svg.append("g")
        .attr("class", "y")
        .attr("transform", "translate(-12, 0)");

    svg.select(".domain").remove();

    svg.append("g")
        .selectAll()
        .data(dataset)
        .enter()
        .append("rect")
        .attr("class", "data")
        .on("click", function (d, i) { // add class for selected filter
            // return !d3.select(this).classed("selected");
        });

    updateHeatmap(data);

    legend.append("text")
        .text("Aantal afvalzakken")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + (width / 2.055) + ", -20)");

    legend.selectAll("g")
        .data(colors.domain())
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(" + (i * 140) + ", 0)";
        })
        .append("rect")
        .attr("width", 130)
        .attr("height", 13)
        .attr("fill", colors);

    legend.selectAll("g")
        .append("text")
        .text(function (d, i) {
            return labels[i];
        })
        .attr("text-anchor", "middle")
        .attr("transform", "translate(65, 40)");

}

function createBarChart(data) {
    data = setupDataBarChart(data);

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
        .data(data)
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

function fixWrapYPosition(text) {
    text.each(function () {
        let text = d3.select(this);

        // fix Y positioning
        switch (text.node().childNodes.length) {
            case 2:
                d3.select(this)
                    .attr("transform", "translate(0,-10)");
                break;
            case 3:
                d3.select(this)
                    .attr("transform", "translate(0,-18)")
                    .select("tspan:nth-of-type(2)")
                    .attr("dy", function (d) {
                        dy = Number(this.getAttribute("dy").replace("em", ""));
                        return dy - 0.2 + "em";
                    });

                d3.select(this)
                    .select("tspan:last-of-type")
                    .attr("dy", function (d) {
                        dy = Number(this.getAttribute("dy").replace("em", ""));
                        return dy - 1.25 + "em";
                    });
                break;
        }
    });
}

function fixWrapTitlePosition(text) {
    text.each(function () {
        let text = d3.select(this);

        if (text.select("tspan:first-of-type")._groups[0][0].textContent === "") {
            text.select("tspan:first-of-type").remove();
            return;
        }

        // fix Y positioning
        switch (text.node().childNodes.length) {
            case 1:
                return;
            case 2:
                text.select("tspan:first-of-type")
                    .attr("dy", "-0.6em");

                text.select("tspan:last-of-type")
                    .attr("dy", "1.3em");
                break;
        }
    });
}

function setupDataMap(data) {
    return data.map(function (d) {
            const arr = Object.entries(d.afval);
            let i = 0,
                totaal = 0;
            for (let item of arr) {
                i += 1;
                totaal += item[1];
            }
            return totaal;
    });
}

function setupDataHeatmap(data) {
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
    return dataset = [].concat.apply([], filtered);
}

function setupDataBarChart(data) {
    return dataset = d3.nest().key(function (d) {
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
}

function updateHeatmap(data, el = "Amsterdam") {
    data = setupDataHeatmap(data);
    const categorie = d3.map(data, function (d) { return d.categorie;} ).keys();
    const dag = d3.map(data, function (d) { return d.dag;} ).keys();
    const width = 1000;
    const height = 900;

    const colors = d3.scaleThreshold()
    .domain([0, 1, 50, 100, 500, 1000, 5000])
    .range(["#f9f3cf", "#f9f3cf", "#f5da93", "#f79767", "#f0594e", "#9b3040", "#5c1c26", "#240C10"]);

    const svg = d3.select("#comparison-chart svg > g");

    const x = d3.scaleBand()
        .range([0, width])
        .domain(dag)
        .padding(0.02);

    const y = d3.scaleBand()
        .range([height, 0])
        .domain(categorie)
        .padding(0.04);

    const selection = svg.selectAll(".data")
        .data(data)
        .attr("x", function(d) { return x(d.dag); })
        .attr("y", function(d) { return y(d.categorie); })
        .attr("rx", 1)
        .attr("ry", 1)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", function(d) { return colors(d.afval); })
        .on("mouseover", function(d) {
            if (d.afval === 0) {
                return;
            }
            
            el = d3.select(this)
                .transition()
                .duration(175)
                .attr("width", x.bandwidth() + 10)
                .attr("height", y.bandwidth() + 10)
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("x", function(d) { return x(d.dag) - 4; })
                .attr("y", function(d) { return y(d.categorie) - 4; })
                // .style("translate", "matrix(sx, 0, 0, sy, cx-sx*cx, cy-sy*cy)")
                .style("filter", "drop-shadow(0 0 1em rgba(0, 0, 0, .25))")
                .style("cursor", "pointer");

                // https://stackoverflow.com/questions/13595175/updating-svg-element-z-index-with-d3
                // svg.selectAll(".data").sort(function (a, b) {
                //     if (el._groups[0][0].previousSibling !== null) return -1;
                //     else return 1;
                // });

        })
        .on("mouseout", function (d) {
            if (d.afval === 0) {
                return;
            }

            d3.select(this)
                .transition()
                .duration(175)
                .attr("width", x.bandwidth())
                .attr("height", y.bandwidth())
                .attr("rx", 1)
                .attr("ry", 1)
                .attr("x", function(d) { return x(d.dag); })
                .attr("y", function(d) { return y(d.categorie); })
                .style("filter", "")
                .style("cursor", "");
        });

    const title = d3.select("#comparison-chart svg > g > text");

    svg.select("#comparison-chart .x")
        .call(d3.axisTop(x).tickSize(0))
        .select(".domain").remove();
    
    svg.select("#comparison-chart .y")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll(".tick text")
        .call(wrap, 260)
        .call(fixWrapYPosition);

    svg.select(".domain").remove();

    selection
        .enter()
        .append("rect")
        .attr("class", "data")
        .attr("x", function(d) { return x(d.dag); })
        .attr("y", function(d) { return y(d.categorie); })
        .attr("rx", 1)
        .attr("ry", 1)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", function(d) { return colors(d.afval); });

    selection.exit().remove();

    if (el === "Amsterdam") {
        title.text(el);
        return;
    }

    if (el.properties.Buurt !== undefined) {
        title.text(el.properties.Buurt)
            .call(wrap, 240)
            .call(fixWrapTitlePosition);
            return;
    }
    if (el.properties.Stadsdeel !== undefined) {
        title.text(el.properties.Stadsdeel);
        return;
    }
        
}
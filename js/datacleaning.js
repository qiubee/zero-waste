/*jshint esversion: 8 */

dataCleaner();

// Retrieve data
async function dataCleaner() {
    let data = await d3.csv("data/bedrijfsafval-dataset.csv");
    // let data = await d3.csv("data/deel-rijen-data.csv");
    console.log("Raw data:", data);
    data = await cleanData(data);
    console.log("Clean data:", data);
    data = await groupData(data);
    console.log("Group data:", data);
    data = await countData(data);
    console.log("Count data:", data);
    // data = await addCoordinates(data);
    // console.log("Add coordinates:", data);
    data = await addCityCodes(data);
    console.log("Add city codes:", data);
    data = await addCategory(data);
    console.log("Add category:", data);
    exportAsJSON(data);
}

function cleanData(data) {
    data = data.map(function (item) {

        // convert keys to lowercase 
        let newObj = {};
        Object.keys(item).map(function (key) {
            let value = item[key];
            key = key.toLowerCase();

            // delete unlabeled data
            if (item.SBI === "" && item.ma === "" && item.di === "" && item.woe === "" && item.do === "" && item.vr === "" && item.zat === "" && item.zo === "") {
                return;
            }

            // delete sensitive information
            if (key !== "zaaknaam" && key !== "kvknum" && key !== "vestnum" && key !== "code" && key !== "buurtcode" && key !== "hoofd" && key !== "toev" && key !== "kvkstart") {
                newObj[key] = value;
            }

            if (newObj.toev === "") {
                newObj.toev = null;
            }

            // clean label names & add correct value
            switch (key) {
                case "":
                    delete newObj[""];
                    break;
                case "strnaam":
                    // key = "straatnaam";
                    // newObj[key] = value;
                    delete newObj.strnaam;
                    break;
                case "strcode":
                    // key = "straatcode";
                    // newObj[key] = Number(value);
                    delete newObj.strcode;
                    break;
                case "huisnr":
                    // key = "huisnummer";
                    // newObj[key] = Number(value);
                    delete newObj.huisnr;
                    break;
                case "gebieden":
                    // key = "gebiedscode";
                    // newObj[key] = value;
                    delete newObj.gebieden;
                    break;
                case "categorie bedrijf":
                    key = "categorie";
                    newObj[key] = value;
                    delete newObj["categorie bedrijf"];
                    break;
                case "zat":
                    key = "za";
                    newObj[key] = value;
                    delete newObj.zat;
                    break;
                case "woe":
                    key = "wo";
                    newObj[key] = value;
                    delete newObj.woe;
                    break;
                case "hoofd":
                    if (newObj[key] === "1") {
                        newObj[key] = true;
                    }
                    if (newObj[key] === "0") {
                        newObj[key] = false;
                    }
                    break;
                case "postcode":
                    // newObj[key] = Number(value.replace(/\D/g, ""));
                    break;
            }

            // convert numberstring to number
            if (/^ma$|^di$|^wo$|^do$|^vr$|^za$|^zo$|^sbi$/.test(key)) {
                newObj[key] = Number(value);
            }
        });
        return newObj;
    });
    data = cleanArray(data);
    return data;
}

// remove empty values from array
function cleanArray(data) {
    let newArray = [];
    for (let item of data) {
        if ((Object.entries(item).length === 0 && item.constructor === Object) === false) {
            newArray.push(item);
        }
    }
    return newArray;
}

function groupData(data) {
    data = data.map(function (item) {
            // group days
            item.afval = {
                "ma": item.ma,
                "di": item.di,
                "wo": item.wo,
                "do": item.do,
                "vr": item.vr,
                "za": item.za,
                "zo": item.zo
            };
            // delete original days
            ["ma", "di", "wo", "do", "vr", "za", "zo"].forEach(function (i) {
                delete item[i];
            });
            return item;
    });
    return data;
}

function countData(data) {
    data = data.map(function (item) {
        const arr = Object.entries(item.afval);
        let i = 0,
            totaal = 0;
        for (let dag of arr) {
            i += 1;
            totaal += dag[1];
        }
        item.totaal = totaal;
        return item;
    });
    return data;
}

async function addCoordinates(data) {
    let coordinaten = await d3.json("data/Postcode_6-cijferig_VLAKKEN_BAG.json");
    coordinaten = coordinaten.features;

    data = data.map(function (item) {
        coordinaten.forEach(function (obj) {
            let postcode = obj.properties.Postcode6;
            if (postcode === item.postcode) {
                // add array of coordinates
                item.coordinaten = obj.geometry.coordinates;

                // calculate lat & long
                let arr = item.coordinaten;
                let lat, t, long, g;
                lat = t = long = g = 0;
                // loop over multiple arrays
                // source: https://stackoverflow.com/questions/7106410/looping-through-arrays-of-arrays)
                let printArray = function (arr) {
                    if (typeof (arr) === "object") {
                        for (var i = 0; i < arr.length; i++) {
                            printArray(arr[i]);
                        }
                    }
                    if (arr[0] !== undefined && (arr[0] instanceof Array === false)) {
                        lat = lat + arr[0];
                        t += 1;
                    }
                    if (arr[1] !== undefined && (arr[1] instanceof Array === false)) {
                        long = long + arr[1];
                        g += 1;
                    }
                };
                printArray(arr);
                item.lat = Number((lat / t).toFixed(4));
                item.long = Number((long / g).toFixed(4));
            }
        });
        return item;
    });
    return data;
}

async function addCityCodes(data) {
    let buurten = await d3.json("data/Postcode_6-cijferig_VLAKKEN_BAG.json");
    buurten = buurten.features;

    data = data.map(function (item) {
        for (let obj of buurten) {
            if (obj.properties.Postcode6 === item.postcode) {
                let buurt = obj.properties.Buurtcode;
                item.buurtcode = buurt;
                item.stadsdeel = buurt.charAt(0);
            }
        }
        delete item.postcode;
        return item;
    });
    return data;
}

async function addCategory(data) {
    const sbi = await d3.csv("data/SBI-2019.csv");

    data = data.map(function (item) {
        let itemNum = Number(item.sbi.toString().substring(0, 2));
        switch (true) {
            case (/0[1-6]/.test(itemNum)):
                itemNum = "A";
                break;
            case (/0[6-9]/.test(itemNum)):
                itemNum = "B";
                break;
            case (itemNum >= 10 && itemNum <= 33):
                itemNum = "C";
                break;
            case (itemNum === 35):
                itemNum = "D";
                break;
            case (itemNum >= 36 && itemNum <= 39):
                itemNum = "E";
                break;
            case (itemNum >= 41 && itemNum <= 43):
                itemNum = "F";
                break;
            case (itemNum >= 45 && itemNum <= 47):
                itemNum = "G";
                break;
            case (itemNum >= 49 && itemNum <= 53):
                itemNum = "H";
                break;
            case (itemNum === 55 || itemNum === 56):
                itemNum = "I";
                break;
            case (itemNum >= 58 && itemNum <= 63):
                itemNum = "J";
                break;
            case (itemNum >= 64 && itemNum <= 66):
                itemNum = "K";
                break;
            case (itemNum === 68):
                itemNum = "L";
                break;
            case (itemNum >= 69 && itemNum <= 75):
                itemNum = "M";
                break;
            case (itemNum >= 77 && itemNum <= 82):
                itemNum = "N";
                break;
            case (itemNum === 84):
                itemNum = "O";
                break;
            case (itemNum === 85):
                itemNum = "P";
                break;
            case (itemNum >= 86 && itemNum <= 88):
                itemNum = "Q";
                break;
            case (itemNum >= 90 && itemNum <= 93):
                itemNum = "R";
                break;
            case (itemNum >= 94 && itemNum <= 96):
                itemNum = "S";
                break;
            case (itemNum >= 97 && itemNum <= 98):
                itemNum = "T";
                break;
            case (itemNum === 99):
                itemNum = "U";
                break;
        }
        for (let obj of sbi) {
            obj.sbinummer = obj.sbinummer.replace(/\s/, "");
            if (itemNum === obj.sbinummer) {
                item.categorie = obj.categorie.replace(/\s$/, "");
            }
        }
        delete item.sbi;
        return item;
    });
    return data;
}

function exportAsJSON(data) {
    const string = JSON.stringify(data);
    const uri = "data:application/json;charset=utf-8," + encodeURIComponent(string);
    const fileName = "data.json";
    if (document.querySelector("a") === null) {
    const a = document.createElement('a');
    a.textContent("Download");
    a.setAttribute("href", uri);
    a.setAttribute("download", fileName);
    document.querySelector("body").parentNode.insertBefore(a, document.querySelector("button"));
    }

    const a = document.querySelector("a");
    a.setAttribute("href", uri);
    a.setAttribute("download", fileName);
}
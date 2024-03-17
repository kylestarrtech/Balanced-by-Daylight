const fs = require('fs');

// Access .env file
const dotenv = require('dotenv');

const dbdlConverter = require('./utilities/autobalancer/autobalancer-dbdl.js');


const autobalancePrefix = "AUTOBALANCE-";
const autobalanceURLSuffix = "-URL";

const autobalanceSaveLocation = "./public/BalancingPresets/Autobalance/";

const autobalanceObjLocation = "./autobalance-info/";

const autobalanceLeagues = [
    {
        Name: "DBDL",
        ConversionFunc: dbdlConverter
    }
]

let autobalanceObjs = [];

let fetchIntervals = [];

function InitAutobalance() {
    // Load the .env file
    dotenv.config();

    // Clear all intervals
    fetchIntervals.forEach(interval => {
        clearInterval(interval);
    });
    fetchIntervals = [];

    // Clear autobalance objects
    autobalanceObjs = [];

    let autoBalanceEnabled = process.env["AUTOBALANCE-ENABLED"];
    if (autoBalanceEnabled != "true") {
        console.log("The autobalancer feature is disabled!");
        return;
    }

    autobalanceLeagues.forEach(league => {
        const leagueName = league.Name;
        const leagueConvFunc = league.ConversionFunc;
        
        let leagueObjPath = `${autobalanceObjLocation}${leagueName}.json`;

        const objContent = fs.readFileSync(leagueObjPath);
        const balanceObj = JSON.parse(objContent);

        const leagueEnabled = balanceObj["Enabled"];
        const leagueURL = process.env[`${autobalancePrefix}${leagueName}${autobalanceURLSuffix}`];
        const leagueFreq = balanceObj["Frequency"];
        const leagueLastRun = balanceObj["LastRun"];
        const leagueSaveFile = balanceObj["FileName"];
        
        let leagueObj = {
            "Enabled": leagueEnabled,
            "Name": leagueName,
            "URL": leagueURL,
            "Frequency": leagueFreq,
            "LastRun": leagueLastRun,
            "Path": `${autobalanceSaveLocation}${leagueSaveFile}`,
            "FileName": leagueSaveFile,
            "ObjPath": leagueObjPath,
            "ConvFunc": leagueConvFunc
        };

        autobalanceObjs.push(leagueObj);
    });

    autobalanceObjs.forEach(league => {
        const frequency = league.Frequency;

        FetchAutobalance(FindAutobalanceIndex(league.Name)); // Fetch the autobalance initially on startup.

        fetchIntervals.push(setInterval(() => { // Fetch the autobalance based on the frequency
            FetchAutobalance(FindAutobalanceIndex(league.Name));
        }, frequency * 1000));
    });
}

function FindAutobalanceIndex(name) {
    for (let i = 0; i < autobalanceObjs.length; i++) {
        if (autobalanceObjs[i].Name === name) {
            return i;
        }
    }

    return -1;
}

function FetchAutobalance(index) {
    if (index === -1) {
        console.error("The autobalancer does not exist!");
        return;
    }

    const balanceObject = autobalanceObjs[index];

    console.log(`Fetching autobalance for ${balanceObject.Name}...`);

    if (!balanceObject.Enabled) {
        console.log(`The autobalancer for ${balanceObject.Name} is disabled!`);
        return;
    }

    console.log(`Fetching URL data...`);
    // Fetch the data from the URL
    fetch(balanceObject.URL).then(response => response.json()).then(data => {
        let convertedData = balanceObject.ConvFunc(data);
        
        console.log(`Data fetched and converted for ${balanceObject.Name}!`);

        // Save the data to the file
        fs.writeFile(balanceObject.Path, JSON.stringify(convertedData), function (err) {
            if (err) throw err;
            console.log('Saved file! Saving last run...');

            
            // Update the last run time in the .env file (epoch time)
            const now = new Date();
            const epochTime = Math.floor(now.getTime() / 1000);

            balanceObject.LastRun = epochTime;

            let newObjConfig = {
                "Enabled": balanceObject.Enabled,
                "Frequency": balanceObject.Frequency,
                "LastRun": balanceObject.LastRun,
                "FileName": balanceObject.FileName
            };

            fs.writeFile(balanceObject.ObjPath, JSON.stringify(newObjConfig), function (err) {
                if (err) throw err;
                console.log('Saved new object file!');
            });
        });        
    }).catch(err => {
        console.error(err);
    });
}

function SetAutobalanceEnabled(index, enabled) {
    if (index === -1) {
        console.error("The autobalancer does not exist!");
        return;
    }

    autobalanceObjs[index].Enabled = enabled;

    let newObjConfig = {
        "Enabled": autobalanceObjs[index].Enabled,
        "Frequency": autobalanceObjs[index].Frequency,
        "LastRun": autobalanceObjs[index].LastRun,
        "FileName": autobalanceObjs[index].FileName
    };

    fs.writeFile(autobalanceObjs[index].ObjPath, JSON.stringify(newObjConfig), function (err) {
        if (err) return console.error(err);
        console.log('Saved new object file!');

        InitAutobalance();
    });
}

function EnableAutobalance(index) {
    SetAutobalanceEnabled(index, true);
}

function DisableAutobalance(index) {
    SetAutobalanceEnabled(index, false);
}

function SetAutobalanceFrequency(index, frequency) {
    if (index === -1) {
        console.error("The autobalancer does not exist!");
        return;
    }

    autobalanceObjs[index].Frequency = frequency;

    let newObjConfig = {
        "Enabled": autobalanceObjs[index].Enabled,
        "Frequency": autobalanceObjs[index].Frequency,
        "LastRun": autobalanceObjs[index].LastRun,
        "FileName": autobalanceObjs[index].FileName
    };

    fs.writeFile(autobalanceObjs[index].ObjPath, JSON.stringify(newObjConfig), function (err) {
        if (err) return console.error(err);
        console.log('Saved new object file!');

        InitAutobalance();
    });
}

InitAutobalance();

module.exports = {
    FindAutobalanceIndex,
    FetchAutobalance,
    EnableAutobalance,
    DisableAutobalance,
    SetAutobalanceFrequency,
    InitAutobalance
}
// Access .env file
const dotenv = require('dotenv');
dotenv.config();

const fetch = require('node-fetch');
const fs = require('fs');

const disableAutobalance = process.argv.includes("--disable-autobalance");
console.log("Is autobalance manually disabled? " + disableAutobalance);

function SetupDefaultBalanceProfile() {
    let balancingsObj = [
        {
            ID: 0,
            Name: "Debug League",
            Path: "BalancingPresets/DEBUG.json",
            Type: "Automated",
            LastUpdated: 0,
            Aliases: "",
            Balancing: {}
        }
    ];

    fs.writeFile("./public/Balancings.json", JSON.stringify(balancingsObj), function (err) {
        if (err) throw err
        console.log('Saved new balancings file!')
    })
}

if (disableAutobalance) {
    console.log("The autobalancer feature is manually disabled!");
    SetupDefaultBalanceProfile();
    return;
}

const {GoogleSpreadsheet} = require('google-spreadsheet');
const doc = new GoogleSpreadsheet('10N1VSWuxk1uALAiqSsgaI0Yp_BmevWhc1jgj1JyCWvE');
  
const dbdlConverter = require('./utilities/autobalancer/autobalancer-dbdl.js');
const converterMap = new Map()
    .set("DBDL", dbdlConverter)


// Check if the autobalancer is enabled via the .env file
console.log(`Disable autobalance?: ${disableAutobalance}`);
console.log(`autoBalanceEnabled = ${process.env.AUTOBALANCE_ENABLED} && ${!disableAutobalance}`)
const autoBalanceEnabled = process.env.AUTOBALANCE_ENABLED && !disableAutobalance;
console.log(`autoBalanceEnabled = ${autoBalanceEnabled}`)

const publicDataLocation = "./public/";
const balancingPresetLocation = "./public/BalancingPresets/";
const autobalanceSaveLocation = "./public/BalancingPresets/Autobalance/";

const autobalanceObjLocation = "./autobalance-info/";

const storedBalanceURLPrefix = "https://raw.githubusercontent.com/kylestarrtech/Balanced-By-Daylight-Presets/main/";
const storedBalanceURLSuffix = ".json";

let autobalanceLeagues = new Array()

let autobalanceObjs = new Array()

let fetchIntervals = new Array()

let googleLoaded = false

/**
 * Fetches the leagues from the Google Sheet and saves them to a JSON file.
 */
async function getLeagues(){
    if(!googleLoaded){ // If Google hasn't been loaded yet, load it
        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
        await doc.loadInfo()

        // Loads the Google Sheet

        googleLoaded = true
    }

    const balancings = new Array()
    autobalanceLeagues = new Array()

    const sheet = doc.sheetsByTitle["Database"]
    const rows = await sheet.getRows()
    
    for(const row of rows){
        if(!row.Enabled || row.Enabled == "FALSE") continue

        balancingsObj = {
            ID: parseInt(row.ID),
            Name: row.Name,
            Path: `BalancingPresets/Autobalance/${row.Filename}.json`,
            Type: row.Type == "Stored" ? "Manual" : "Automated",
            LastUpdated: 0,
            Aliases: row.Aliases,
            Balancing: {}
        };

        // Try to get LastUpdated
        try {
            const balanceData = fs.readFileSync(`${publicDataLocation}${balancingsObj["Path"]}`, { encoding: 'utf8', flag: 'r' });
            balancingsObj["LastUpdated"] = JSON.parse(balanceData)["Version"];
        } catch (err) {
            console.error(`There was an issue updating the LastUpdated property on the "${balancingsObj["Name"]}" preset. Trying again next time!`);
        }

        balancings.push(balancingsObj);

        if(row.Type != "Stored"){
            autobalanceLeagues.push({
                FullTitle: row.Name,
                Name: row.Filename,
                URL: row.URL,
                Frequency: parseInt(row.Frequency),
                ConversionFunc: converterMap.get(row.Filename)
            })
        } else {
            autobalanceLeagues.push({
                FullTitle: row.Name,
                Name: row.Filename,
                URL: `${storedBalanceURLPrefix}${row.Filename}${storedBalanceURLSuffix}`,
                Frequency: 3600, // Every hour
            })
        }
    }

    fs.writeFile("./public/Balancings.json", JSON.stringify(balancings), function (err) {
        if (err) throw err
        console.log(`[${Date.now()}] Saved new balancings file!`)
    })
}

// Run it every 6 hours
setInterval(async function(){
    getLeagues()
}, 36000 * 6)

function InitAutobalance() {
    // Clear all intervals
    fetchIntervals.forEach(interval => {
        clearInterval(interval);
    });
    fetchIntervals = [];

    // Clear autobalance objects
    autobalanceObjs = [];

    if (autoBalanceEnabled != true) {
        console.log("The autobalancer feature is disabled!");
        return;
    }

    for(const league of autobalanceLeagues){
        const leagueName = league.Name;
        let leagueURL = league.URL;
        if(leagueName == "DBDL"){
            leagueURL += process.env.DBDL_API_KEY;
        }
        
        const leagueObjPath = `${autobalanceObjLocation}${leagueName}.json`;

        let leagueLastRun 
        try{
            const balanceObj = JSON.parse(fs.readFileSync(leagueObjPath));
            leagueLastRun = balanceObj.LastRun;
        }catch{
            leagueLastRun = 0;
        }
        
        let leagueObj = {
            "FullTitle": league.FullTitle,
            "Name": leagueName,
            "URL": leagueURL,
            "Frequency": league.Frequency,
            "LastRun": leagueLastRun,
            "Path": `${autobalanceSaveLocation}${leagueName}.json`,
            "FileName": leagueName + ".json",
            "ObjPath": leagueObjPath,
            "ConvFunc": league.ConversionFunc
        };

        autobalanceObjs.push(leagueObj);
    }

    autobalanceObjs.forEach(league => {
        const frequency = league.Frequency;

        FetchAutobalance(FindAutobalanceIndex(league.Name)); // Fetch the autobalance initially on startup.

        fetchIntervals.push(setInterval(() => { // Fetch the autobalance based on the frequency
            FetchAutobalance(FindAutobalanceIndex(league.Name));
        }, frequency * 1000));
    });
}

/** Ensures all folders are created on startup.
 * 
 * This is to prevent any issues with the autobalancer not being able to save files.
 */ 
function InitialFolderSetup() {
    if (!fs.existsSync(balancingPresetLocation)) {
        fs.mkdirSync(balancingPresetLocation);
    }
    
    if (!fs.existsSync(autobalanceSaveLocation)) {
        fs.mkdirSync(autobalanceSaveLocation);
    }

    if (!fs.existsSync(autobalanceObjLocation)) {
        fs.mkdirSync(autobalanceObjLocation);
    }
}

async function onStartup(){
    InitialFolderSetup();

    await getLeagues()
    InitAutobalance()
}
onStartup()

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

    //console.log(`Fetching URL data...`);
    // Fetch the data from the URL
    fetch(balanceObject.URL).then(response => response.json()).then(data => {
        let convertedData;

        if(balanceObject.ConvFunc){ // If there is a conversion function, use it.
            convertedData = balanceObject.ConvFunc(data);
        }else{
            convertedData = data;
            
            // Change the balancing title to be equivalent to the FullTitle property.
            convertedData.Name = balanceObject.FullTitle.toString();
        }
        
        console.log(`Data fetched and converted for ${balanceObject.Name}!`);

        // Save the data to the file
        fs.writeFile(balanceObject.Path, JSON.stringify(convertedData), function (err) {
            if (err) throw err;
            //console.log('Saved file! Saving last run...');

            
            // Update the last run time in the .env file (epoch time)
            const now = new Date();
            const epochTime = Math.floor(now.getTime() / 1000);

            balanceObject.LastRun = epochTime;

            let newObjConfig = {
                "Enabled": true,
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

module.exports = {
    FindAutobalanceIndex,
    FetchAutobalance,
    EnableAutobalance,
    DisableAutobalance,
    SetAutobalanceFrequency,
    InitAutobalance,
    onStartup
}
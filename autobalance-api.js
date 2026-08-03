const express = require('express');
const dotenv = require('dotenv');
const autobalancer = require('./autobalancer.js');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

module.exports = function(app) {

    const autobalanceReinitLimiter = rateLimit({
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 1, // 1 request per 10 minutes
      message: "Reinitialization requests are limited to 1 per 10 minutes. Please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    });

    const fetchLeaguesLimiter = rateLimit({
      windowMs: 1440 * 60 * 1000, // 1 day
      max: 2, // 2 requests per day
      message: "Fetch leagues requests are limited to 2 per day. Please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    });

    function VerifyAutobalanceKey(givenKey) {
        let env = dotenv.config();

        let apiKeys = env.parsed["AUTOBALANCE-KEYS"].split(",");

        if (!apiKeys.includes(givenKey)) {
            return false;
        }

        return true;
    }

    function VerifyPartnerKey(givenKey) {
        let env = dotenv.config();

        let partnerKeys = env.parsed["PARTNER-KEYS"].split(",");

        if (!partnerKeys.includes(givenKey)) {
            return false;
        }

        return true;
    }

    app.get('/autobalance/get-all-leagues', fetchLeaguesLimiter, function(req, res) {
        let verified = VerifyPartnerKey(req.query.key);

        let resultFormat = {
            Success: false,
            Message: "Invalid API Key"
        }

        if (!verified) {
            res.status(401).send(resultFormat);
            return;
        }

        const rootDir = path.join(__dirname, 'public', 'BalancingPresets', 'Autobalance')

        if (!fs.existsSync(rootDir)) {
            resultFormat.Message = "Autobalance directory not found!";
            res.status(404).send(resultFormat);
            return;
        }

        try {
            const files = fs.readdirSync(rootDir)
                .filter(file => file.endsWith('.json'));

            const leagues = files.map(file => {
                const filePath = path.join(rootDir, file);
                const raw = fs.readFileSync(filePath, 'utf8');
                const leagueObj = JSON.parse(raw);

                return leagueObj;
            })

            resultFormat.Success = true;
            resultFormat.Message = leagues;
            res.status(200).send(resultFormat);
        } catch (err) {
            console.error(err);
            resultFormat.Message = "Internal Server Error, cannot read autobalance directory";
            res.status(500).send(resultFormat);
        }
    });

    app.get('/autobalance/:league/view', function(req, res) {
        let verified = VerifyAutobalanceKey(req.query.key);
        
        let resultFormat = {
            Success: false,
            Message: "Invalid API Key"
        }

        if (!verified) {
            res.status(401).send(resultFormat);
            return;
        }

        let leagueName = req.params.league;

        let leagueObjPath = `./autobalance-info/${leagueName}.json`;

        if (!fs.existsSync(leagueObjPath)) {
            resultFormat.Message = "League not found in Autobalancer";
            res.status(404).send(resultFormat);
            return;
        }

        try {
            let objContent = fs.readFileSync(leagueObjPath);
            let balanceObj = JSON.parse(objContent);

            resultFormat.Success = true;
            resultFormat.Message = balanceObj;

            res.status(200).send(resultFormat);
        } catch (err) {
            resultFormat.Message = "Internal Server Error, cannot read league object file";
            console.error(err);
            res.status(500).send(resultFormat);
        }
    });

    app.get('/autobalance/:league/refresh', function(req, res) {
        let verified = VerifyAutobalanceKey(req.query.key);

        let resultFormat = {
            Success: false,
            Message: "Invalid API Key"
        }

        if (!verified) {
            res.status(401).send(resultFormat);
            return;
        }

        let leagueName = req.params.league;

        let leagueObjPath = `./autobalance-info/${leagueName}.json`;

        let index = autobalancer.FindAutobalanceIndex(leagueName);;
        if (index === -1) {
            resultFormat.Message = "League not found in Autobalancer!";
            res.status(404).send(resultFormat);
            return;
        }

        try {
            autobalancer.FetchAutobalance(index);
            resultFormat.Success = true;
            resultFormat.Message = "Autobalance refreshed!";
            res.status(200).send(resultFormat);
        } catch (err) {
            resultFormat.Message = "Internal Server Error, cannot refresh autobalance";
            console.error(err);
            res.status(500).send(resultFormat);
        }
    });

    app.get('/autobalance/reinit', function(req, res) {
        let verified = VerifyAutobalanceKey(req.query.key);

        let resultFormat = {
            Success: false,
            Message: "Invalid API Key"
        }

        if (!verified) {
            res.status(401).send(resultFormat);
            return;
        }

        try {
            console.log("-=-=[ Calling onStartup ]=-=-=-");
            autobalancer.onStartup();
            console.log("-=-=[ onStartup Called ]=-=-=-");
            
            resultFormat.Success = true;
            resultFormat.Message = "Autobalance reinitialized!";
            res.status(200).send(resultFormat);
        } catch (err) {
            resultFormat.Message = "Internal Server Error, cannot reinitialize autobalance";
            console.error(err);
            res.status(500).send(resultFormat);
        }
    });

    app.post('/autobalance/:league/modify', function(req, res) {
        let verified = VerifyAutobalanceKey(req.query.key);

        let resultFormat = {
            Success: false,
            Message: "Invalid API Key"
        }

        if (!verified) {
            res.status(401).send(resultFormat);
            return;
        }

        let leagueName = req.params.league;

        let leagueObjPath = `./autobalance-info/${leagueName}.json`;

        if (!fs.existsSync(leagueObjPath)) {
            resultFormat.Message = "League not found in Autobalancer";
            res.status(404).send(resultFormat);
            return;
        }

        let leagueObj = JSON.parse(fs.readFileSync(leagueObjPath));

        let newLeagueObj = req.body;

        for (let key in newLeagueObj) {
            if (leagueObj.hasOwnProperty(key)) {
                leagueObj[key] = newLeagueObj[key];
            }
        }

        try {
            fs.writeFileSync(leagueObjPath, JSON.stringify(leagueObj, null, 4));
            resultFormat.Success = true;
            resultFormat.Message = "League object modified!";

            autobalancer.InitAutobalance();

            res.status(200).send(resultFormat);
        } catch (err) {
            resultFormat.Message = "Internal Server Error, cannot modify league object";
            console.error(err);
            res.status(500).send(resultFormat);
        }
    });

}
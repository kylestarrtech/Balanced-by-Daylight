const axios = require('axios')
const autoDBDL = require('../utilities/autobalancer/autobalancer-dbdl')

module.exports = function(app) {

    app.get('/', (req, res) => {
        res.render("index.pug");
    })

    app.get('/balance-creator', (req, res) => {
        res.render("balance-creator.pug");
    })

    app.get('/balance-checker', (req, res) => {
        res.render("balance-checker.pug");
    })

    app.get('/autobalancer/dbd-league', async (req, res) => {
        const response = await axios.get(process.env.AUTOBALANCE_DBDL_URL)
        res.status(200).json(autoDBDL(response.data))
    })
}
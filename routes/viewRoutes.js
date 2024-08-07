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

    app.get('/balance-creator-v2', (req, res) => {
        res.render("new-balance-creator.pug");
    })
}
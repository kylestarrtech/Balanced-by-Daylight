module.exports = function(app) {

    app.get('/', (req, res) => {
        res.render("index.pug");
    })

    app.get('/balance-creator', (req, res) => {
        res.render("balance-creator.pug");
    })
}
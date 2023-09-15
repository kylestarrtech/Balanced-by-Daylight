const express = require('express')

const app = express()
const port = 3000

require('./routes/viewRoutes')(app)

// Set a static folder with all subfolders and files
app.use(express.static('public'))

// Set Pug as the view engine
app.set('view engine', 'pug')

// Set views folder as the default folder for views
app.set('views', './views')

app.get('*', (req, res) => {
    res.status(404).send('404 Not Found')
})

app.listen(port, () => {
  console.log(`DBD Balance Checker listening on port ${port}`)
})
const express = require('express');
const http = require('http');
const config = require('./server-config.json');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

const canvasGen = require('./canvasGenerator.js');
const autobalanceAPI = require('./autobalance-api.js');
const imageExtractor = require('./imageExtractor.js')

const app = express()

app.set('trust proxy', 1);

const server=http.createServer(app);
const port = 3000
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})

const activeBuilds = {};

require('./routes/viewRoutes')(app)

// Set a static folder with all subfolders and files
app.use(express.static('public', {
  maxAge: '30d', // Keep the default 30-day cache for most assets
  setHeaders: (res, path, stat) => {
    // Check if the file being served is Balancings.json
    if (path.endsWith('Balancings.json') || path.includes('Autobalance')) {
      // Override the Cache-Control header to 30 minutes
      res.set('Cache-Control', 'public, max-age=1800');
    }
  }
}))

// middleware 
app.use(express.json()) //Add it first then others follow

app.use(express.urlencoded({ extended: true }))

app.use('/favicon.ico', express.static('/favicon.ico'));

// Rate limiter for /get-build-image
const imageGenLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1min
  max: 6, // 6req/min
  message: "Too many image generation requests from this IP, please try again in a minute.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for /image-extractor
const imageExtractLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1min
  max: 5, // 3req/min
  message: "Too many image upload requests from this IP, please try again in a minute.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Set Pug as the view engine
app.set('view engine', 'pug')

// Set views folder as the default folder for views
app.set('views', './views')

// Check the command line argument for "--disable-autobalance" to disable the autobalance API

// Set the autobalance API
autobalanceAPI(app);

app.get('/config', (req, res) => {
  res.json(config);
});

app.post('/get-build-image', imageGenLimiter, (req, res) => {
  // Get the build data from the request body
  const buildData = req.body;
  //console.log(buildData);

  if (buildData == null) {
    res.status(400).send("Invalid build data. Build data is null.");
    return;
  }

  let exportData = buildData["ExportData"];
  //console.log(exportData);

  try {
    // Generate the build image
    canvasGen.BeginGenerationImport(exportData, function(data) {
      if (data["status"] == 200) {
        res.setHeader('Content-Type', 'image/png');
        res.status(data["status"]).send(data["imageData"]);
      } else {
        res.status(data["status"]).send(data["message"]);
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
  }
});

app.post('/image-extractor', upload.single("image"), imageExtractLimiter, async (req, res) => {
  if(!req.file){
    res.status(400).send("Invalid import data. No image received.");
    return;
  }
  try {
    const imageBuffer = req.file.buffer
    const importData = await imageExtractor(imageBuffer)

    res.status(200).json(importData)

  } catch (err) {
    console.error(err)
    res.status(500).send("Internal server error.")
  }
})

app.get("/imageProxy", async (req, res) => {
  const url = req.query.url
  const response = await fetch(url)
  if(!response.ok){
    res.status(response.status).send("Erreur Discord");
    return
  }
  res.setHeader("Cache-Control", "public, max-age=86400")
  res.setHeader("Content-Type", response.headers.get("content-type"))
  res.send(Buffer.from(await response.arrayBuffer()))
})

app.get('*', (req, res) => {
  res.status(404).send('404 Not Found')
})

server.listen(port, () => {
  console.log(`DBD Balance Checker listening on port ${port}`)
})
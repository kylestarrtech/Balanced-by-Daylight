const cv = require("opencv4nodejs")
const Tesseract = require("tesseract.js")
const fs = require("fs")
const orderPerks = require("./orderPerks.json")

async function matchResults(largeImage, smallImage, imageName, threshold){
  const results = new Array()

  return new Promise(resolve => {
    const matchResult = largeImage.matchTemplate(smallImage, cv.TM_CCOEFF_NORMED)

    while (true) {
      const minMax = matchResult.minMaxLoc()
      const { maxLoc } = minMax
      const { x, y } = maxLoc
    
      if (minMax.maxVal > threshold) {
        results.push({ image: imageName, position: { x, y } })
    
        matchResult.drawRectangle(maxLoc, new cv.Point(x + smallImage.cols, y + smallImage.rows), new cv.Vec(0, 255, 0), 3)
      } else {
        break
      }
    }
    resolve(results)
  })
}

async function findImages(largeImage, imagesToFind, threshold, maxCounter){
  let results = new Array()
  let counter = 0

  for (const smallImage of imagesToFind) {  
    const res = await matchResults(largeImage, smallImage.imageCV, smallImage.imageName, threshold)
    results = results.concat(res)

    counter += res.length
    if(counter >= maxCounter) break
  }

  return results
}

function loadSmallImages(directory, size){
  const images = new Array()

  if(directory.includes("Perks")){
    const smallImage = cv.imread("./canvas-image-library/Perks/blank.png")
    images.push({imageCV: smallImage.resize(new cv.Size(size, size)), imageName: "blank.png"})
  }

  let imagesToFind = fs.readdirSync(directory)
  for (const imageName of imagesToFind) {
    const smallImage = cv.imread(directory + "/" + imageName)
    images.push({imageCV: smallImage.resize(new cv.Size(size, size)), imageName})
  }

  return images
}

module.exports = async function imageExtractor(buffer){
    //const largeImage = cv.imread("./test.png")
    const largeImage = cv.imdecode(buffer)

    let perksCV = loadSmallImages("./canvas-image-library/Perks/Survivors", 118)
    perksCV = perksCV.sort((a, b) => {
        return orderPerks.order.indexOf(a.imageName) - orderPerks.order.indexOf(b.imageName)
    })
    const offeringsCV = loadSmallImages("./canvas-image-library/Offerings", 118)
    const itemsCV = loadSmallImages("./canvas-image-library/Items", 88)
    const addonsCV = loadSmallImages("./canvas-image-library/Addons", 68)

    console.log("Start:", new Date())

    const resTesseract = await Tesseract.recognize(buffer, "eng");
    const extractText = resTesseract.data.text.split("\n")

    const resPerks = findImages(largeImage, perksCV, 0.8, 16)
    const resOfferings = findImages(largeImage, offeringsCV, 0.9, 4)
    const resItems = findImages(largeImage, itemsCV, 0.9, 4)
    const resAddons = findImages(largeImage, addonsCV, 0.9, 8)

    const results = await Promise.all([resPerks, resOfferings, resItems, resAddons]);

    console.log("End:", new Date())

    return {
        Perks: results[0],
        Offerings: results[1],
        Items: results[2],
        Addons: results[3],
        Killer: extractText[0],
        Balancing: extractText[1]
    }
}
const sharp = require('sharp')
const Tesseract = require('tesseract.js')
const fs = require('fs')
const path = require('path')

let pixelmatch
let bankPerks, bankOfferings, bankItems, bankAddons
async function init(){
    pixelmatch = (await import('pixelmatch')).default


    //Preload all images
    const preloadPerks = await loadImagesFromDir("./canvas-image-library/Perks/Survivors", 118)
    const preloadBlank = await loadImagesFromDir("./canvas-image-library/Perks", 118)
    bankPerks = new Map([...preloadPerks, ...preloadBlank])
    bankOfferings = await loadImagesFromDir("./canvas-image-library/Offerings", 118)
    bankItems = await loadImagesFromDir("./canvas-image-library/Items", 88)
    bankAddons = await loadImagesFromDir("./canvas-image-library/Addons", 68)

    console.log("Image Extractor: Init done !")
}
init()

async function getImageBuffer(filePath, imageSize) {
    const { data, info } = await sharp(filePath)
        .resize(imageSize, imageSize)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

    return { data, info }
}

async function loadImagesFromDir(directory, imageSize){
    const images = new Map()
    const files = fs.readdirSync(directory)
    for (const file of files) {
        if(!file.endsWith(".png")) continue
        const bankPath = path.join(directory, file)
        const { data: bankData, info: bankInfo } = await getImageBuffer(bankPath, imageSize)

        images.set(file, {bankData, bankInfo})
    }
    return images
}

async function compareImages(buf1, buf2, imageSize) {
    const diff = pixelmatch(buf1, buf2, null, imageSize, imageSize, { threshold: 0.5 });
    return diff
}

async function compareImagePosition(mainSharp, bank, x, y, imageSize){
    const { data: snippetData } = await mainSharp
        .clone()
        .extract({ left: x, top: y, width: imageSize, height: imageSize })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

    //To debug if you want to check the compared image
    /*await mainSharp
        .clone()
        .extract({ left: x, top: y, width: imageSize, height: imageSize })
        .ensureAlpha()
        .toFile(`./tmp/snippet_debug_${x}_${y}.png`)
    */

    let bestMatch = { file: null, score: Infinity }
    //Compare the extracted image to our preloaded bank
    for (const [file, { bankData }] of bank) {
        const diff = await compareImages(snippetData, bankData, imageSize)
        if (diff < bestMatch.score) {
            //For testing puprose on the threshold
            /*if(diff <= 15){
                console.log("prev", bestMatch)
                console.log("new", { file, score: diff })
            }*/
            bestMatch = { file, score: diff }
            if(diff <= 15) break
        }
    }
    return bestMatch
}

async function extractTextInMemory(mainSharp) {
    const region = { left: 0, top: 0, width: 608, height: 86 }

    const buffer = await mainSharp
        .clone()
        .extract(region)
        .png()
        .toBuffer()

    //To debug if you want to check the compared image
    /*await mainSharp
        .clone()
        .extract(region)
        .png()
        .toFile(`./tmp/text.png`)*/

    const result = await Tesseract.recognize(buffer, "eng")
    return result.data.text
}

module.exports = async (image) => {
    //Load full image
    //console.time("imageExtractor")
    const mainSharp = sharp(image)
        .resize(1280, 720)
        .withMetadata({ density: 70 })

    //Check killer & balancing texts
    const text = await extractTextInMemory(mainSharp)
    const splittedText = text.split("\n")

    const killer = splittedText[0].replace("Going against: ", "").slice(0, -2).trim()
    const balancing = splittedText[1].replace("Balancing: ", "")

    //Check loadouts
    const survLoadouts = []
    for (let i=0 ; i<4 ; i++){
        const y = 120 + i * 153

        //Check Perks
        const survPerks = []
        for (let j=0 ; j<4 ; j++){
            const x = 290 + j * 128
            const bestMatch = await compareImagePosition(mainSharp, bankPerks, x, y, 118)

            survPerks.push(bestMatch.file)
            //console.log(`Perk ${i+1}, ${j+1}: ${bestMatch.file} (score: ${bestMatch.score})`)
        }

        //Check Offerings
        let bestMatch = await compareImagePosition(mainSharp, bankOfferings, 842, y, 118)
        const offering = bestMatch.file
        //console.log(`Offering ${i+1}: ${bestMatch.file} (score: ${bestMatch.score})`)

        //Check Items
        bestMatch = await compareImagePosition(mainSharp, bankItems, 1010, y+15, 88)
        const item = bestMatch.file
        //console.log(`Item ${i+1}: ${bestMatch.file} (score: ${bestMatch.score})`)

        //Check Addons
        const survAddons = []
        for (let j=0 ; j<2 ; j++){
            const x = 1108 + j * 73
            const bestMatch = await compareImagePosition(mainSharp, bankAddons, x, y+24, 68)

            survAddons.push(bestMatch.file)
            //console.log(`Addon ${i+1}, ${j+1}: ${bestMatch.file} (score: ${bestMatch.score})`)
        }

        survLoadouts.push({perks: survPerks, offering, item, addons: survAddons})
    }
    //console.log("Killer:", killer)
    //console.log("Balancing:", balancing)
    //console.log("Loadouts:", survLoadouts)

    //console.timeEnd("imageExtractor")
    return ({killer, balancing, survLoadouts})
}

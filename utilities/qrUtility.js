const jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const qrReader = require('qrcode-reader');
const qrWriter = require('qrcode');

/**
 * Gets the data from a QR code image.
 * @param {*} imageBuffer The buffer of the image to get the data from.
 * @param {*} callback The callback function to call when the data is retrieved or when an error occurs.
 */
function GetQRCodeData(imageBuffer, callback) {
    jimp.read(imageBuffer, function(err, image) {
        if (err) {
            console.error(err);
            callback({ "status": 500, "message": "Internal server error." });
            return;
        }

        let qr = new qrReader();

        qr.callback = function(err, value) {
            if (err) {
                console.error(err);
                callback({ "status": 500, "message": "Internal server error." });
                return;
            }

            callback({ "status": 200, "data": value });
            return;
        };

        qr.decode(image.bitmap);
    });
}

function TestQRData(path) {
    let buffer = fs.readFileSync(path);

    // Get the file name;
    let fileName = path.split(path.sep).pop();

    GetQRCodeData(buffer, function(data) {
        console.log(`QR Code data for ${fileName}:`);
        if (data["status"] == 200) {
            console.log(data["data"]);
            return data["data"];
        } else {
            console.log(data["message"]);
            return data["message"];
        }
    });
}

/**
 * Generates a QR code image and returns the buffer.
 * @param {*} data The data to encode in the QR code.\
 * @param {*} options The options to use when generating the QR code.
 * @param {*} callback The callback function to call when the QR code is generated or when an error occurs.
 */
async function GenerateQRCode(data, options, callback) {
    await qrWriter.toBuffer(data, options).then(buffer => {
        callback({ "status": 200, "data": buffer });
        return;
    }).catch(err => {
        console.error(err);
        callback({ "status": 500, "message": "Internal server error." });
        return;
    });
}

module.exports = { GetQRCodeData, GenerateQRCode };

// const testData = 
// "eJxdj8FqwzAMht/FZx3iOGm23NZDIQzWwY4hBxMrjakrg5xkG2PvPnuGU" +
// "nKRkb6PX/KPCCtvdvP8jnwNnRFt3ytQCqQsoZID9M81yEJCXcSniX3VQF" +
// "3BU6wqdqoECYcaVDMMcA87TxOypUsOLKGGA9Dq3IPSLXjLOIFoFHvjxRh" +
// "PHU0+3ZStbOTax9x4nzg5HWZnL/Mi0vDBEyfLOLIer8h79l/TMnQ4Lmhe" +
// "rXPRapUEMa7MSMtRO01j/EVHBr9EWyQSFn/LAM8bMluDop20CwjCk/v+m" +
// "P3nm6ejJkJzJ/tE0ab9v38MzIGQ"

// GenerateQRCode(testData, function(data) {
//     if (data["status"] == 200) {
//         console.log(data["data"]);

//         TestQRData('test-generated-qr.png');
//     } else {
//         console.log(data["message"]);
//     }
// });

// TestQRData(`test-image-qr-gen.png`);

// console.log("Tests complete!");
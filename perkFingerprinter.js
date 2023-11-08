/**
 * The perkFingerprinter is a utility that takes a perk image (256x256) and generates a 512-bit fingerprint to uniquely identify the perk
 * with a low amount of space and with a significant amount of accuracy.
 */

const fs = require('fs');
const Perks = require('./public/Perks/dbdperks.json');

const fingerprint_size = 2; // The height of the fingerprint image. The width is always 256.

function InitializeTesting() {
    // Does the "Fingerprints" directory exist?
    if (!fs.existsSync('./perk-fingerprints')) {
        fs.mkdirSync('./perk-fingerprints');
    }
    
}
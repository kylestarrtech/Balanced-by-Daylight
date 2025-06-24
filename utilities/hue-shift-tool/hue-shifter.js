// Required modules
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp'); // Use sharp instead of jimp

// --- Configuration ---
const INPUT_DIR = 'input';
const OUTPUT_DIR = 'output';

const HUE_SHIFT_DEGREES = 140;
const SATURATION_MULTIPLIER = 0.8;

const DARKEN_FACTOR = 0.3;
const CONTRAST_MULTIPLIER = 1;

// Normalize Upper Percentile:
// Determines the white point for normalization. Range 0-100.
// 100 means the absolute brightest pixel becomes white.
// Values like 99.5 or 99.8 can help make more of the brightest areas pure white.
// Lowering this value "increases the amount of white".
const NORMALIZE_UPPER_PERCENTILE = 90; // Try values like 99.0, 99.5, 99.8, or 100

// --- End Configuration ---

/**
 * Processes a single image: applies hue shift using Sharp and saves it.
 * @param {string} imagePath - The full path to the original image.
 * @param {string} relativePath - The path of the image relative to INPUT_DIR.
 */
async function processImageWithSharp(imagePath, relativePath) {
    const outputPath = path.join(OUTPUT_DIR, relativePath);
    const outputSubDir = path.dirname(outputPath);

    try {
        // Ensure the output subdirectory exists
        await fs.mkdir(outputSubDir, { recursive: true });

        // For contrast: y = ax + b. 'a' is CONTRAST_MULTIPLIER.
        // We set 'b' to 128 * (1 - a) to adjust contrast around the image's mid-tones.
        const contrast_a = CONTRAST_MULTIPLIER;
        const contrast_b = 128 * (1 - CONTRAST_MULTIPLIER);

        let sharpInstance = sharp(imagePath);

        // 1. Apply initial darkening, hue, and saturation
        sharpInstance = sharpInstance.modulate({
            brightness: DARKEN_FACTOR, // Initial darkening
            hue: HUE_SHIFT_DEGREES,
            saturation: SATURATION_MULTIPLIER
        });

        // 2. Normalize the image
        // This stretches the intensity range: lightest pixels become white, darkest become black.
        // This helps restore highlights to white after the initial darkening.
        sharpInstance = sharpInstance.normalize({ upper: NORMALIZE_UPPER_PERCENTILE });

        // 3. Apply Contrast
        sharpInstance = sharpInstance.linear(contrast_a, contrast_b);

        await sharpInstance.toFile(outputPath);

        console.log(`✅ Processed (Sharp) and saved: ${outputPath}`);

    } catch (error) {
        console.error(`❌ Error processing image ${imagePath} with Sharp:`, error.message);
    }
}

/**
 * Recursively finds all .png images in a directory and its subdirectories,
 * then processes them.
 * @param {string} currentDirPath - The current directory to scan.
 */
async function findAndProcessImages(currentDirPath) {
    try {
        const entries = await fs.readdir(currentDirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDirPath, entry.name);

            if (entry.isDirectory()) {
                await findAndProcessImages(fullPath);
            } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.png') {
                const relativePath = path.relative(INPUT_DIR, fullPath);
                // Call the Sharp processing function
                await processImageWithSharp(fullPath, relativePath);
            }
        }
    } catch (error) {
        console.error(`❌ Error reading directory ${currentDirPath}:`, error.message);
    }
}

/**
 * Main function to set up and start the image processing.
 */
async function main() {
    console.log("🖼️ Starting image hue shift process (using Sharp)...");
    console.log(`📂 Input directory: ${path.resolve(INPUT_DIR)}`);
    console.log(`📂 Output directory: ${path.resolve(OUTPUT_DIR)}`);
    console.log(`🎨 Hue shift: ${HUE_SHIFT_DEGREES} degrees`);
    console.log(`🎨 Saturation multiplier: ${SATURATION_MULTIPLIER}`);
    console.log(`🎨 Brightness multiplier: ${DARKEN_FACTOR}`);
    console.log(`🎨 Contrast multiplier: ${CONTRAST_MULTIPLIER}`);
    console.log("--------------------------------------------------");

    try {
        await fs.access(INPUT_DIR);
        const stats = await fs.stat(INPUT_DIR);
        if (!stats.isDirectory()) {
            console.error(`❌ Error: Input path "${INPUT_DIR}" is not a directory.`);
            return;
        }
    } catch (error) {
        console.error(`❌ Error: Input directory "${INPUT_DIR}" does not exist or is not accessible.`);
        return;
    }

    try {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
    } catch (error) {
        console.error(`❌ Error: Could not create output directory "${OUTPUT_DIR}".`);
        return;
    }

    await findAndProcessImages(INPUT_DIR);

    console.log("--------------------------------------------------");
    console.log("✨ Image processing complete!");
}

main().catch(error => {
    console.error("🚨 An unexpected error occurred:", error);
});
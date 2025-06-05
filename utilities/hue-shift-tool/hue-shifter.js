// Required modules
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp'); // Use sharp instead of jimp

// --- Configuration ---
const INPUT_DIR = 'input';
const OUTPUT_DIR = 'output';

const HUE_SHIFT_DEGREES = 60;
const SATURATION_MULTIPLIER = 2;
const BRIGHTNESS_MULTIPLIER = 0.9;
const CONTRAST_MULTIPLIER = 1.25;

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

        // Read the image, apply hue shift, and save using Sharp
        await sharp(imagePath)
            .modulate({
                hue: HUE_SHIFT_DEGREES,
                saturation: SATURATION_MULTIPLIER,
                brightness: BRIGHTNESS_MULTIPLIER
            }) // Rotate hue by specified degrees
            .linear(contrast_a, contrast_b) // Contrast adjustment
            .toFile(outputPath);

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
    console.log(`🎨 Brightness multiplier: ${BRIGHTNESS_MULTIPLIER}`);
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
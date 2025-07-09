// Import necessary built-in Node.js modules
const fs = require('fs').promises; // Used for file system operations (reading directories, writing files)
const path = require('path');     // Used for handling and transforming file paths

// Import the sharp library for image processing
const sharp = require('sharp');

// --- Configuration ---
const inputDir = path.join(__dirname, 'input');      // Directory where your original icons are
const outputDir = path.join(__dirname, 'output'); // Directory to save corrected icons
const logFilePath = path.join(__dirname, 'affected-images.log'); // File to log the names of changed icons
const TARGET_SIZE = 256; // The correct dimension for width and height

/**
 * The main function to process the images.
 */
async function processImages() {
  console.log('Starting image processing...');
  const affectedPerks = []; // Array to store the names of files that are cropped

  try {
    // Ensure the output directory exists, creating it if it doesn't.
    await fs.mkdir(outputDir, { recursive: true });

    // Read all the files from the input directory.
    const files = await fs.readdir(inputDir);

    for (const file of files) {
      const inputPath = path.join(inputDir, file);
      // Ensure the output file has a .png extension
      const outputPath = path.join(outputDir, `${path.parse(file).name}.png`);

      try {
        const image = sharp(inputPath);
        const metadata = await image.metadata();

        // Check if the image dimensions are NOT the target size
        if (metadata.width !== TARGET_SIZE || metadata.height !== TARGET_SIZE) {
          // You can't crop a small image to be larger. This checks if the source is big enough.
          if (metadata.width < TARGET_SIZE || metadata.height < TARGET_SIZE) {
            console.warn(`⚠️  Skipping ${file}: Image is smaller than ${TARGET_SIZE}x${TARGET_SIZE} and cannot be cropped.`);
            continue; // Move to the next file
          }
          
          console.log(`✂️  Cropping ${file}: [${metadata.width}x${metadata.height}] -> [${TARGET_SIZE}x${TARGET_SIZE}]`);
          
          // Calculate the coordinates for a center crop
          const left = Math.floor((metadata.width - TARGET_SIZE) / 2);
          const top = Math.floor((metadata.height - TARGET_SIZE) / 2);

          // Use .extract() to explicitly crop the image from the calculated center
          await image
            .extract({
              left: left,
              top: top,
              width: TARGET_SIZE,
              height: TARGET_SIZE
            })
            .png() // Convert to PNG format
            .toFile(outputPath);

          affectedPerks.push(file); // Log the affected file

        } else {
          // If the image is already correct, just copy it over and ensure it's a PNG
          console.log(`✅ Skipping ${file}: Already ${TARGET_SIZE}x${TARGET_SIZE}. Copied to output as PNG.`);
          await image.png().toFile(outputPath);
        }
      } catch (err) {
        // Catch errors for files that are not images or are corrupted
        console.error(`❌ Could not process file ${file}. It might not be a valid image. Error: ${err.message}`);
      }
    }

    if (affectedPerks.length > 0) {
      const logContent = `The following ${affectedPerks.length} perk icons were cropped to ${TARGET_SIZE}x${TARGET_SIZE} on ${new Date().toISOString()}:\n\n${affectedPerks.join('\n')}`;
      await fs.writeFile(logFilePath, logContent);
      console.log(`\nSuccessfully cropped ${affectedPerks.length} files. A log has been saved to ${logFilePath}`);
    } else {
      console.log('\nNo images needed correction. All icons were already the correct size.');
    }

  } catch (err) {
    console.error('An error occurred during the process:', err);
  }
}

// Run the main function
processImages();
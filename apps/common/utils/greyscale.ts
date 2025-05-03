import * as sharp from 'sharp';
import * as fs from 'fs';

export async function convertToGreyscale(imagePath: string): Promise<{ buffer: Buffer, width: number, height: number }> {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error('File does not exist');
    }

    const { data, info } = await sharp(imagePath).raw().toBuffer({ resolveWithObject: true });
    const greyscaleBuffer = Buffer.alloc(info.width * info.height * info.channels);

    // Convert to greyscale using the standard formula: Y = 0.299R + 0.587G + 0.114B
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate luminance using standard weights
      const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      // Set the same value for all channels to create a greyscale image
      for (let c = 0; c < info.channels; c++) {
        greyscaleBuffer[i + c] = y;
      }
    }

    return {
      buffer: greyscaleBuffer,
      width: info.width,
      height: info.height
    };
  } catch (error) {
    throw new Error(`Failed to convert image to greyscale: ${error.message}`);
  }
}
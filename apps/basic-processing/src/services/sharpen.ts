import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { MessagePattern } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SharpenService {
  private readonly logger = new Logger(SharpenService.name);

  // Sharpening kernel
  private readonly sharpKernel = [
    [-1, -1, -1],
    [-1, 9, -1],
    [-1, -1, -1],
  ];

  private applyConvolution(
    imageData: Buffer,
    width: number,
    height: number,
    channels: number
  ): Buffer {
    const result = Buffer.alloc(imageData.length);
    const offset = 1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < channels; c++) {
          let sum = 0;
          const pixelIndex = (y * width + x) * channels + c;

          for (let ky = -offset; ky <= offset; ky++) {
            for (let kx = -offset; kx <= offset; kx++) {
              const nx = x + kx;
              const ny = y + ky;

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const kernelValue = this.sharpKernel[ky + offset][kx + offset];
                const neighborIndex = (ny * width + nx) * channels + c;
                sum += imageData[neighborIndex] * kernelValue;
              }
            }
          }

          result[pixelIndex] = Math.min(255, Math.max(0, Math.round(sum)));
        }
      }
    }

    return result;
  }

  @MessagePattern({ cmd: 'sharpen_image' })
  async sharpenImage(imagePath: string) {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error('File does not exist');
      }

      const outputDir = path.join(process.cwd(), 'apps/basic-processing/output_images');
      const outputFileName = `sharpened_${Date.now()}.png`;
      const outputFilePath = path.join(outputDir, outputFileName);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      this.logger.log(`Reading image: ${imagePath}`);
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      const { width, height, channels } = metadata;

      if (!width || !height) {
        throw new Error('Invalid image dimensions');
      }

      this.logger.log('Applying sharpening filter');
      const imageBuffer = await image.raw().toBuffer();
      const sharpened = this.applyConvolution(
        imageBuffer,
        width,
        height,
        channels || 3
      );

      this.logger.log(`Saving sharpened image to: ${outputFilePath}`);
      await sharp(sharpened, {
        raw: {
          width: width,
          height: height,
          channels: channels || 3,
        },
      })
        .png({ compressionLevel: 6 })
        .toFile(outputFilePath);

      return {
        success: true,
        message: 'Image sharpened successfully',
        savedImagePath: outputFilePath,
      };
    } catch (error) {
      this.logger.error(`Error in sharpenImage: ${error.message}`);
      return {
        success: false,
        message: 'Failed to sharpen image',
        error: error.message,
      };
    }
  }
}
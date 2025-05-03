import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { MessagePattern } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmbossService {
  private readonly logger = new Logger(EmbossService.name);

  // Embossing kernel
  private readonly embossKernel = [
    [-2, -1, 0],
    [-1, 1, 1],
    [0, 1, 2],
  ];

  private applyKernel(
    imageData: Buffer,
    width: number,
    height: number,
    channels: number
  ): Buffer {
    const result = Buffer.alloc(imageData.length);
    const size = 3;
    const offset = Math.floor(size / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < channels; c++) {
          let sum = 0;

          for (let ky = -offset; ky <= offset; ky++) {
            for (let kx = -offset; kx <= offset; kx++) {
              const nx = Math.max(0, Math.min(x + kx, width - 1));
              const ny = Math.max(0, Math.min(y + ky, height - 1));
              const kernelValue = this.embossKernel[ky + offset][kx + offset];
              const sourceIndex = (ny * width + nx) * channels + c;
              sum += imageData[sourceIndex] * kernelValue;
            }
          }

          const index = (y * width + x) * channels + c;
          result[index] = Math.min(255, Math.max(0, Math.round(sum + 128))); // offset 128 for emboss look
        }
      }
    }

    return result;
  }

  @MessagePattern({ cmd: 'emboss_image' })
  async embossImage(imagePath: string) {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error('File does not exist');
      }

      const outputDir = path.join(process.cwd(), 'apps/basic-processing/output_images');
      const outputFileName = `embossed_${Date.now()}.png`;
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

      this.logger.log('Applying embossing filter');
      const imageBuffer = await image.raw().toBuffer();
      const filtered = this.applyKernel(
        imageBuffer,
        width,
        height,
        channels || 3
      );

      this.logger.log(`Saving embossed image to: ${outputFilePath}`);
      await sharp(filtered, {
        raw: {
          width: width,
          height: height,
          channels: channels || 3,
        },
      })
        .png()
        .toFile(outputFilePath);

      return {
        success: true,
        message: 'Image embossed successfully',
        savedImagePath: outputFilePath,
      };
    } catch (error) {
      this.logger.error(`Error in embossImage: ${error.message}`);
      return {
        success: false,
        message: 'Failed to emboss image',
        error: error.message,
      };
    }
  }
}

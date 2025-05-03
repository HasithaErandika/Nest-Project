/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { MessagePattern } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';
import { ServiceResponse } from '../types/response.types';

@Injectable()
export class ContrastService {
  private readonly logger = new Logger(ContrastService.name);

  private applyContrast(
    imageData: Buffer,
    width: number,
    height: number,
    channels: number,
    contrast: number
  ): Buffer {
    const result = Buffer.alloc(imageData.length);
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < imageData.length; i += channels) {
      for (let c = 0; c < channels; c++) {
        const pixel = imageData[i + c];
        const newValue = factor * (pixel - 128) + 128;
        result[i + c] = Math.max(0, Math.min(255, Math.round(newValue)));
      }
    }
    return result;
  }

  @MessagePattern({ cmd: 'adjust_contrast' })
  async adjust(data: { imagePath: string; contrast: number }): Promise<ServiceResponse> {
    try {
      const { imagePath, contrast } = data;

      if (!fs.existsSync(imagePath)) {
        throw new Error('File does not exist');
      }

      if (contrast < -100 || contrast > 100) {
        throw new Error('Contrast value must be between -100 and 100');
      }

      const outputDir = path.join(process.cwd(), 'apps/basic-processing/output_images');
      const outputFileName = `contrast_${Date.now()}.png`;
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

      this.logger.log('Processing image with contrast adjustment');
      const rawData = await image.raw().toBuffer();
      const contrastedBuffer = this.applyContrast(
        rawData,
        width,
        height,
        channels || 3,
        contrast
      );

      this.logger.log(`Saving contrasted image to: ${outputFilePath}`);
      await sharp(contrastedBuffer, {
        raw: {
          width: width,
          height: height,
          channels: channels || 3
        }
      })
        .png()
        .toFile(outputFilePath);

      return {
        success: true,
        message: 'Contrast adjusted successfully',
        imagePath: outputFilePath
      };
    } catch (error) {
      this.logger.error(`Error in adjust: ${error.message}`);
      return {
        success: false,
        message: 'Failed to adjust contrast',
        error: error.message
      };
    }
  }
}

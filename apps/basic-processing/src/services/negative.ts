/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { MessagePattern } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';
import { ServiceResponse } from '../types/response.types';

@Injectable()
export class NegativeService {
  private readonly logger = new Logger(NegativeService.name);

  private createNegativeBuffer(
    imageData: Buffer,
    width: number,
    height: number,
    channels: number
  ): Buffer {
    const result = Buffer.alloc(imageData.length);
    for (let i = 0; i < imageData.length; i++) {
      result[i] = 255 - imageData[i];
    }
    return result;
  }

  @MessagePattern({ cmd: 'create_negative' })
  async createNegative(imagePath: string): Promise<ServiceResponse> {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error('File does not exist');
      }

      const outputDir = path.join(process.cwd(), 'apps/basic-processing/output_images');
      const outputFileName = `negative_${Date.now()}.png`;
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

      this.logger.log('Creating negative image');
      const rawData = await image.raw().toBuffer();
      const negativeBuffer = this.createNegativeBuffer(
        rawData,
        width,
        height,
        channels || 3
      );

      this.logger.log(`Saving negative image to: ${outputFilePath}`);
      await sharp(negativeBuffer, {
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
        message: 'Negative image created successfully',
        imagePath: outputFilePath
      };
    } catch (error) {
      this.logger.error(`Error in createNegative: ${error.message}`);
      return {
        success: false,
        message: 'Failed to create negative image',
        error: error.message
      };
    }
  }
}
/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { MessagePattern } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';
import { ServiceResponse } from '../types/response.types';

@Injectable()
export class ResizeService {
  private readonly logger = new Logger(ResizeService.name);

  @MessagePattern({ cmd: 'resize_image' })
  async resize(data: { imagePath: string; width: number; height: number }): Promise<ServiceResponse> {
    try {
      if (!fs.existsSync(data.imagePath)) {
        throw new Error('File does not exist');
      }

      const outputDir = path.join(process.cwd(), 'apps/basic-processing/output_images');
      const outputFileName = `resized_${Date.now()}.png`;
      const outputFilePath = path.join(outputDir, outputFileName);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      this.logger.log(`Reading image: ${data.imagePath}`);
      const image = sharp(data.imagePath);
      const metadata = await image.metadata();
      const { width, height, channels } = metadata;

      if (!width || !height) {
        throw new Error('Invalid image dimensions');
      }

      this.logger.log('Processing image with bilinear interpolation');
      const rawData = await image.raw().toBuffer();
      const resizedBuffer = this.bilinearInterpolation(
        rawData,
        width,
        height,
        data.width,
        data.height,
        channels || 3
      );

      this.logger.log(`Saving resized image to: ${outputFilePath}`);
      await sharp(resizedBuffer, {
        raw: {
          width: data.width,
          height: data.height,
          channels: channels || 3
        }
      })
        .png()
        .toFile(outputFilePath);

      return {
        success: true,
        message: 'Image resized successfully',
        imagePath: outputFilePath
      };
    } catch (error) {
      this.logger.error(`Error in resize: ${error.message}`);
      return {
        success: false,
        message: 'Failed to resize image',
        error: error.message
      };
    }
  }

  private bilinearInterpolation(
    inputBuffer: Buffer,
    inputWidth: number,
    inputHeight: number,
    outputWidth: number,
    outputHeight: number,
    channels: number
  ): Buffer {
    const outputBuffer = Buffer.alloc(outputWidth * outputHeight * channels);
    const xRatio = inputWidth / outputWidth;
    const yRatio = inputHeight / outputHeight;

    for (let y = 0; y < outputHeight; y++) {
      for (let x = 0; x < outputWidth; x++) {
        const x1 = Math.floor(x * xRatio);
        const y1 = Math.floor(y * yRatio);
        const x2 = Math.min(x1 + 1, inputWidth - 1);
        const y2 = Math.min(y1 + 1, inputHeight - 1);

        const xWeight = (x * xRatio) - x1;
        const yWeight = (y * yRatio) - y1;

        for (let c = 0; c < channels; c++) {
          const topLeft = inputBuffer[(y1 * inputWidth + x1) * channels + c];
          const topRight = inputBuffer[(y1 * inputWidth + x2) * channels + c];
          const bottomLeft = inputBuffer[(y2 * inputWidth + x1) * channels + c];
          const bottomRight = inputBuffer[(y2 * inputWidth + x2) * channels + c];

          const top = topLeft * (1 - xWeight) + topRight * xWeight;
          const bottom = bottomLeft * (1 - xWeight) + bottomRight * xWeight;
          const value = top * (1 - yWeight) + bottom * yWeight;

          outputBuffer[(y * outputWidth + x) * channels + c] = Math.round(value);
        }
      }
    }

    return outputBuffer;
  }
}
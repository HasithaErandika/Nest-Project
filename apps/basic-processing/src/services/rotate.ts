/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { MessagePattern } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';
import { ServiceResponse } from '../types/response.types';

@Injectable()
export class RotateService {
  private readonly logger = new Logger(RotateService.name);

  @MessagePattern({ cmd: 'rotate_image' })
  async rotate(data: { imagePath: string; angle: number }): Promise<ServiceResponse> {
    try {
      const { imagePath, angle } = data;

      if (!fs.existsSync(imagePath)) {
        throw new Error('File does not exist');
      }

      if (angle % 90 !== 0) {
        throw new Error('Rotation angle must be a multiple of 90 degrees');
      }

      const outputDir = path.join(process.cwd(), 'apps/basic-processing/output_images');
      const outputFileName = `rotated_${Date.now()}.png`;
      const outputFilePath = path.join(outputDir, outputFileName);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      this.logger.log(`Reading image: ${imagePath}`);
      await sharp(imagePath)
        .rotate(angle)
        .png()
        .toFile(outputFilePath);

      return {
        success: true,
        message: 'Image rotated successfully',
        imagePath: outputFilePath
      };
    } catch (error) {
      this.logger.error(`Error in rotate: ${error.message}`);
      return {
        success: false,
        message: 'Failed to rotate image',
        error: error.message
      };
    }
  }
}
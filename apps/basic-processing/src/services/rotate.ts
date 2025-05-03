import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { MessagePattern } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RotateService {
  private readonly logger = new Logger(RotateService.name);

  private rotatePixels(
    inputBuffer: Buffer,
    width: number,
    height: number,
    channels: number,
    angle: number
  ): Buffer {
    const outputBuffer = Buffer.alloc(inputBuffer.length);
    const centerX = width / 2;
    const centerY = height / 2;
    const radian = (angle * Math.PI) / 180;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate the rotated coordinates
        const dx = x - centerX;
        const dy = y - centerY;
        const rotatedX = Math.round(
          dx * Math.cos(radian) - dy * Math.sin(radian) + centerX
        );
        const rotatedY = Math.round(
          dx * Math.sin(radian) + dy * Math.cos(radian) + centerY
        );

        // Check if the rotated coordinates are within bounds
        if (
          rotatedX >= 0 &&
          rotatedX < width &&
          rotatedY >= 0 &&
          rotatedY < height
        ) {
          for (let c = 0; c < channels; c++) {
            const sourceIndex = (rotatedY * width + rotatedX) * channels + c;
            const targetIndex = (y * width + x) * channels + c;
            outputBuffer[targetIndex] = inputBuffer[sourceIndex];
          }
        }
      }
    }

    return outputBuffer;
  }

  @MessagePattern({ cmd: 'rotate_image' })
  async rotate(data: { imagePath: string; angle: number }) {
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
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      const { width, height, channels } = metadata;

      if (!width || !height) {
        throw new Error('Invalid image dimensions');
      }

      this.logger.log(`Rotating image by ${angle} degrees`);
      const rawData = await image.raw().toBuffer();
      const rotatedBuffer = this.rotatePixels(
        rawData,
        width,
        height,
        channels || 3,
        angle
      );

      this.logger.log(`Saving rotated image to: ${outputFilePath}`);
      await sharp(rotatedBuffer, {
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
        message: 'Image rotated successfully',
        savedImagePath: outputFilePath,
      };
    } catch (error) {
      this.logger.error(`Error in rotate: ${error.message}`);
      return {
        success: false,
        message: 'Failed to rotate image',
        error: error.message,
      };
    }
  }
}
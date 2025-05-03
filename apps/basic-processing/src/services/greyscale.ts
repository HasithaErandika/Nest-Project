/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import { convertToGreyscale } from '../../../common/utils/greyscale';

@Injectable()
export class GreyscaleService {
  private readonly logger = new Logger(GreyscaleService.name);

  async saveGreyscaleImage(
    imagePath: string,
    filename: string = `greyscale_${Date.now()}.png`
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error('File does not exist');
      }

      this.logger.log(`Converting image to greyscale: ${imagePath}`);
      const result = await convertToGreyscale(imagePath);

      const outputDir = path.join(process.cwd(), 'apps/basic-processing/output_images');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, filename);

      this.logger.log(`Saving greyscale image to: ${outputPath}`);
      await sharp(result.buffer, {
        raw: {
          width: result.width,
          height: result.height,
          channels: 3
        }
      })
        .png()
        .toFile(outputPath);

      return {
        success: true,
        filePath: outputPath
      };
    } catch (error) {
      this.logger.error(`Error in saveGreyscaleImage: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
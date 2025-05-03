import { Injectable, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class HarrisSharpService {
  private readonly logger = new Logger(HarrisSharpService.name);

  private gaussianKernel(size: number, sigma: number): number[][] {
    const kernel: number[][] = [];
    const center = Math.floor(size / 2);
    let sum = 0;

    for (let i = 0; i < size; i++) {
      kernel[i] = [];
      for (let j = 0; j < size; j++) {
        const x = i - center;
        const y = j - center;
        kernel[i][j] = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
        sum += kernel[i][j];
      }
    }

    // Normalize kernel
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        kernel[i][j] /= sum;
      }
    }

    return kernel;
  }

  private applyConvolution(
    image: Buffer,
    width: number,
    height: number,
    kernel: number[][],
    channels: number,
  ): Buffer {
    const output = Buffer.alloc(image.length);
    const kernelSize = kernel.length;
    const halfSize = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < channels; c++) {
          let sum = 0;
          for (let ky = 0; ky < kernelSize; ky++) {
            for (let kx = 0; kx < kernelSize; kx++) {
              const px = x + kx - halfSize;
              const py = y + ky - halfSize;
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const idx = (py * width + px) * channels + c;
                sum += image[idx] * kernel[ky][kx];
              }
            }
          }
          const idx = (y * width + x) * channels + c;
          output[idx] = Math.round(sum);
        }
      }
    }

    return output;
  }

  private calculateGradients(
    image: Buffer,
    width: number,
    height: number,
    channels: number,
  ): { Ix: Buffer; Iy: Buffer } {
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ];

    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ];

    const Ix = this.applyConvolution(image, width, height, sobelX, channels);
    const Iy = this.applyConvolution(image, width, height, sobelY, channels);

    return { Ix, Iy };
  }

  private calculateCornerResponse(
    Ix: Buffer,
    Iy: Buffer,
    width: number,
    height: number,
    channels: number,
    k: number = 0.04,
  ): Buffer {
    const response = Buffer.alloc(Ix.length);
    const windowSize = 3;
    const halfWindow = Math.floor(windowSize / 2);

    for (let y = halfWindow; y < height - halfWindow; y++) {
      for (let x = halfWindow; x < width - halfWindow; x++) {
        for (let c = 0; c < channels; c++) {
          let sumIx2 = 0;
          let sumIy2 = 0;
          let sumIxIy = 0;

          for (let wy = -halfWindow; wy <= halfWindow; wy++) {
            for (let wx = -halfWindow; wx <= halfWindow; wx++) {
              const idx = ((y + wy) * width + (x + wx)) * channels + c;
              const ix = Ix[idx];
              const iy = Iy[idx];
              sumIx2 += ix * ix;
              sumIy2 += iy * iy;
              sumIxIy += ix * iy;
            }
          }

          const det = sumIx2 * sumIy2 - sumIxIy * sumIxIy;
          const trace = sumIx2 + sumIy2;
          const idx = (y * width + x) * channels + c;
          response[idx] = Math.round(det - k * trace * trace);
        }
      }
    }

    return response;
  }

  private nonMaxSuppression(
    response: Buffer,
    width: number,
    height: number,
    channels: number,
    threshold: number,
    minDistance: number = 5,
  ): { x: number; y: number }[] {
    const corners: { x: number; y: number }[] = [];
    const windowSize = minDistance * 2 + 1;
    const halfWindow = Math.floor(windowSize / 2);

    for (let y = halfWindow; y < height - halfWindow; y++) {
      for (let x = halfWindow; x < width - halfWindow; x++) {
        for (let c = 0; c < channels; c++) {
          const idx = (y * width + x) * channels + c;
          const value = response[idx];

          if (value > threshold) {
            let isMax = true;

            for (let wy = -halfWindow; wy <= halfWindow; wy++) {
              for (let wx = -halfWindow; wx <= halfWindow; wx++) {
                if (wx === 0 && wy === 0) continue;
                const nidx = ((y + wy) * width + (x + wx)) * channels + c;
                if (response[nidx] >= value) {
                  isMax = false;
                  break;
                }
              }
              if (!isMax) break;
            }

            if (isMax) {
              corners.push({ x, y });
            }
          }
        }
      }
    }

    return corners;
  }

  @MessagePattern({ cmd: 'harris_corner_detection' })
  async detectCorners(
    @Payload()
    data: {
      imagePath: string;
      threshold?: number;
      k?: number;
      minDistance?: number;
    },
  ) {
    const { imagePath, threshold = 10000, k = 0.04, minDistance = 5 } = data;

    if (!fs.existsSync(imagePath)) {
      this.logger.error(`Image not found at path: ${imagePath}`);
      throw new Error('Image file not found');
    }

    const outputDir = path.join(process.cwd(), 'apps/feature-detection/output_images');
    const outputFileName = `harris_corners_${Date.now()}.png`;
    const outputPath = path.join(outputDir, outputFileName);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const metadata = await sharp(imageBuffer).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        throw new Error('Could not determine image dimensions');
      }

      // Convert to grayscale and get raw pixel data
      const { data: rawBuffer, info } = await sharp(imageBuffer)
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { channels } = info;

      // Step 1: Calculate gradients
      const { Ix, Iy } = this.calculateGradients(rawBuffer, width, height, channels);

      // Step 2: Calculate corner response
      const response = this.calculateCornerResponse(Ix, Iy, width, height, channels, k);

      // Step 3: Non-maximum suppression
      const corners = this.nonMaxSuppression(response, width, height, channels, threshold, minDistance);

      // Create output image with corners marked
      const outputImage = Buffer.from(rawBuffer);
      for (const corner of corners) {
        const radius = 3;
        for (let y = -radius; y <= radius; y++) {
          for (let x = -radius; x <= radius; x++) {
            if (x * x + y * y <= radius * radius) {
              const px = corner.x + x;
              const py = corner.y + y;
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const idx = (py * width + px) * channels;
                for (let c = 0; c < channels; c++) {
                  outputImage[idx + c] = 255; // Mark corner in white
                }
              }
            }
          }
        }
      }

      this.logger.log(`Detected ${corners.length} corners`);

      await sharp(outputImage, {
        raw: {
          width,
          height,
          channels,
        },
      })
        .png()
        .toFile(outputPath);

      return {
        success: true,
        message: `Harris corner detection completed. Found ${corners.length} corners.`,
        savedImagePath: outputPath,
        corners,
      };
    } catch (error) {
      this.logger.error(`Error in detectCorners: ${error.message}`);
      return {
        success: false,
        message: 'Failed to perform Harris corner detection',
        error: error.message,
      };
    }
  }
}

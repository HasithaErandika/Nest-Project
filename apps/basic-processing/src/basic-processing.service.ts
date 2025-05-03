/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { ResizeService } from './services/resize';
import { GreyscaleService } from './services/greyscale';
import { ContrastService } from './services/contrast';
import { NegativeService } from './services/negative';
import { SharpenService } from './services/sharpen';
import { EmbossService } from './services/embossing';
import { RotateService } from './services/rotate';
import * as fs from 'fs';
import * as path from 'path';
import { ServiceResponse } from './types/response.types';

@Injectable()
export class BasicProcessingService {
  private readonly logger = new Logger(BasicProcessingService.name);

  constructor(
    private readonly resizeService: ResizeService,
    private readonly greyscaleService: GreyscaleService,
    private readonly contrastService: ContrastService,
    private readonly negativeService: NegativeService,
    private readonly sharpenService: SharpenService,
    private readonly embossService: EmbossService,
    private readonly rotateService: RotateService,
  ) { }

  private validateImagePath(imagePath: string): boolean {
    if (!fs.existsSync(imagePath)) {
      this.logger.error(`Image file not found: ${imagePath}`);
      return false;
    }
    const validExtensions = ['.jpg', '.jpeg', '.png', '.bmp'];
    const ext = path.extname(imagePath).toLowerCase();
    if (!validExtensions.includes(ext)) {
      this.logger.error(`Invalid image format: ${ext}`);
      return false;
    }
    return true;
  }

  private validateDimensions(width: number, height: number): boolean {
    if (width <= 0 || height <= 0) {
      this.logger.error(`Invalid dimensions: width=${width}, height=${height}`);
      return false;
    }
    if (width > 10000 || height > 10000) {
      this.logger.error(`Dimensions too large: width=${width}, height=${height}`);
      return false;
    }
    return true;
  }

  async resizeImage(data: { imagePath: string; width: number; height: number }): Promise<ServiceResponse> {
    try {
      if (!this.validateImagePath(data.imagePath) || !this.validateDimensions(data.width, data.height)) {
        return { success: false, message: 'Invalid input parameters', error: 'Invalid input parameters' };
      }

      this.logger.log(`Resizing image: ${data.imagePath} to ${data.width}x${data.height}`);
      return await this.resizeService.resize(data);
    } catch (error) {
      this.logger.error(`Error in resizeImage: ${error.message}`);
      return { success: false, message: 'Internal server error', error: error.message };
    }
  }

  async convertToGreyscale(imagePath: string): Promise<ServiceResponse> {
    try {
      if (!this.validateImagePath(imagePath)) {
        return { success: false, message: 'Invalid image path', error: 'Invalid image path' };
      }

      this.logger.log(`Converting image to greyscale: ${imagePath}`);
      return await this.greyscaleService.saveGreyscaleImage(imagePath);
    } catch (error) {
      this.logger.error(`Error in convertToGreyscale: ${error.message}`);
      return { success: false, message: 'Internal server error', error: error.message };
    }
  }

  async createNegative(imagePath: string): Promise<ServiceResponse> {
    try {
      if (!this.validateImagePath(imagePath)) {
        return { success: false, message: 'Invalid image path', error: 'Invalid image path' };
      }

      this.logger.log(`Creating negative image: ${imagePath}`);
      return await this.negativeService.createNegative(imagePath);
    } catch (error) {
      this.logger.error(`Error in createNegative: ${error.message}`);
      return { success: false, message: 'Internal server error', error: error.message };
    }
  }

  async adjustContrast(data: { imagePath: string; contrast: number }): Promise<ServiceResponse> {
    try {
      if (!this.validateImagePath(data.imagePath)) {
        return { success: false, message: 'Invalid image path', error: 'Invalid image path' };
      }
      if (data.contrast < -100 || data.contrast > 100) {
        this.logger.error(`Invalid contrast value: ${data.contrast}`);
        return { success: false, message: 'Contrast value must be between -100 and 100', error: 'Invalid contrast value' };
      }

      this.logger.log(`Adjusting contrast for image: ${data.imagePath} with value: ${data.contrast}`);
      return await this.contrastService.adjustContrast(data);
    } catch (error) {
      this.logger.error(`Error in adjustContrast: ${error.message}`);
      return { success: false, message: 'Internal server error', error: error.message };
    }
  }

  async rotateImage(data: { imagePath: string; angle: number }): Promise<ServiceResponse> {
    try {
      if (!this.validateImagePath(data.imagePath)) {
        return { success: false, message: 'Invalid image path', error: 'Invalid image path' };
      }
      if (data.angle % 90 !== 0) {
        this.logger.error(`Invalid rotation angle: ${data.angle}`);
        return { success: false, message: 'Rotation angle must be a multiple of 90 degrees', error: 'Invalid rotation angle' };
      }

      this.logger.log(`Rotating image: ${data.imagePath} by ${data.angle} degrees`);
      return await this.rotateService.rotate(data);
    } catch (error) {
      this.logger.error(`Error in rotateImage: ${error.message}`);
      return { success: false, message: 'Internal server error', error: error.message };
    }
  }

  async sharpenImage(imagePath: string): Promise<ServiceResponse> {
    try {
      if (!this.validateImagePath(imagePath)) {
        return { success: false, message: 'Invalid image path', error: 'Invalid image path' };
      }

      this.logger.log(`Sharpening image: ${imagePath}`);
      return await this.sharpenService.sharpenImage(imagePath);
    } catch (error) {
      this.logger.error(`Error in sharpenImage: ${error.message}`);
      return { success: false, message: 'Internal server error', error: error.message };
    }
  }

  async embossImage(imagePath: string): Promise<ServiceResponse> {
    try {
      if (!this.validateImagePath(imagePath)) {
        return { success: false, message: 'Invalid image path', error: 'Invalid image path' };
      }

      this.logger.log(`Embossing image: ${imagePath}`);
      return await this.embossService.embossImage(imagePath);
    } catch (error) {
      this.logger.error(`Error in embossImage: ${error.message}`);
      return { success: false, message: 'Internal server error', error: error.message };
    }
  }
}
/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { BasicProcessingController } from './basic-processing.controller';
import { BasicProcessingService } from './basic-processing.service';
import { Logger } from '@nestjs/common';
import { ServiceResponse, SuccessResponse, ErrorResponse } from './types/response.types';
import { ResizeService } from './services/resize';
import { GreyscaleService } from './services/greyscale';
import { ContrastService } from './services/contrast';
import { NegativeService } from './services/negative';
import { SharpenService } from './services/sharpen';
import { EmbossService } from './services/embossing';
import { RotateService } from './services/rotate';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('path');

describe('BasicProcessingController', () => {
  let basicProcessingController: BasicProcessingController;
  let basicProcessingService: BasicProcessingService;
  let logger: Logger;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BasicProcessingController],
      providers: [
        BasicProcessingService,
        {
          provide: ResizeService,
          useValue: {
            resize: jest.fn().mockImplementation(async (data) => ({
              success: true,
              message: 'Image resized successfully',
              imagePath: 'output.jpg'
            }))
          },
        },
        {
          provide: GreyscaleService,
          useValue: {
            saveGreyscaleImage: jest.fn().mockImplementation(async (imagePath) => ({
              success: true,
              message: 'Image converted to greyscale successfully',
              imagePath: 'output.jpg'
            }))
          },
        },
        {
          provide: ContrastService,
          useValue: {
            adjustContrast: jest.fn().mockImplementation(async (data) => ({
              success: true,
              message: 'Contrast adjusted successfully',
              imagePath: 'output.jpg'
            }))
          },
        },
        {
          provide: NegativeService,
          useValue: {
            createNegative: jest.fn().mockImplementation(async (imagePath) => ({
              success: true,
              message: 'Negative image created successfully',
              imagePath: 'output.jpg'
            }))
          },
        },
        {
          provide: SharpenService,
          useValue: {
            sharpenImage: jest.fn().mockImplementation(async (imagePath) => ({
              success: true,
              message: 'Image sharpened successfully',
              imagePath: 'output.jpg'
            }))
          },
        },
        {
          provide: EmbossService,
          useValue: {
            embossImage: jest.fn().mockImplementation(async (imagePath) => ({
              success: true,
              message: 'Image embossed successfully',
              imagePath: 'output.jpg'
            }))
          },
        },
        {
          provide: RotateService,
          useValue: {
            rotate: jest.fn().mockImplementation(async (data) => ({
              success: true,
              message: 'Image rotated successfully',
              imagePath: 'output.jpg'
            }))
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    basicProcessingController = app.get<BasicProcessingController>(BasicProcessingController);
    basicProcessingService = app.get<BasicProcessingService>(BasicProcessingService);
    logger = app.get<Logger>(Logger);

    // Mock fs.existsSync to return true for valid files
    (fs.existsSync as jest.Mock).mockImplementation((path) => {
      return path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.jpeg') || path.endsWith('.bmp');
    });

    // Mock path.extname to return the file extension
    (path.extname as jest.Mock).mockImplementation((path) => {
      return path.substring(path.lastIndexOf('.'));
    });
  });

  describe('handleResize', () => {
    it('should call resizeImage with correct parameters', async () => {
      const data = { imagePath: 'test.jpg', width: 100, height: 100 };
      const result = await basicProcessingController.handleResize(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for resizing');
    });

    it('should handle invalid dimensions', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      const data = { imagePath: 'test.jpg', width: -100, height: -100 };
      const result = await basicProcessingController.handleResize(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid input parameters');
      }
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle missing image file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      const data = { imagePath: 'nonexistent.jpg', width: 100, height: 100 };
      const result = await basicProcessingController.handleResize(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid image path');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleGreyscale', () => {
    it('should call convertToGreyscale with correct parameters', async () => {
      const data = { imagePath: 'test.jpg' };
      const result = await basicProcessingController.handleGreyscale(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for greyscale conversion');
    });

    it('should handle missing image file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      const data = { imagePath: 'nonexistent.jpg' };
      const result = await basicProcessingController.handleGreyscale(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid image path');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleNegative', () => {
    it('should call createNegative with correct parameters', async () => {
      const imagePath = 'test.jpg';
      const result = await basicProcessingController.handleNegative(imagePath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for negative creation');
    });

    it('should handle missing image file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      const imagePath = 'nonexistent.jpg';
      const result = await basicProcessingController.handleNegative(imagePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid image path');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleContrast', () => {
    it('should call adjustContrast with correct parameters', async () => {
      const data = { imagePath: 'test.jpg', contrast: 1.5 };
      const result = await basicProcessingController.handleContrast(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for contrast adjustment');
    });

    it('should handle invalid contrast value', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      const data = { imagePath: 'test.jpg', contrast: -101 };
      const result = await basicProcessingController.handleContrast(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid contrast value');
      }
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle missing image file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      const data = { imagePath: 'nonexistent.jpg', contrast: 1.5 };
      const result = await basicProcessingController.handleContrast(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid image path');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleRotate', () => {
    it('should call rotateImage with correct parameters', async () => {
      const data = { imagePath: 'test.jpg', angle: 90 };
      const result = await basicProcessingController.handleRotate(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for rotation');
    });

    it('should handle invalid rotation angle', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      const data = { imagePath: 'test.jpg', angle: 45 };
      const result = await basicProcessingController.handleRotate(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid rotation angle');
      }
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle missing image file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      const data = { imagePath: 'nonexistent.jpg', angle: 90 };
      const result = await basicProcessingController.handleRotate(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid image path');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleSharpen', () => {
    it('should call sharpenImage with correct parameters', async () => {
      const imagePath = 'test.jpg';
      const result = await basicProcessingController.handleSharpen(imagePath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for sharpening');
    });

    it('should handle missing image file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      const imagePath = 'nonexistent.jpg';
      const result = await basicProcessingController.handleSharpen(imagePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid image path');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleEmboss', () => {
    it('should call embossImage with correct parameters', async () => {
      const imagePath = 'test.jpg';
      const result = await basicProcessingController.handleEmboss(imagePath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for embossing');
    });

    it('should handle missing image file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      const imagePath = 'nonexistent.jpg';
      const result = await basicProcessingController.handleEmboss(imagePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid image path');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

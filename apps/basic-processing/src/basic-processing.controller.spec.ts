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
            resize: jest.fn(),
          },
        },
        {
          provide: GreyscaleService,
          useValue: {
            saveGreyscaleImage: jest.fn(),
          },
        },
        {
          provide: ContrastService,
          useValue: {
            adjustContrast: jest.fn(),
          },
        },
        {
          provide: NegativeService,
          useValue: {
            createNegative: jest.fn(),
          },
        },
        {
          provide: SharpenService,
          useValue: {
            sharpenImage: jest.fn(),
          },
        },
        {
          provide: EmbossService,
          useValue: {
            embossImage: jest.fn(),
          },
        },
        {
          provide: RotateService,
          useValue: {
            rotate: jest.fn(),
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
  });

  describe('handleResize', () => {
    it('should call resizeImage with correct parameters', async () => {
      const mockResponse: SuccessResponse = {
        success: true,
        message: 'Image resized successfully',
        imagePath: 'output.jpg'
      };
      const resizeSpy = jest.spyOn(basicProcessingService, 'resizeImage').mockResolvedValue(mockResponse);
      const data = { imagePath: 'test.jpg', width: 100, height: 100 };
      const result = await basicProcessingController.handleResize(data);
      expect(resizeSpy).toHaveBeenCalledWith(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for resizing');
    });

    it('should handle invalid dimensions', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Invalid dimensions',
        error: 'Invalid dimensions'
      };
      const resizeSpy = jest.spyOn(basicProcessingService, 'resizeImage').mockResolvedValue(mockResponse);
      const data = { imagePath: 'test.jpg', width: -100, height: -100 };
      const result = await basicProcessingController.handleResize(data);
      expect(resizeSpy).toHaveBeenCalledWith(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid dimensions');
      }
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle service error response', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Failed to resize image',
        error: 'Processing error'
      };
      const resizeSpy = jest.spyOn(basicProcessingService, 'resizeImage').mockResolvedValue(mockResponse);
      const data = { imagePath: 'test.jpg', width: 100, height: 100 };
      const result = await basicProcessingController.handleResize(data);
      expect(resizeSpy).toHaveBeenCalledWith(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Processing error');
      }
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle extremely large dimensions', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Dimensions too large',
        error: 'Dimensions too large'
      };
      const resizeSpy = jest.spyOn(basicProcessingService, 'resizeImage').mockResolvedValue(mockResponse);
      const data = { imagePath: 'test.jpg', width: 20000, height: 20000 };
      const result = await basicProcessingController.handleResize(data);
      expect(resizeSpy).toHaveBeenCalledWith(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Dimensions too large');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleGreyscale', () => {
    it('should call convertToGreyscale with correct parameters', async () => {
      const mockResponse: SuccessResponse = {
        success: true,
        message: 'Image converted to greyscale successfully',
        imagePath: 'output.jpg'
      };
      const greyscaleSpy = jest.spyOn(basicProcessingService, 'convertToGreyscale').mockResolvedValue(mockResponse);
      const data = { imagePath: 'test.jpg' };
      const result = await basicProcessingController.handleGreyscale(data);
      expect(greyscaleSpy).toHaveBeenCalledWith(data.imagePath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for greyscale conversion');
    });

    it('should handle non-existent image', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Image not found',
        error: 'Image not found'
      };
      const greyscaleSpy = jest.spyOn(basicProcessingService, 'convertToGreyscale').mockResolvedValue(mockResponse);
      const data = { imagePath: 'nonexistent.jpg' };
      const result = await basicProcessingController.handleGreyscale(data);
      expect(greyscaleSpy).toHaveBeenCalledWith(data.imagePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Image not found');
      }
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle invalid image format', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Invalid image format',
        error: 'Invalid image format'
      };
      const greyscaleSpy = jest.spyOn(basicProcessingService, 'convertToGreyscale').mockResolvedValue(mockResponse);
      const data = { imagePath: 'test.txt' };
      const result = await basicProcessingController.handleGreyscale(data);
      expect(greyscaleSpy).toHaveBeenCalledWith(data.imagePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid image format');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleNegative', () => {
    it('should call createNegative with correct parameters', async () => {
      const mockResponse: SuccessResponse = {
        success: true,
        message: 'Negative image created successfully',
        imagePath: 'output.jpg'
      };
      const negativeSpy = jest.spyOn(basicProcessingService, 'createNegative').mockResolvedValue(mockResponse);
      const imagePath = 'test.jpg';
      const result = await basicProcessingController.handleNegative(imagePath);
      expect(negativeSpy).toHaveBeenCalledWith(imagePath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for negative creation');
    });

    it('should handle invalid image format', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Invalid image format',
        error: 'Invalid image format'
      };
      const negativeSpy = jest.spyOn(basicProcessingService, 'createNegative').mockResolvedValue(mockResponse);
      const imagePath = 'test.txt';
      const result = await basicProcessingController.handleNegative(imagePath);
      expect(negativeSpy).toHaveBeenCalledWith(imagePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid image format');
      }
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle processing error', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Failed to create negative image',
        error: 'Processing error'
      };
      const negativeSpy = jest.spyOn(basicProcessingService, 'createNegative').mockResolvedValue(mockResponse);
      const imagePath = 'test.jpg';
      const result = await basicProcessingController.handleNegative(imagePath);
      expect(negativeSpy).toHaveBeenCalledWith(imagePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Processing error');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleContrast', () => {
    it('should call adjustContrast with correct parameters', async () => {
      const mockResponse: SuccessResponse = {
        success: true,
        message: 'Contrast adjusted successfully',
        imagePath: 'output.jpg'
      };
      const contrastSpy = jest.spyOn(basicProcessingService, 'adjustContrast').mockResolvedValue(mockResponse);
      const data = { imagePath: 'test.jpg', contrast: 1.5 };
      const result = await basicProcessingController.handleContrast(data);
      expect(contrastSpy).toHaveBeenCalledWith(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for contrast adjustment');
    });

    it('should handle invalid contrast value', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Invalid contrast value',
        error: 'Invalid contrast value'
      };
      const contrastSpy = jest.spyOn(basicProcessingService, 'adjustContrast').mockResolvedValue(mockResponse);
      const data = { imagePath: 'test.jpg', contrast: -1 };
      const result = await basicProcessingController.handleContrast(data);
      expect(contrastSpy).toHaveBeenCalledWith(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid contrast value');
      }
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle extreme contrast values', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Contrast value out of range',
        error: 'Contrast value out of range'
      };
      const contrastSpy = jest.spyOn(basicProcessingService, 'adjustContrast').mockResolvedValue(mockResponse);
      const data = { imagePath: 'test.jpg', contrast: 200 };
      const result = await basicProcessingController.handleContrast(data);
      expect(contrastSpy).toHaveBeenCalledWith(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Contrast value out of range');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleRotate', () => {
    it('should call rotateImage with correct parameters', async () => {
      const mockResponse: SuccessResponse = {
        success: true,
        message: 'Image rotated successfully',
        imagePath: 'output.jpg'
      };
      const rotateSpy = jest.spyOn(basicProcessingService, 'rotateImage').mockResolvedValue(mockResponse);
      const data = { imagePath: 'test.jpg', angle: 90 };
      const result = await basicProcessingController.handleRotate(data);
      expect(rotateSpy).toHaveBeenCalledWith(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for rotation');
    });

    it('should handle invalid rotation angle', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Invalid rotation angle',
        error: 'Invalid rotation angle'
      };
      const rotateSpy = jest.spyOn(basicProcessingService, 'rotateImage').mockResolvedValue(mockResponse);
      const data = { imagePath: 'test.jpg', angle: 361 };
      const result = await basicProcessingController.handleRotate(data);
      expect(rotateSpy).toHaveBeenCalledWith(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid rotation angle');
      }
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle non-90-degree angles', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Rotation angle must be a multiple of 90 degrees',
        error: 'Rotation angle must be a multiple of 90 degrees'
      };
      const rotateSpy = jest.spyOn(basicProcessingService, 'rotateImage').mockResolvedValue(mockResponse);
      const data = { imagePath: 'test.jpg', angle: 45 };
      const result = await basicProcessingController.handleRotate(data);
      expect(rotateSpy).toHaveBeenCalledWith(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Rotation angle must be a multiple of 90 degrees');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleSharpen', () => {
    it('should call sharpenImage with correct parameters', async () => {
      const mockResponse: SuccessResponse = {
        success: true,
        message: 'Image sharpened successfully',
        imagePath: 'output.jpg'
      };
      const sharpenSpy = jest.spyOn(basicProcessingService, 'sharpenImage').mockResolvedValue(mockResponse);
      const imagePath = 'test.jpg';
      const result = await basicProcessingController.handleSharpen(imagePath);
      expect(sharpenSpy).toHaveBeenCalledWith(imagePath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for sharpening');
    });

    it('should handle invalid image format', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Invalid image format',
        error: 'Invalid image format'
      };
      const sharpenSpy = jest.spyOn(basicProcessingService, 'sharpenImage').mockResolvedValue(mockResponse);
      const imagePath = 'test.txt';
      const result = await basicProcessingController.handleSharpen(imagePath);
      expect(sharpenSpy).toHaveBeenCalledWith(imagePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid image format');
      }
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle processing error', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Failed to sharpen image',
        error: 'Processing error'
      };
      const sharpenSpy = jest.spyOn(basicProcessingService, 'sharpenImage').mockResolvedValue(mockResponse);
      const imagePath = 'test.jpg';
      const result = await basicProcessingController.handleSharpen(imagePath);
      expect(sharpenSpy).toHaveBeenCalledWith(imagePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Processing error');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleEmboss', () => {
    it('should call embossImage with correct parameters', async () => {
      const mockResponse: SuccessResponse = {
        success: true,
        message: 'Image embossed successfully',
        imagePath: 'output.jpg'
      };
      const embossSpy = jest.spyOn(basicProcessingService, 'embossImage').mockResolvedValue(mockResponse);
      const imagePath = 'test.jpg';
      const result = await basicProcessingController.handleEmboss(imagePath);
      expect(embossSpy).toHaveBeenCalledWith(imagePath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imagePath).toBe('output.jpg');
      }
      expect(logger.log).toHaveBeenCalledWith('Received image for embossing');
    });

    it('should handle invalid image format', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Invalid image format',
        error: 'Invalid image format'
      };
      const embossSpy = jest.spyOn(basicProcessingService, 'embossImage').mockResolvedValue(mockResponse);
      const imagePath = 'test.txt';
      const result = await basicProcessingController.handleEmboss(imagePath);
      expect(embossSpy).toHaveBeenCalledWith(imagePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid image format');
      }
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle processing error', async () => {
      const mockResponse: ErrorResponse = {
        success: false,
        message: 'Failed to emboss image',
        error: 'Processing error'
      };
      const embossSpy = jest.spyOn(basicProcessingService, 'embossImage').mockResolvedValue(mockResponse);
      const imagePath = 'test.jpg';
      const result = await basicProcessingController.handleEmboss(imagePath);
      expect(embossSpy).toHaveBeenCalledWith(imagePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Processing error');
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

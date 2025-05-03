/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { EnhancementController } from './enhancement.controller';
import { EnhancementService } from './enhancement.service';
import { Logger } from '@nestjs/common';

describe('EnhancementController', () => {
  let enhancementController: EnhancementController;
  let enhancementService: EnhancementService;
  let logger: Logger;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EnhancementController],
      providers: [
        EnhancementService,
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    enhancementController = app.get<EnhancementController>(EnhancementController);
    enhancementService = app.get<EnhancementService>(EnhancementService);
    logger = app.get<Logger>(Logger);
  });

  describe('handleHistogramEqualization', () => {
    it('should call histogramEqualization with correct parameters', async () => {
      const histogramSpy = jest.spyOn(enhancementService, 'histogramEqualization').mockResolvedValue({
        success: true,
        message: 'Histogram equalization completed successfully',
        savedImagePath: 'output.jpg',
      });
      const imagePath = 'test.jpg';
      const result = await enhancementController.handleHistogramEqualization(imagePath);
      expect(histogramSpy).toHaveBeenCalledWith(imagePath);
      expect(result.success).toBe(true);
      expect(logger.log).toHaveBeenCalledWith('Received image for histogram equalization');
    });

    it('should handle non-existent image', async () => {
      const histogramSpy = jest.spyOn(enhancementService, 'histogramEqualization').mockRejectedValue(
        new Error('Image not found')
      );
      const imagePath = 'nonexistent.jpg';
      await expect(enhancementController.handleHistogramEqualization(imagePath)).rejects.toThrow('Image not found');
      expect(histogramSpy).toHaveBeenCalledWith(imagePath);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle invalid image format', async () => {
      const histogramSpy = jest.spyOn(enhancementService, 'histogramEqualization').mockRejectedValue(
        new Error('Invalid image format')
      );
      const imagePath = 'test.txt';
      await expect(enhancementController.handleHistogramEqualization(imagePath)).rejects.toThrow('Invalid image format');
      expect(histogramSpy).toHaveBeenCalledWith(imagePath);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleFloodFill', () => {
    it('should call floodFill with correct parameters', async () => {
      const floodFillSpy = jest.spyOn(enhancementService, 'floodFill').mockResolvedValue({
        success: true,
        message: 'Flood fill completed successfully',
        savedImagePath: 'output.jpg',
      });
      const data = {
        imagePath: 'test.jpg',
        sr: 10,
        sc: 10,
        newColor: [255, 0, 0] as [number, number, number],
      };
      const result = await enhancementController.handleFloodFill(data);
      expect(floodFillSpy).toHaveBeenCalledWith(data.imagePath, data.sr, data.sc, data.newColor);
      expect(result.success).toBe(true);
      expect(logger.log).toHaveBeenCalledWith('Received image for flood fill');
    });

    it('should handle out of bounds coordinates', async () => {
      const floodFillSpy = jest.spyOn(enhancementService, 'floodFill').mockRejectedValue(
        new Error('Coordinates out of bounds')
      );
      const data = {
        imagePath: 'test.jpg',
        sr: 1000,
        sc: 1000,
        newColor: [255, 0, 0] as [number, number, number],
      };
      await expect(enhancementController.handleFloodFill(data)).rejects.toThrow('Coordinates out of bounds');
      expect(floodFillSpy).toHaveBeenCalledWith(data.imagePath, data.sr, data.sc, data.newColor);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle invalid color values', async () => {
      const floodFillSpy = jest.spyOn(enhancementService, 'floodFill').mockRejectedValue(
        new Error('Invalid color values')
      );
      const data = {
        imagePath: 'test.jpg',
        sr: 10,
        sc: 10,
        newColor: [300, -1, 0] as [number, number, number],
      };
      await expect(enhancementController.handleFloodFill(data)).rejects.toThrow('Invalid color values');
      expect(floodFillSpy).toHaveBeenCalledWith(data.imagePath, data.sr, data.sc, data.newColor);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle memory error for large images', async () => {
      const floodFillSpy = jest.spyOn(enhancementService, 'floodFill').mockRejectedValue(
        new Error('Out of memory')
      );
      const data = {
        imagePath: 'large.jpg',
        sr: 10,
        sc: 10,
        newColor: [255, 0, 0] as [number, number, number],
      };
      await expect(enhancementController.handleFloodFill(data)).rejects.toThrow('Out of memory');
      expect(floodFillSpy).toHaveBeenCalledWith(data.imagePath, data.sr, data.sc, data.newColor);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

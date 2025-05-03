/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { EnhancementController } from './enhancement.controller';
import { EnhancementService } from './enhancement.service';
import { Logger } from '@nestjs/common';
import { HistogramEqualizationService } from './services/histrogramEqualization.service';
import { FloodFillService } from './services/floodfill.service';

describe('EnhancementController', () => {
  let enhancementController: EnhancementController;
  let enhancementService: EnhancementService;
  let logger: Logger;
  let histogramService: HistogramEqualizationService;
  let floodFillService: FloodFillService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EnhancementController],
      providers: [
        EnhancementService,
        {
          provide: HistogramEqualizationService,
          useValue: {
            equalizeHistogram: jest.fn().mockImplementation(async (data: { imagePath: string }) => ({
              success: true,
              message: 'Histogram equalization completed successfully',
              savedImagePath: 'output.jpg',
            })),
          },
        },
        {
          provide: FloodFillService,
          useValue: {
            floodFill: jest.fn().mockImplementation(async (data) => ({
              message: 'Flood fill applied successfully. 100 pixels changed.',
              outputPath: 'output.jpg',
              pixelsFilled: 100,
            })),
          },
        },
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
    histogramService = app.get<HistogramEqualizationService>(HistogramEqualizationService);
    floodFillService = app.get<FloodFillService>(FloodFillService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleHistogramEqualization', () => {
    it('should call histogramEqualization with correct parameters', async () => {
      const imagePath = 'test.jpg';
      const result = await enhancementController.handleHistogramEqualization(imagePath);
      expect(histogramService.equalizeHistogram).toHaveBeenCalledWith({ imagePath });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Histogram equalization completed successfully');
      expect(result.savedImagePath).toBe('output.jpg');
      expect(logger.log).toHaveBeenCalledWith('Received image for histogram equalization');
    });

    it('should handle non-existent image', async () => {
      const errorMessage = 'Image not found';
      (histogramService.equalizeHistogram as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );
      const imagePath = 'nonexistent.jpg';
      await expect(enhancementController.handleHistogramEqualization(imagePath)).rejects.toThrow(errorMessage);
      expect(histogramService.equalizeHistogram).toHaveBeenCalledWith({ imagePath });
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(errorMessage),
        expect.any(String)
      );
    });

    it('should handle invalid image format', async () => {
      const errorMessage = 'Invalid image format';
      (histogramService.equalizeHistogram as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );
      const imagePath = 'test.txt';
      await expect(enhancementController.handleHistogramEqualization(imagePath)).rejects.toThrow(errorMessage);
      expect(histogramService.equalizeHistogram).toHaveBeenCalledWith({ imagePath });
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(errorMessage),
        expect.any(String)
      );
    });
  });

  describe('handleFloodFill', () => {
    it('should call floodFill with correct parameters', async () => {
      const data = {
        imagePath: 'test.jpg',
        sr: 10,
        sc: 10,
        newColor: [255, 0, 0] as [number, number, number],
      };
      const result = await enhancementController.handleFloodFill(data);
      expect(floodFillService.floodFill).toHaveBeenCalledWith(data);
      expect(result.message).toBe('Flood fill applied successfully. 100 pixels changed.');
      expect(result.outputPath).toBe('output.jpg');
      expect(result.pixelsFilled).toBe(100);
      expect(logger.log).toHaveBeenCalledWith('Received image for flood fill');
    });

    it('should handle out of bounds coordinates', async () => {
      const errorMessage = 'Coordinates out of bounds';
      (floodFillService.floodFill as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );
      const data = {
        imagePath: 'test.jpg',
        sr: 1000,
        sc: 1000,
        newColor: [255, 0, 0] as [number, number, number],
      };
      await expect(enhancementController.handleFloodFill(data)).rejects.toThrow(errorMessage);
      expect(floodFillService.floodFill).toHaveBeenCalledWith(data);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(errorMessage),
        expect.any(String)
      );
    });

    it('should handle invalid color values', async () => {
      const errorMessage = 'Invalid color values';
      (floodFillService.floodFill as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );
      const data = {
        imagePath: 'test.jpg',
        sr: 10,
        sc: 10,
        newColor: [300, -1, 0] as [number, number, number],
      };
      await expect(enhancementController.handleFloodFill(data)).rejects.toThrow(errorMessage);
      expect(floodFillService.floodFill).toHaveBeenCalledWith(data);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(errorMessage),
        expect.any(String)
      );
    });

    it('should handle memory error for large images', async () => {
      const errorMessage = 'Out of memory';
      (floodFillService.floodFill as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );
      const data = {
        imagePath: 'large.jpg',
        sr: 10,
        sc: 10,
        newColor: [255, 0, 0] as [number, number, number],
      };
      await expect(enhancementController.handleFloodFill(data)).rejects.toThrow(errorMessage);
      expect(floodFillService.floodFill).toHaveBeenCalledWith(data);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(errorMessage),
        expect.any(String)
      );
    });
  });
});

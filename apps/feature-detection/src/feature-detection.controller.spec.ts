/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDetectionController } from './feature-detection.controller';
import { FeatureDetectionService } from './feature-detection.service';
import { Logger } from '@nestjs/common';

describe('FeatureDetectionController', () => {
  let featureDetectionController: FeatureDetectionController;
  let featureDetectionService: FeatureDetectionService;
  let logger: Logger;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FeatureDetectionController],
      providers: [
        FeatureDetectionService,
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    featureDetectionController = app.get<FeatureDetectionController>(FeatureDetectionController);
    featureDetectionService = app.get<FeatureDetectionService>(FeatureDetectionService);
    logger = app.get<Logger>(Logger);
  });

  describe('handleCannyEdgeDetection', () => {
    it('should call cannyEdgeDetection with correct parameters', async () => {
      const cannySpy = jest.spyOn(featureDetectionService, 'cannyEdgeDetection').mockResolvedValue({
        success: true,
        message: 'Canny edge detection completed successfully',
        savedImagePath: 'output.jpg',
      });
      const imagePath = 'test.jpg';
      const result = await featureDetectionController.handleCannyEdgeDetection(imagePath);
      expect(cannySpy).toHaveBeenCalledWith(imagePath);
      expect(result.success).toBe(true);
      expect(logger.log).toHaveBeenCalledWith('Received image for canny edge detection');
    });

    it('should handle non-existent image', async () => {
      const cannySpy = jest.spyOn(featureDetectionService, 'cannyEdgeDetection').mockRejectedValue(
        new Error('Image not found')
      );
      const imagePath = 'nonexistent.jpg';
      await expect(featureDetectionController.handleCannyEdgeDetection(imagePath)).rejects.toThrow('Image not found');
      expect(cannySpy).toHaveBeenCalledWith(imagePath);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle invalid image format', async () => {
      const cannySpy = jest.spyOn(featureDetectionService, 'cannyEdgeDetection').mockRejectedValue(
        new Error('Invalid image format')
      );
      const imagePath = 'test.txt';
      await expect(featureDetectionController.handleCannyEdgeDetection(imagePath)).rejects.toThrow('Invalid image format');
      expect(cannySpy).toHaveBeenCalledWith(imagePath);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle processing error', async () => {
      const cannySpy = jest.spyOn(featureDetectionService, 'cannyEdgeDetection').mockRejectedValue(
        new Error('Processing error')
      );
      const imagePath = 'test.jpg';
      await expect(featureDetectionController.handleCannyEdgeDetection(imagePath)).rejects.toThrow('Processing error');
      expect(cannySpy).toHaveBeenCalledWith(imagePath);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleHarrisSharp', () => {
    it('should call detectCorners with correct parameters', async () => {
      const harrisSpy = jest.spyOn(featureDetectionService, 'detectCorners').mockResolvedValue({
        success: true,
        message: 'Harris corner detection completed successfully',
        savedImagePath: 'output.jpg',
        corners: [{ x: 10, y: 10 }],
      });
      const data = {
        imagePath: 'test.jpg',
        k: 0.04,
        windowSize: 3,
        thresh: 0.01,
      };
      const result = await featureDetectionController.handleHarrisSharp(data);
      expect(harrisSpy).toHaveBeenCalledWith(data.imagePath, data.k, data.windowSize, data.thresh);
      expect(result.success).toBe(true);
      expect(logger.log).toHaveBeenCalledWith('Received image for Harris corner detection');
    });

    it('should handle invalid Harris parameters', async () => {
      const harrisSpy = jest.spyOn(featureDetectionService, 'detectCorners').mockRejectedValue(
        new Error('Invalid Harris parameters')
      );
      const data = {
        imagePath: 'test.jpg',
        k: -0.04,
        windowSize: 0,
        thresh: -0.01,
      };
      await expect(featureDetectionController.handleHarrisSharp(data)).rejects.toThrow('Invalid Harris parameters');
      expect(harrisSpy).toHaveBeenCalledWith(data.imagePath, data.k, data.windowSize, data.thresh);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle non-existent image', async () => {
      const harrisSpy = jest.spyOn(featureDetectionService, 'detectCorners').mockRejectedValue(
        new Error('Image not found')
      );
      const data = {
        imagePath: 'nonexistent.jpg',
        k: 0.04,
        windowSize: 3,
        thresh: 0.01,
      };
      await expect(featureDetectionController.handleHarrisSharp(data)).rejects.toThrow('Image not found');
      expect(harrisSpy).toHaveBeenCalledWith(data.imagePath, data.k, data.windowSize, data.thresh);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle memory error for large images', async () => {
      const harrisSpy = jest.spyOn(featureDetectionService, 'detectCorners').mockRejectedValue(
        new Error('Out of memory')
      );
      const data = {
        imagePath: 'large.jpg',
        k: 0.04,
        windowSize: 3,
        thresh: 0.01,
      };
      await expect(featureDetectionController.handleHarrisSharp(data)).rejects.toThrow('Out of memory');
      expect(harrisSpy).toHaveBeenCalledWith(data.imagePath, data.k, data.windowSize, data.thresh);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

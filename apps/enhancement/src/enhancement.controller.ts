/* eslint-disable prettier/prettier */
import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { EnhancementService } from './enhancement.service';

@Controller()
export class EnhancementController {
  private readonly logger = new Logger(EnhancementController.name);

  constructor(private readonly enhancementService: EnhancementService) { }

  @EventPattern({ cmd: 'histogram_equalization_image' })
  async handleHistogramEqualization(imagePath: string) {
    this.logger.log('Received image for histogram equalization');
    try {
      return await this.enhancementService.histogramEqualization(imagePath);
    } catch (error) {
      this.logger.error(`Failed to process histogram equalization: ${error.message}`, error.stack);
      throw error;
    }
  }

  @EventPattern({ cmd: 'flood_fill_image' })
  async handleFloodFill(data: { imagePath: string; sr: number; sc: number; newColor: [number, number, number] }) {
    this.logger.log('Received image for flood fill');
    try {
      return await this.enhancementService.floodFill(data.imagePath, data.sr, data.sc, data.newColor);
    } catch (error) {
      this.logger.error(`Failed to process flood fill: ${error.message}`, error.stack);
      throw error;
    }
  }
}

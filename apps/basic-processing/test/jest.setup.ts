import { Logger } from '@nestjs/common';

// Disable logging during tests
Logger.overrideLogger(['error', 'warn']);

// Increase timeout for image processing tests
jest.setTimeout(30000); 
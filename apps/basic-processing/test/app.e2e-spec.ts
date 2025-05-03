import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { BasicProcessingModule } from './../src/basic-processing.module';
import * as fs from 'fs';
import * as path from 'path';

describe('BasicProcessingController (e2e)', () => {
  let app: INestApplication;
  let client: ClientProxy;
  const testImagePath = path.join(__dirname, 'test-image.jpg');

  beforeAll(() => {
    // Create a test image if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      // Create a simple 100x100 black image
      const sharp = require('sharp');
      sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 0, g: 0, b: 0 }
        }
      })
      .jpeg()
      .toFile(testImagePath);
    }
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        BasicProcessingModule,
        ClientsModule.register([
          {
            name: 'BASIC_PROCESSING_SERVICE',
            transport: Transport.TCP,
            options: {
              host: 'localhost',
              port: 3001,
            },
          },
        ]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    client = app.get('BASIC_PROCESSING_SERVICE');
    await app.init();
    await app.connectMicroservice({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3001,
      },
    });
    await app.startAllMicroservices();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(() => {
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  describe('Image Processing Tests', () => {
    it('should handle resize image request successfully', async () => {
      const response = await client
        .send({ cmd: 'resize_image' }, {
          imagePath: testImagePath,
          width: 50,
          height: 50,
        })
        .toPromise();
      
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(fs.existsSync(response.message)).toBe(true);
    });

    it('should handle invalid resize dimensions', async () => {
      const response = await client
        .send({ cmd: 'resize_image' }, {
          imagePath: testImagePath,
          width: -1,
          height: 50,
        })
        .toPromise();
      
      expect(response).toBeDefined();
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should handle greyscale conversion request', async () => {
      const response = await client
        .send({ cmd: 'convert_greyscale' }, { imagePath: testImagePath })
        .toPromise();
      
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(fs.existsSync(response.message)).toBe(true);
    });

    it('should handle negative creation request', async () => {
      const response = await client
        .send({ cmd: 'create_negative' }, testImagePath)
        .toPromise();
      
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(fs.existsSync(response.message)).toBe(true);
    });

    it('should handle contrast adjustment request', async () => {
      const response = await client
        .send({ cmd: 'adjust_contrast' }, {
          imagePath: testImagePath,
          contrast: 1.5,
        })
        .toPromise();
      
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(fs.existsSync(response.message)).toBe(true);
    });

    it('should handle image rotation request', async () => {
      const response = await client
        .send({ cmd: 'rotate_image' }, {
          imagePath: testImagePath,
          angle: 90,
        })
        .toPromise();
      
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(fs.existsSync(response.message)).toBe(true);
    });

    it('should handle image sharpening request', async () => {
      const response = await client
        .send({ cmd: 'sharpen_image' }, testImagePath)
        .toPromise();
      
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(fs.existsSync(response.message)).toBe(true);
    });

    it('should handle image embossing request', async () => {
      const response = await client
        .send({ cmd: 'emboss_image' }, testImagePath)
        .toPromise();
      
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(fs.existsSync(response.message)).toBe(true);
    });

    it('should handle non-existent image path', async () => {
      const response = await client
        .send({ cmd: 'resize_image' }, {
          imagePath: 'non-existent.jpg',
          width: 50,
          height: 50,
        })
        .toPromise();
      
      expect(response).toBeDefined();
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FastCheckoutRulesService } from './fast-checkout-rules.service';
import { FastCheckoutConfig } from '../database/entities/fast-checkout-config.entity';

describe('FastCheckoutRulesService', () => {
  let service: FastCheckoutRulesService;
  let configRepository: Repository<FastCheckoutConfig>;

  const mockConfigRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FastCheckoutRulesService,
        {
          provide: getRepositoryToken(FastCheckoutConfig),
          useValue: mockConfigRepository,
        },
      ],
    }).compile();

    service = module.get<FastCheckoutRulesService>(FastCheckoutRulesService);
    configRepository = module.get<Repository<FastCheckoutConfig>>(
      getRepositoryToken(FastCheckoutConfig),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateFastCheckout', () => {
    it('should allow if mode is disabled', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        enabled: false,
      });

      const result = await service.validateFastCheckout(
        'store-1',
        15,
        false,
        false,
      );

      expect(result.valid).toBe(true);
    });

    it('should reject if item count exceeds max', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        enabled: true,
        max_items: 10,
      });

      const result = await service.validateFastCheckout(
        'store-1',
        15,
        false,
        false,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('máximo');
    });

    it('should reject if has discounts and not allowed', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        enabled: true,
        max_items: 10,
        allow_discounts: false,
      });

      const result = await service.validateFastCheckout(
        'store-1',
        5,
        true,
        false,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('descuentos');
    });

    it('should reject if has customer and not allowed', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        enabled: true,
        max_items: 10,
        allow_customer_selection: false,
      });

      const result = await service.validateFastCheckout(
        'store-1',
        5,
        false,
        true,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('cliente');
    });

    it('should allow if all validations pass', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        enabled: true,
        max_items: 10,
        allow_discounts: true,
        allow_customer_selection: true,
      });

      const result = await service.validateFastCheckout(
        'store-1',
        5,
        true,
        true,
      );

      expect(result.valid).toBe(true);
    });
  });
});


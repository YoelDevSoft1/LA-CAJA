import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRulesService } from './payment-rules.service';
import { PaymentMethodConfig } from '../database/entities/payment-method-config.entity';

describe('PaymentRulesService', () => {
  let service: PaymentRulesService;
  let configRepository: Repository<PaymentMethodConfig>;

  const mockConfigRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRulesService,
        {
          provide: getRepositoryToken(PaymentMethodConfig),
          useValue: mockConfigRepository,
        },
      ],
    }).compile();

    service = module.get<PaymentRulesService>(PaymentRulesService);
    configRepository = module.get<Repository<PaymentMethodConfig>>(
      getRepositoryToken(PaymentMethodConfig),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validatePaymentMethod', () => {
    it('should allow payment if no config exists', async () => {
      mockConfigRepository.findOne.mockResolvedValue(null);

      const result = await service.validatePaymentMethod(
        'store-1',
        'CASH_BS',
        100,
        'BS',
      );

      expect(result.valid).toBe(true);
    });

    it('should reject if method is disabled', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        enabled: false,
      });

      const result = await service.validatePaymentMethod(
        'store-1',
        'CASH_BS',
        100,
        'BS',
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('deshabilitado');
    });

    it('should reject if amount is below minimum', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        enabled: true,
        min_amount_bs: 200,
      });

      const result = await service.validatePaymentMethod(
        'store-1',
        'CASH_BS',
        100,
        'BS',
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Monto mínimo');
    });

    it('should reject if amount exceeds maximum', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        enabled: true,
        max_amount_bs: 50,
      });

      const result = await service.validatePaymentMethod(
        'store-1',
        'CASH_BS',
        100,
        'BS',
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Monto máximo');
    });

    it('should allow payment if within limits', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        enabled: true,
        min_amount_bs: 50,
        max_amount_bs: 200,
      });

      const result = await service.validatePaymentMethod(
        'store-1',
        'CASH_BS',
        100,
        'BS',
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('validateSplitPayment', () => {
    it('should validate all methods in split', async () => {
      mockConfigRepository.findOne
        .mockResolvedValueOnce({ enabled: true }) // CASH_BS
        .mockResolvedValueOnce({ enabled: true }); // PAGO_MOVIL

      const split = {
        cash_bs: 100,
        pago_movil_bs: 50,
      };

      const result = await service.validateSplitPayment('store-1', split);

      expect(result.valid).toBe(true);
      expect(mockConfigRepository.findOne).toHaveBeenCalledTimes(2);
    });
  });
});


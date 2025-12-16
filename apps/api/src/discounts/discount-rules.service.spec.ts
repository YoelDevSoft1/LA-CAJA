import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscountRulesService } from './discount-rules.service';
import { DiscountConfig } from '../database/entities/discount-config.entity';

describe('DiscountRulesService', () => {
  let service: DiscountRulesService;
  let configRepository: Repository<DiscountConfig>;

  const mockConfigRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountRulesService,
        {
          provide: getRepositoryToken(DiscountConfig),
          useValue: mockConfigRepository,
        },
      ],
    }).compile();

    service = module.get<DiscountRulesService>(DiscountRulesService);
    configRepository = module.get<Repository<DiscountConfig>>(
      getRepositoryToken(DiscountConfig),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requiresAuthorization', () => {
    it('should auto-approve if authorization not required', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        requires_authorization: false,
      });

      const result = await service.requiresAuthorization(
        'store-1',
        100,
        10,
        5,
      );

      expect(result.requires_authorization).toBe(false);
      expect(result.auto_approved).toBe(true);
    });

    it('should auto-approve if below auto-approve percentage', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        requires_authorization: true,
        auto_approve_below_percentage: 10,
      });

      const result = await service.requiresAuthorization(
        'store-1',
        100,
        10,
        5, // 5% < 10%
      );

      expect(result.requires_authorization).toBe(false);
      expect(result.auto_approved).toBe(true);
    });

    it('should require authorization if exceeds max percentage', async () => {
      mockConfigRepository.findOne.mockResolvedValue({
        requires_authorization: true,
        max_percentage: 10,
      });

      const result = await service.requiresAuthorization(
        'store-1',
        100,
        10,
        15, // 15% > 10%
      );

      expect(result.requires_authorization).toBe(true);
      expect(result.error).toContain('excede el máximo permitido');
    });
  });

  describe('validateAuthorizationRole', () => {
    it('should allow owner to authorize', () => {
      const config = {
        authorization_role: 'supervisor',
      } as DiscountConfig;

      expect(service.validateAuthorizationRole('owner', config)).toBe(true);
    });

    it('should reject cashier if requires supervisor', () => {
      const config = {
        authorization_role: 'supervisor',
      } as DiscountConfig;

      expect(service.validateAuthorizationRole('cashier', config)).toBe(false);
    });
  });
});


import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ShiftsService } from './shifts.service';
import { Shift, ShiftStatus } from '../database/entities/shift.entity';
import { ShiftCut } from '../database/entities/shift-cut.entity';
import { Sale } from '../database/entities/sale.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ShiftsService', () => {
  let service: ShiftsService;
  let shiftRepository: Repository<Shift>;
  let shiftCutRepository: Repository<ShiftCut>;
  let saleRepository: Repository<Sale>;

  const mockShiftRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockShiftCutRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockSaleRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        {
          provide: getRepositoryToken(Shift),
          useValue: mockShiftRepository,
        },
        {
          provide: getRepositoryToken(ShiftCut),
          useValue: mockShiftCutRepository,
        },
        {
          provide: getRepositoryToken(Sale),
          useValue: mockSaleRepository,
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
    shiftRepository = module.get<Repository<Shift>>(getRepositoryToken(Shift));
    shiftCutRepository = module.get<Repository<ShiftCut>>(
      getRepositoryToken(ShiftCut),
    );
    saleRepository = module.get<Repository<Sale>>(getRepositoryToken(Sale));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('openShift', () => {
    it('should open a new shift successfully', async () => {
      const storeId = 'store-1';
      const cashierId = 'cashier-1';
      const dto = {
        opening_amount_bs: 100,
        opening_amount_usd: 10,
        note: 'Test shift',
      };

      mockShiftRepository.findOne.mockResolvedValue(null);
      mockShiftRepository.create.mockReturnValue({
        id: 'shift-1',
        ...dto,
        store_id: storeId,
        cashier_id: cashierId,
        status: ShiftStatus.OPEN,
      });
      mockShiftRepository.save.mockResolvedValue({
        id: 'shift-1',
        ...dto,
        store_id: storeId,
        cashier_id: cashierId,
        status: ShiftStatus.OPEN,
        opened_at: new Date(),
      });

      const result = await service.openShift(storeId, cashierId, dto);

      expect(result).toBeDefined();
      expect(result.status).toBe(ShiftStatus.OPEN);
      expect(mockShiftRepository.findOne).toHaveBeenCalledWith({
        where: {
          store_id: storeId,
          cashier_id: cashierId,
          status: ShiftStatus.OPEN,
        },
      });
    });

    it('should throw error if shift is already open', async () => {
      const storeId = 'store-1';
      const cashierId = 'cashier-1';
      const dto = {
        opening_amount_bs: 100,
        opening_amount_usd: 10,
      };

      mockShiftRepository.findOne.mockResolvedValue({
        id: 'existing-shift',
        status: ShiftStatus.OPEN,
      });

      await expect(
        service.openShift(storeId, cashierId, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCurrentShift', () => {
    it('should return current open shift', async () => {
      const storeId = 'store-1';
      const cashierId = 'cashier-1';
      const mockShift = {
        id: 'shift-1',
        store_id: storeId,
        cashier_id: cashierId,
        status: ShiftStatus.OPEN,
      };

      mockShiftRepository.findOne.mockResolvedValue(mockShift);

      const result = await service.getCurrentShift(storeId, cashierId);

      expect(result).toEqual(mockShift);
      expect(mockShiftRepository.findOne).toHaveBeenCalledWith({
        where: {
          store_id: storeId,
          cashier_id: cashierId,
          status: ShiftStatus.OPEN,
        },
        relations: ['cuts'],
        order: {
          opened_at: 'DESC',
        },
      });
    });

    it('should return null if no shift is open', async () => {
      const storeId = 'store-1';
      const cashierId = 'cashier-1';

      mockShiftRepository.findOne.mockResolvedValue(null);

      const result = await service.getCurrentShift(storeId, cashierId);

      expect(result).toBeNull();
    });
  });

  describe('closeShift', () => {
    it('should close shift successfully', async () => {
      const storeId = 'store-1';
      const cashierId = 'cashier-1';
      const shiftId = 'shift-1';
      const dto = {
        counted_bs: 150,
        counted_usd: 15,
      };

      const mockShift = {
        id: shiftId,
        store_id: storeId,
        cashier_id: cashierId,
        status: ShiftStatus.OPEN,
        opened_at: new Date(),
        opening_amount_bs: 100,
        opening_amount_usd: 10,
      };

      mockShiftRepository.findOne.mockResolvedValue(mockShift);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockSaleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockShiftRepository.save.mockResolvedValue({
        ...mockShift,
        status: ShiftStatus.CLOSED,
        closed_at: new Date(),
      });

      const result = await service.closeShift(storeId, cashierId, shiftId, dto);

      expect(result).toBeDefined();
      expect(result.status).toBe(ShiftStatus.CLOSED);
    });

    it('should throw error if shift not found', async () => {
      const storeId = 'store-1';
      const cashierId = 'cashier-1';
      const shiftId = 'shift-1';
      const dto = {
        counted_bs: 150,
        counted_usd: 15,
      };

      mockShiftRepository.findOne.mockResolvedValue(null);

      await expect(
        service.closeShift(storeId, cashierId, shiftId, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

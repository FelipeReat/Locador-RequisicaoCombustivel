import { describe, it, expect } from 'vitest';
import { filterChecklistsByDate, groupChecklistsByVehicle, isNonCompliant } from './checklist-utils';
import { VehicleChecklist, Vehicle } from '@shared/schema';

describe('Checklist Utils', () => {
  const mockVehicles: Vehicle[] = [
    { id: 1, plate: 'ABC-1234', model: 'Gol', brand: 'VW', year: 2020, fuelType: 'flex', mileage: '1000', status: 'active', companyId: 1, vehicleTypeId: 1, lastMaintenance: null, nextMaintenance: null, createdAt: 'now', updatedAt: 'now' },
    { id: 2, plate: 'XYZ-9876', model: 'Uno', brand: 'Fiat', year: 2019, fuelType: 'flex', mileage: '2000', status: 'active', companyId: 1, vehicleTypeId: 1, lastMaintenance: null, nextMaintenance: null, createdAt: 'now', updatedAt: 'now' },
  ];

  const mockChecklists: VehicleChecklist[] = [
    { id: 1, vehicleId: 1, userId: 1, checklistTemplateId: 1, kmInitial: '1000', kmFinal: '1100', fuelLevelStart: 'full', fuelLevelEnd: 'half', inspectionStart: '{}', inspectionEnd: '{}', status: 'closed', startDate: '2023-01-01T10:00:00Z', endDate: '2023-01-01T12:00:00Z', createdAt: 'now', updatedAt: 'now' },
    { id: 2, vehicleId: 1, userId: 1, checklistTemplateId: 1, kmInitial: '1100', kmFinal: '1150', fuelLevelStart: 'half', fuelLevelEnd: 'reserve', inspectionStart: '{}', inspectionEnd: '{"notes": "Problem found"}', status: 'closed', startDate: '2023-01-02T10:00:00Z', endDate: '2023-01-02T12:00:00Z', createdAt: 'now', updatedAt: 'now' },
    { id: 3, vehicleId: 2, userId: 1, checklistTemplateId: 1, kmInitial: '2000', kmFinal: null, fuelLevelStart: 'full', fuelLevelEnd: null, inspectionStart: '{}', inspectionEnd: null, status: 'open', startDate: '2023-01-03T10:00:00Z', endDate: null, createdAt: 'now', updatedAt: 'now' },
  ];

  it('should filter checklists by date', () => {
    const start = new Date('2023-01-01');
    const end = new Date('2023-01-01');
    const filtered = filterChecklistsByDate(mockChecklists, start, end);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(1);
  });

  it('should group checklists by vehicle and calculate stats', () => {
    const stats = groupChecklistsByVehicle(mockChecklists, mockVehicles);
    expect(stats.length).toBe(2);

    const v1Stats = stats.find(s => s.vehicleId === 1);
    expect(v1Stats).toBeDefined();
    expect(v1Stats?.totalChecklists).toBe(2);
    expect(v1Stats?.totalKm).toBe(150); // (1100-1000) + (1150-1100) = 100 + 50 = 150
    expect(v1Stats?.avgKmPerTrip).toBe(75); // 150 / 2

    const v2Stats = stats.find(s => s.vehicleId === 2);
    expect(v2Stats).toBeDefined();
    expect(v2Stats?.totalChecklists).toBe(1);
    expect(v2Stats?.totalKm).toBe(0); // Open checklist, no kmFinal
  });

  it('should identify non-compliant checklists', () => {
    expect(isNonCompliant(mockChecklists[0])).toBe(false);
    expect(isNonCompliant(mockChecklists[1])).toBe(true); // Has notes
    expect(isNonCompliant(mockChecklists[2])).toBe(false); // Open
  });
});

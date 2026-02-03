import { VehicleChecklist, Vehicle } from "@shared/schema";

export type VehicleStats = {
  vehicleId: number;
  plate: string;
  model: string;
  totalChecklists: number;
  totalKm: number;
  avgKmPerTrip: number;
  checklists: VehicleChecklist[];
};

export function formatDateBR(dateStr: string | number | Date | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Manaus"
    }).format(date);
  } catch (e) {
    return String(dateStr);
  }
}

export function filterChecklistsByDate(
  checklists: VehicleChecklist[],
  startDate: Date | undefined,
  endDate: Date | undefined
): VehicleChecklist[] {
  if (!startDate && !endDate) return checklists;

  return checklists.filter((c) => {
    const date = new Date(c.startDate);
    // Reset time components for date comparison
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    let matchesStart = true;
    if (startDate) {
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      matchesStart = checkDate >= start;
    }

    let matchesEnd = true;
    if (endDate) {
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      matchesEnd = checkDate <= end;
    }

    return matchesStart && matchesEnd;
  });
}

export function groupChecklistsByVehicle(
  checklists: VehicleChecklist[],
  vehicles: Vehicle[]
): VehicleStats[] {
  const groups = new Map<number, VehicleChecklist[]>();

  checklists.forEach((c) => {
    const vid = c.vehicleId;
    if (!groups.has(vid)) {
      groups.set(vid, []);
    }
    groups.get(vid)?.push(c);
  });

  const stats: VehicleStats[] = [];

  groups.forEach((list, vid) => {
    const vehicle = vehicles.find((v) => v.id === vid);
    if (!vehicle) return;

    // Sort by date desc
    list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    let totalKm = 0;
    let completedTrips = 0;

    list.forEach((c) => {
      if (c.kmInitial && c.kmFinal) {
        const start = parseFloat(c.kmInitial);
        const end = parseFloat(c.kmFinal);
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          totalKm += end - start;
          completedTrips++;
        }
      }
    });

    stats.push({
      vehicleId: vid,
      plate: vehicle.plate,
      model: vehicle.model,
      totalChecklists: list.length,
      totalKm: totalKm,
      avgKmPerTrip: completedTrips > 0 ? totalKm / completedTrips : 0,
      checklists: list,
    });
  });

  // Sort alphabetically by plate
  stats.sort((a, b) => a.plate.localeCompare(b.plate));

  return stats;
}

export function isNonCompliant(checklist: VehicleChecklist): boolean {
  if (checklist.status !== 'closed') return false;
  
  // Check inspectionEnd for notes or issues
  // This is a heuristic based on available data
  try {
    if (checklist.inspectionEnd) {
      const endData = JSON.parse(checklist.inspectionEnd);
      // If there are notes, assume non-compliance or at least attention needed
      if (endData.notes && endData.notes.trim().length > 0) {
        return true;
      }
      // Add more checks here if schema allows (e.g. specific item failures)
    }
  } catch (e) {
    // ignore parse error
  }
  return false;
}

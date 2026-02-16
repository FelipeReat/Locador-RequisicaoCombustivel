
import { render, screen, waitFor } from '@testing-library/react';
import { ChecklistDetails } from './checklist-details';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';

// Mock dependencies
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockChecklist = {
  id: 1,
  vehicleId: 1,
  userId: 1,
  startDate: new Date().toISOString(),
  kmInitial: "1000",
  fuelLevelStart: "full",
  checklistTemplateId: null,
  // Using string "true" to reproduce the issue
  inspectionStart: JSON.stringify({
    "item1": "true",
    "item2": true,
    "item3": false,
    "item4": "false"
  }),
  status: "open"
};

// Mock apiRequest
vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn().mockResolvedValue({
    json: () => Promise.resolve([
      { key: 'item1', label: 'Item 1', group: 'group1' },
      { key: 'item2', label: 'Item 2', group: 'group1' },
      { key: 'item3', label: 'Item 3', group: 'group1' },
      { key: 'item4', label: 'Item 4', group: 'group1' }
    ])
  })
}));

// Mock checklist constants
vi.mock("@/lib/checklist-constants", () => ({
  obsConfig: [
    { key: 'item1', label: 'Item 1', group: 'group1' },
    { key: 'item2', label: 'Item 2', group: 'group1' },
    { key: 'item3', label: 'Item 3', group: 'group1' },
    { key: 'item4', label: 'Item 4', group: 'group1' }
  ],
  obsGroups: [
    { key: 'group1', label: 'Group 1' }
  ],
  fallbackObsConfig: []
}));

describe('ChecklistDetails', () => {
  it('renders check marks correctly for truthy values', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChecklistDetails checklist={mockChecklist as any} />
      </QueryClientProvider>
    );

    // We expect "Item 1" to be green (checked) because "true" string
    // We expect "Item 2" to be green (checked) because true boolean
    // We expect "Item 3" to be red (unchecked) because false boolean
    // We expect "Item 4" to be red (unchecked) because "false" string

    // Find by text "Item 1"
    const item1 = await screen.findByText('Item 1');
    const row1 = item1.closest('div');
    // Check icon is green-600, X icon is red-600
    // We can check if the SVG contains the color class
    expect(row1?.innerHTML).toContain('text-green-600');
    expect(row1?.innerHTML).not.toContain('text-red-600');

    const item2 = await screen.findByText('Item 2');
    const row2 = item2.closest('div');
    expect(row2?.innerHTML).toContain('text-green-600');

    const item3 = await screen.findByText('Item 3');
    const row3 = item3.closest('div');
    expect(row3?.innerHTML).toContain('text-red-600');
    expect(row3?.innerHTML).not.toContain('text-green-600');
    
    const item4 = await screen.findByText('Item 4');
    const row4 = item4.closest('div');
    expect(row4?.innerHTML).toContain('text-red-600');
  });
});

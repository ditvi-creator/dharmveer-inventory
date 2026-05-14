/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Godown {
  id: string;
  name: string;
}

export interface Booking {
  id: string;
  partyName: string;
  address: string;
  qty: number;
  dateOfBooking?: string;
  dateOfSend?: string;
  reminderActive?: boolean;
  reminderDismissed?: boolean;
  challanNo?: number;
}

export interface StockMovement {
  id: string;
  type: 'IN' | 'OUT';
  qty: number;
  date: number; // timestamp
}

export interface StockItem {
  id: string;
  name: string;
  size: string;
  unit: string;
  category?: string;
  openingStockMP?: number; // legacy
  openingStockKL?: number; // legacy
  godownStocks?: Record<string, number>;
  stockIn: number;
  stockOut: number;
  balance: number;
  reorderLevel: number;
  booked: number;
  partyName: string;
  updatedAt: any;
  ownerId?: string;
  bookings?: Booking[];
  movements?: StockMovement[];
}

export type StockAction = 'IN' | 'OUT' | 'BOOK';

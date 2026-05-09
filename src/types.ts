/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Booking {
  id: string;
  partyName: string;
  address: string;
  qty: number;
}

export interface StockItem {
  id: string;
  name: string;
  size: string;
  unit: string;
  openingStockMP: number;
  openingStockKL: number;
  stockIn: number;
  stockOut: number;
  balance: number;
  reorderLevel: number;
  booked: number;
  partyName: string;
  updatedAt: any;
  ownerId?: string;
  bookings?: Booking[];
}

export type StockAction = 'IN' | 'OUT' | 'BOOK';

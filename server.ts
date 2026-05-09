/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

// Middleware
app.use(express.json());

// Database setup
if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    items: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

const getDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const saveDB = (data: any) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// --- STOCK ROUTES (NO AUTH) ---
app.get('/api/stock', (req, res) => {
  const db = getDB();
  res.json(db.items);
});

app.delete('/api/stock', (req, res) => {
  const db = getDB();
  db.items = [];
  saveDB(db);
  res.json({ success: true });
});

app.post('/api/stock', (req, res) => {
  const db = getDB();
  const newItem = { ...req.body, id: randomUUID(), updatedAt: Date.now() };
  db.items.push(newItem);
  saveDB(db);
  res.json(newItem);
});

app.post('/api/stock/bulk', (req, res) => {
  const db = getDB();
  const newItems = req.body.map((item: any) => ({
    ...item,
    id: randomUUID(),
    updatedAt: Date.now()
  }));
  db.items.push(...newItems);
  saveDB(db);
  res.json({ success: true, count: newItems.length });
});

app.put('/api/stock/:id', (req, res) => {
  const db = getDB();
  const index = db.items.findIndex((i: any) => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });
  
  db.items[index] = { ...db.items[index], ...req.body, updatedAt: Date.now() };
  saveDB(db);
  res.json(db.items[index]);
});

app.delete('/api/stock/:id', (req, res) => {
  const db = getDB();
  db.items = db.items.filter((i: any) => i.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

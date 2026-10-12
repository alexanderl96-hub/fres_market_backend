import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, category, price_cents, unit, emoji, stock
       FROM products
       WHERE stock > 0
       ORDER BY category, name`
    );
    res.json({
      products: result.rows.map((product) => ({
        ...product,
        price: product.price_cents / 100
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;

INSERT INTO products (name, description, category, price_cents, unit, emoji, stock) VALUES
('Organic Avocados', 'Creamy, ripe avocados for toast, salads, and more.', 'Produce', 249, 'each', '🥑', 24),
('Sweet Strawberries', 'Bright, juicy berries picked for a naturally sweet bite.', 'Produce', 399, '1 basket', '🍓', 18),
('Farm Fresh Carrots', 'Crunchy carrots, perfect for snacking or roasting.', 'Produce', 199, '1 bunch', '🥕', 30),
('Baby Spinach', 'Tender leafy greens for salads, smoothies, and sautés.', 'Produce', 329, '1 bag', '🥬', 20),
('Sourdough Loaf', 'A rustic loaf with a crisp crust and soft center.', 'Bakery', 549, '1 loaf', '🍞', 12),
('Free-Range Eggs', 'A dozen versatile eggs from free-range hens.', 'Dairy & Eggs', 499, '12 eggs', '🥚', 16),
('Creamy Oat Milk', 'Smooth, plant-based oat milk for coffee and cereal.', 'Dairy & Eggs', 379, '1 carton', '🥛', 22),
('Wildflower Honey', 'Golden honey with a delicate floral finish.', 'Pantry', 699, '1 jar', '🍯', 10),
('Brown Rice', 'A wholesome pantry staple with a nutty flavor.', 'Pantry', 279, '1 bag', '🍚', 25),
('Lemons', 'Fresh citrus with a bright, zesty finish.', 'Produce', 89, 'each', '🍋', 40),
('Blueberries', 'Little bursts of sweetness for breakfast and baking.', 'Produce', 449, '1 basket', '🫐', 14),
('Fresh Basil', 'Fragrant basil leaves to brighten your favorite meals.', 'Produce', 229, '1 bunch', '🌿', 15)
ON CONFLICT DO NOTHING;

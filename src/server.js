import dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a random value at least 32 characters long.');
}
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

const { default: app } = await import('./app.js');
const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`Food Store API listening on http://localhost:${port}`);
});

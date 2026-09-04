require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});

console.log('Mencoba connect...');
client.connect()
  .then(() => {
    console.log('✅ BERHASIL connect ke database!');
    return client.end();
  })
  .catch((err) => {
    console.log('❌ GAGAL connect:');
    console.log(err.message);
    process.exit(1);
  });
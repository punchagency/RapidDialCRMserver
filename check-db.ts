import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("✅ Database tables:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error);
    await pool.end();
    process.exit(1);
  }
}

checkTables();

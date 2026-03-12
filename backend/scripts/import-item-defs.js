/* eslint-disable no-console */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

// === НАСТРОЙКИ ===
// 1) Путь к items_ext.txt (можешь поменять)
const INPUT_FILE = process.argv[2] || path.resolve(__dirname, "../../items_ext.txt");

// 2) Подключение к БД.
// Лучше всего — возьмём из ENV как обычно в проектах.
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASS || "";
const DB_NAME = process.env.DB_NAME || process.env.DB_DATABASE || "test1_gamedb"; // поменяй если надо

const BATCH_SIZE = 1000;

function parseLine(line) {
    // Формат: item_id|name|extra_text|ext_type
    const parts = line.split("|");
    if (parts.length < 2) return null;

    const itemId = Number(parts[0]);
    if (!Number.isFinite(itemId) || itemId <= 0) return null;

    const name = (parts[1] || "").trim();
    if (!name) return null;

    const extraText = (parts[2] || "").trim() || null;
    const extType = parts.length >= 4 && parts[3].trim() !== "" ? Number(parts[3]) : null;

    return { itemId, name, extraText, extType: Number.isFinite(extType) ? extType : null };
}

async function main() {
    console.log("Import item_defs from:", INPUT_FILE);

    if (!fs.existsSync(INPUT_FILE)) {
        throw new Error(`File not found: ${INPUT_FILE}`);
    }

    const content = fs.readFileSync(INPUT_FILE, "utf8");

    // На всякий случай убираем BOM
    const text = content.replace(/^\uFEFF/, "");

    const lines = text.split(/\r?\n/).filter(Boolean);

    console.log("Lines:", lines.length);

    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASS || "",
        database: process.env.DB_NAME || "zx",
    });

    // Таблица должна существовать
    await conn.execute(`
    CREATE TABLE IF NOT EXISTS item_defs (
      item_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      extra_text VARCHAR(255) NULL,
      ext_type INT NULL,
      PRIMARY KEY (item_id),
      KEY idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

    let batch = [];
    let okCount = 0;
    let skipCount = 0;

    async function flush() {
        if (!batch.length) return;

        // мульти-вставка
        const values = [];
        const placeholders = batch
            .map((r) => {
                values.push(r.itemId, r.name, r.extraText, r.extType);
                return "(?, ?, ?, ?)";
            })
            .join(",");

        const sql = `
      INSERT INTO item_defs (item_id, name, extra_text, ext_type)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        extra_text = VALUES(extra_text),
        ext_type = VALUES(ext_type)
    `;

        await conn.execute(sql, values);
        okCount += batch.length;
        batch = [];
        process.stdout.write(`\rImported: ${okCount}   Skipped: ${skipCount}`);
    }

    for (const line of lines) {
        const row = parseLine(line);
        if (!row) {
            skipCount++;
            continue;
        }
        batch.push(row);
        if (batch.length >= BATCH_SIZE) {
            await flush();
        }
    }
    await flush();

    console.log("\nDone ✅");
    await conn.end();
}
console.log("DB ENV:", {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS ? "***" : "",
    db: process.env.DB_NAME,
});

main().catch((e) => {
    console.error("\nERROR:", e);
    process.exit(1);
});
import mysql from "mysql2";
import dotenv from "dotenv";
import { readFileSync } from "fs";
dotenv.config();

// Validación de variables de entorno
const requiredEnv = ["DB_HOST", "DB_USER", "DB_NAME"];
requiredEnv.forEach((varName) => {
  if (!process.env[varName]) throw new Error(`❌ ${varName} es requerido`);
});

const ssl =
  process.env.NODE_ENV === "production"
    ? {
        ssl: {
          rejectUnauthorized: true,
          ca: [
            readFileSync(process.env.DB_SSL_CA_1, "utf8"), // DigiCert
            readFileSync(process.env.DB_SSL_CA_2, "utf8"), // Baltimore
          ],
        },
      }
    : {};

const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 30,
  timezone: "UTC",
  charset: "utf8mb4",
  ...sslOptions,
};

class Database {
  constructor() {
    this.pool = mysql.createPool(poolConfig);
    this.setupEventListeners();
    this.testConnection();
  }

  setupEventListeners() {
    this.pool.on("connection", (connection) => {
      console.log("🔌 Nueva conexión establecida");
    });

    this.pool.on("acquire", (connection) => {
      console.log("🔋 Conexión adquirida");
    });

    this.pool.on("release", () => {
      console.log("♻️ Conexión liberada");
    });

    this.pool.on("error", (err) => {
      console.error("⚠️ Error en el pool:", err);
      if (err.code === "PROTOCOL_CONNECTION_LOST") {
        console.log("🔁 Reconectando...");
        this.pool = mysql.createPool(poolConfig);
      }
    });
  }

  async testConnection() {
    try {
      const [result] = await this.pool
        .promise()
        .query("SELECT 1 + 1 AS result");
      console.log("✅ Conexión a DB exitosa");
      return result;
    } catch (error) {
      console.error("❌ Error de conexión:", error);
      process.exit(1);
    }
  }

  getConnection() {
    return this.pool.promise();
  }
}

const database = new Database();
export default database.getConnection();

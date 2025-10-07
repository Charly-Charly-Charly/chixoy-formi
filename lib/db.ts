import mysql, { Connection } from "mysql2/promise";

/**
 * Establece una conexión a la base de datos MySQL.
 * Llama a las variables de entorno inyectadas por Next.js (desde .env.local o el host).
 */
export async function connectDB(): Promise<Connection> {
  // Desestructuramos y lanzamos un error claro si falta alguna variable.
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;

  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_DATABASE) {
    throw new Error(
      "❌ Error de configuración: Faltan variables de conexión a la base de datos. Asegúrate de que estén definidas en .env.local o en la configuración de entorno de tu host."
    );
  }

  // Next.js garantiza que estas variables se acceden solo en el lado del servidor.
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
  });

  return connection;
}

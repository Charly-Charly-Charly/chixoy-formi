
import mysql from 'mysql2/promise';

export async function connectDB() {
  const connection = await mysql.createConnection({
    host: '193.203.166.162',
    user: 'u798549879_admin_dc', // Reemplaza con tu usuario
    password: 'admin_DC2023', // Reemplaza con tu contraseña
    database: 'u798549879_dash_chixoy', // Reemplaza con el nombre de tu base de datos
  });
  return connection;
}
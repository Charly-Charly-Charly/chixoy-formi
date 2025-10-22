import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, nombre } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear conexión usando variables de entorno
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    // Insertar nuevo usuario
    await connection.execute(
      "INSERT INTO usuarios (username, password, nombre) VALUES (?, ?, ?)",
      [username, hashedPassword, nombre || null]
    );

    await connection.end();

    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        data: { username, nombre: nombre || "" },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

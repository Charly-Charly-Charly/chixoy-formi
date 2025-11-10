import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/jwt";
import mysql from "mysql2/promise";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token");

    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token.value);
    if (!payload) {
      return NextResponse.json(
        { message: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    const { username, password, nombre, institucionId } = await request.json();

    if (!username || !password || !institucionId) {
      return NextResponse.json(
        { message: "Usuario, contraseña e institución son requeridos" },
        { status: 400 }
      );
    }

    // Generar hash seguro
    const hashedPassword = await bcrypt.hash(password, 10);

    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    // Insertar nuevo usuario en la base de datos
    const query = `
      INSERT INTO usuarios (username, password, nombre, institucionId)
      VALUES (?, ?, ?, ?)
    `;
    const values = [
      username,
      hashedPassword,
      nombre || username,
      institucionId,
    ];

    await connection.execute(query, values);
    await connection.end();

    // Devolver también el SQL de ejemplo (como tu UI espera)
    const sqlQuery = `INSERT INTO usuarios (username, password, nombre, institucionId) VALUES ('${username}', '${hashedPassword}', '${
      nombre || username
    }', ${institucionId});`;

    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        data: {
          username,
          nombre: nombre || username,
          hashedPassword,
          sqlQuery,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando usuario:", error);
    return NextResponse.json(
      { message: "Error al crear usuario" },
      { status: 500 }
    );
  }
}

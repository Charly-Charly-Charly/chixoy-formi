import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import mysql from "mysql2/promise";

export async function GET(request: NextRequest) {
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

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    const [rows] = await connection.execute(
      "SELECT id, username, nombre, institucionId, created_at FROM usuarios ORDER BY created_at DESC"
    );

    await connection.end();

    // IMPORTANTE: devolver como `data` para que el frontend lo reciba correctamente
    return NextResponse.json(
      {
        message: "Usuarios obtenidos exitosamente",
        data: rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return NextResponse.json(
      { message: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

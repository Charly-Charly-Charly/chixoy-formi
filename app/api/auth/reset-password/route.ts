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

    const { userId, username, newPassword } = await request.json();

    if (!username || !newPassword) {
      return NextResponse.json(
        { message: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Generar hash seguro
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    // Buscar si el usuario existe
    const [userRows]: any = await connection.execute(
      "SELECT id FROM usuarios WHERE username = ?",
      [username]
    );

    if (userRows.length === 0) {
      await connection.end();
      return NextResponse.json(
        { message: "El usuario no existe" },
        { status: 404 }
      );
    }

    // Actualizar contraseña
    await connection.execute(
      "UPDATE usuarios SET password = ? WHERE username = ?",
      [hashedPassword, username]
    );

    await connection.end();

    const sqlQuery = `UPDATE usuarios SET password = '${hashedPassword}' WHERE username = '${username}';`;

    return NextResponse.json(
      {
        message: "Contraseña reiniciada exitosamente",
        data: {
          username,
          sqlQuery,
          newPassword, // opcional, por si necesitas mostrar la nueva contraseña generada
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error reiniciando contraseña:", error);
    return NextResponse.json(
      { message: "Error al reiniciar contraseña" },
      { status: 500 }
    );
  }
}

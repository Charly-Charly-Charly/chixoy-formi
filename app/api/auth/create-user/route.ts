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

    const { username, password, nombre, institucionId, rol } =
      await request.json();

    if (!username || !password || !institucionId) {
      return NextResponse.json(
        { message: "Usuario, contraseña e institución son requeridos" },
        { status: 400 }
      );
    }

    // Generar hash de la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    const emailTemplate = `
${nombre}


Reciba un cordial saludo en nombre de la Comisión Presidencial Por la Paz y los Derechos Humanos.

Por medio de este correo, cumplimos con la entrega de las credenciales de acceso para el Sistema de Seguimiento y Monitoreo de la "Política Pública de Reparación a las Comunidades Afectadas por la Construcción de la Hidroeléctrica Chixoy, cuyos Derechos Humanos fueron Vulnerados", correspondiente al periodo 2015-2025.

Este sistema es fundamental para garantizar la transparencia, el seguimiento y la rendición de cuentas en la implementación de las acciones definidas en la Política.

🔐 Información de Acceso:


URL del Sistema | ssc.copadeh.gob.gt
Usuario : ${username}
Contraseña : ${password}

📌 Soporte y Consultas

Estamos a su disposición para brindarle cualquier tipo de asistencia técnica o información que necesite.

Si requiere cualquier información adicional, soporte técnico, o tiene consultas específicas sobre el funcionamiento del sistema o la información contenida, por favor, no dude en contactarme directamente.

Atentamente,
Comisión Presidencial Por la Paz y los Derechos Humanos`;

    // Insertar nuevo usuario
    const query = `
      INSERT INTO usuarios (username, password, nombre, institucionId, rol)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [
      username,
      hashedPassword,
      nombre || username,
      institucionId,
      rol || "usuario",
    ];

    await connection.execute(query, values);
    await connection.end();

    // Query SQL solo de muestra
    const sqlQuery = `INSERT INTO usuarios (username, password, nombre, institucionId, rol) VALUES ('${username}', '${hashedPassword}', '${
      nombre || username
    }', ${institucionId}, '${rol || "usuario"}');`;

    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        data: {
          username,
          nombre: nombre || username,
          hashedPassword,
          emailTemplate,
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

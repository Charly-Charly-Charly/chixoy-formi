import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

// -------------------------------------------------------------
// FUNCIÓN GET: Obtiene los años registrados para un proyecto específico
// -------------------------------------------------------------

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const proyectoId = searchParams.get("proyectoId");

    // 1. Validar la existencia del parámetro
    if (!proyectoId) {
      return NextResponse.json(
        { message: "Falta el parámetro proyectoId" },
        { status: 400 }
      );
    }

    // 2. Conectar a la base de datos
    const connection = await mysql.createConnection(dbConfig);

    // 3. Consulta SELECT: Obtiene todos los valores distintos de 'anio'
    //    de la tabla 'Reportes' donde 'proyectoId' coincide.
    const query = `
      SELECT DISTINCT anio
      FROM Reportes
      WHERE proyectoId = ?
    `;

    const [rows] = await connection.execute(query, [proyectoId]);
    connection.end();

    // 4. Mapear los resultados a un array simple de números (años)
    const anios = (rows as { anio: number }[]).map((row) => row.anio);

    return NextResponse.json(anios, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los años registrados:", error);
    return NextResponse.json(
      {
        message: "Error interno del servidor al obtener los años.",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------
// FUNCIÓN POST: Crea un nuevo reporte
// -------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const {
      proyectoId,
      cumplimiento,
      porcentaje_acciones_realizadas,
      aclaraciones,
      poa,
      pei,
      pom,
      justificacion,
      poaLink,
      peiLink,
      pomLink,
      finiquitoLink,
      anio,
    } = await req.json();

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Crear los valores numéricos (0 o 1) para la BD
    const poaValue = poa ? 1 : 0;
    const peiValue = pei ? 1 : 0;
    const pomValue = pom ? 1 : 0;

    // Conectar a la base de datos
    const connection = await mysql.createConnection(dbConfig);

    const query = `
      INSERT INTO Reportes 
      (proyectoId, cumplimiento, porcentaje_acciones_realizadas, aclaraciones, justificacion, poa, pei, pom, poaLink, peiLink, pomLink, finiquitoLink, anio, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      proyectoId,
      cumplimiento,
      porcentaje_acciones_realizadas,
      aclaraciones,
      justificacion,
      poaValue,
      peiValue,
      pomValue,
      poaLink,
      peiLink,
      pomLink,
      finiquitoLink,
      anio,
      ip,
      userAgent,
    ];

    await connection.execute(query, values);
    connection.end();

    return NextResponse.json(
      { message: "Reporte creado exitosamente" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear el reporte:", error);
    return NextResponse.json(
      {
        message: "Error interno del servidor.",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

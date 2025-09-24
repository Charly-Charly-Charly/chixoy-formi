import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";

export async function GET() {
  let connection;
  try {
    connection = await connectDB();
    const [rows] = await connection.execute(
      `SELECT
        p.nombre AS proyecto,
        p.cod,
        i.nombre AS institucion,
        p.medida,
        p.eje,
        r.cumplimiento,
        r.poa,
        r.pei,
        r.pom,
        p.meta,
        r.porcentaje_acciones_realizadas,
        r.finiquito_path,
        r.aclaraciones,  -- Agregado aquí
        r.justificacion  -- Agregado aquí
      FROM Reportes r
      JOIN Proyectos p ON r.proyectoId = p.id
      JOIN Instituciones i ON p.institucionId = i.id
      ORDER BY r.createdAt DESC`
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.end();
  }
}

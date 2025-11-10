import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const proyectoId = searchParams.get("proyectoId"); // Obtener parámetro

  let connection;
  try {
    connection = await connectDB();

    let query = `
      SELECT
        p.nombre AS proyecto,
        p.cod,
        i.nombre AS institucion,
        p.medida,
        p.eje,
        r.cumplimiento,
        r.poa,
        r.pei,
        r.pom,
        r.peiLink,
        r.poaLink,
        r.pomLink,
        r.anio,
        p.meta,
        r.porcentaje_acciones_realizadas,
        r.finiquitoLink,
        r.aclaraciones,
        r.justificacion,
        u.nombre AS usuario
      FROM Reportes r
      JOIN Proyectos p ON r.proyectoId = p.id
      JOIN Instituciones i ON p.institucionId = i.id
      LEFT JOIN usuarios u ON r.usuarioId = u.id
    `;

    const params: any[] = [];

    if (proyectoId) {
      query += " WHERE r.proyectoId = ?";
      params.push(proyectoId);
    }

    query += " ORDER BY r.createdAt DESC";

    const [rows] = await connection.execute(query, params);

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

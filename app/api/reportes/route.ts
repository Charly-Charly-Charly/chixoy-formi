// app/api/reportes/route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "193.203.166.162",
  user: "u798549879_admin_dc",
  password: "admin_DC2023",
  database: "u798549879_dash_chixoy",
};

export async function POST(req: Request) {
  try {
    const {
      proyectoId,
      cumplimiento,
      porcentaje_acciones_realizadas,
      aclaraciones,
      // ✅ CORREGIDO: Extraer poa, pei y pom
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

    // 1. ✅ CORREGIDO: Crear los valores numéricos (0 o 1) para la BD
    const poaValue = poa ? 1 : 0;
    const peiValue = pei ? 1 : 0;
    const pomValue = pom ? 1 : 0;

    // Conectar a la base de datos
    const connection = await mysql.createConnection(dbConfig);

    // 2. Consulta INSERT (Se mantiene, está correcta y tiene 12 columnas)
    const query = `
      INSERT INTO Reportes 
      (proyectoId, cumplimiento, porcentaje_acciones_realizadas, aclaraciones, justificacion, poa, pei, pom, poaLink, peiLink, pomLink, finiquitoLink, anio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;

    // 3. ✅ CORREGIDO: Los valores deben COINCIDIR en número (12) y orden con la consulta.
    const values = [
      proyectoId,
      cumplimiento,
      porcentaje_acciones_realizadas,
      aclaraciones,
      justificacion,
      poaValue, // 👈 USAR poaValue
      peiValue, // 👈 USAR peiValue
      pomValue, // 👈 USAR pomValue
      poaLink,
      peiLink,
      pomLink,
      finiquitoLink,
      anio,
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

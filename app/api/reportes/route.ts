// app/api/reportes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";

export async function POST(req: NextRequest) {
  let connection;
  try {
    const {
      proyectoId,
      cumplimiento,
      poa,
      pei,
      pom,
      finiquito_path,
      aclaraciones,
      justificacion,
    } = await req.json();

    if (
      !proyectoId ||
      cumplimiento === undefined ||
      aclaraciones === undefined
    ) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: proyectoId, cumplimiento, or aclaraciones",
        },
        { status: 400 }
      );
    }

    // Validación condicional para la justificación
    if (cumplimiento === 0 && !justificacion) {
      return NextResponse.json(
        { message: "Justification is required when compliance is 0" },
        { status: 400 }
      );
    }

    connection = await connectDB();

    // Obtener la meta del proyecto para calcular el porcentaje
    const [proyectoRows]: any = await connection.execute(
      `SELECT meta FROM Proyectos WHERE id = ?`,
      [proyectoId]
    );
    const meta = proyectoRows[0]?.meta;

    if (meta === null || meta === undefined) {
      return NextResponse.json(
        { message: "Meta for the project not found" },
        { status: 404 }
      );
    }

    // Calcular el porcentaje: (cumplimiento / meta) * 100
    const porcentaje_acciones_realizadas = (cumplimiento / meta) * 100;

    const poaValue = poa ? 1 : 0;
    const peiValue = pei ? 1 : 0;
    const pomValue = pom ? 1 : 0;

    await connection.execute(
      `INSERT INTO Reportes (proyectoId, cumplimiento, poa, pei, pom, porcentaje_acciones_realizadas, finiquito_path, aclaraciones, justificacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        proyectoId,
        cumplimiento,
        poaValue,
        peiValue,
        pomValue,
        porcentaje_acciones_realizadas,
        finiquito_path,
        aclaraciones,
        justificacion,
      ]
    );

    return NextResponse.json(
      { message: "Report created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.end();
  }
}

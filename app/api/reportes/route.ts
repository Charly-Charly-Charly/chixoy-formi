// app/api/reportes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';

export async function POST(req: NextRequest) {
  let connection;
  try {
    const { proyectoId, cumplimiento, poa, pei, pom, porcentaje_acciones_realizadas, finiquito_path } = await req.json();

    if (!proyectoId || cumplimiento === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    connection = await connectDB();
    
    // Convertimos los booleanos a 1 o 0 para MySQL
    const poaValue = poa ? 1 : 0;
    const peiValue = pei ? 1 : 0;
    const pomValue = pom ? 1 : 0;
    const cumplimientoValue = cumplimiento ? 1 : 0;

    await connection.execute(
      `INSERT INTO Reportes (proyectoId, cumplimiento, poa, pei, pom, porcentaje_acciones_realizadas, finiquito_path)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [proyectoId, cumplimientoValue, poaValue, peiValue, pomValue, porcentaje_acciones_realizadas, finiquito_path]
    );

    return NextResponse.json({ message: 'Report created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    if (connection) connection.end();
  }
}
// app/api/proyectos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const institucionId = searchParams.get('institucionId');

  if (!institucionId) {
    return NextResponse.json({ message: 'Missing institucionId' }, { status: 400 });
  }

  let connection;
  try {
    connection = await connectDB();
    const [rows] = await connection.execute(
      'SELECT * FROM Proyectos WHERE institucionId = ?',
      [institucionId]
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching proyectos:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    if (connection) connection.end();
  }
}
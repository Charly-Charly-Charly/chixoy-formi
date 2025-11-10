// app/api/instituciones/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";

export async function GET() {
  let connection;
  try {
    connection = await connectDB();
    const [rows] = await connection.execute("SELECT * FROM Instituciones");
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching instituciones:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.end();
  }
}

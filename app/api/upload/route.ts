// app/api/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { IncomingForm, Files } from "formidable";
import fs from "fs";
import path from "path";

// Deshabilita el body-parser de Next.js para manejar la subida de archivos
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const form = new IncomingForm({
    uploadDir: path.join(process.cwd(), "public", "uploads"), // Carpeta donde se guardarán los archivos
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // Limite de 5 MB
  });

  // Asegura que la carpeta de subidas exista
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // return new Promise((resolve, reject) => {
  //   form.parse(req, async (err: any, fields: any, files: Files) => {
  //     if (err) {
  //       console.error('Error parsing form data:', err);
  //       return resolve(NextResponse.json({ message: 'Error uploading file' }, { status: 500 }));
  //     }

  //     const finiquitoFile = files.finiquito?.[0];
  //     if (!finiquitoFile) {
  //       return resolve(NextResponse.json({ message: 'No file uploaded' }, { status: 400 }));
  //     }

  //     // La ruta relativa que se guardará en la base de datos
  //     const filePath = `/uploads/${path.basename(finiquitoFile.filepath)}`;

  //     resolve(NextResponse.json({ message: 'File uploaded successfully', filePath }, { status: 200 }));
  //   });
  // });
}

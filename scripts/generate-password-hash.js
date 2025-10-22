// Script para generar hash de contraseñas
// Ejecuta este script con: node scripts/generate-password-hash.js

import crypto from "crypto";

function hashPassword(password) {
  // Usando SHA-256 como alternativa simple a bcrypt
  // En producción, usa bcrypt para mayor seguridad
  const hash = crypto.createHash("sha256").update(password).digest("hex");
  return hash;
}

// Genera hash para la contraseña 'admin123'
const password = "admin123";
const hash = hashPassword(password);

console.log("=".repeat(50));
console.log("GENERADOR DE HASH DE CONTRASEÑA");
console.log("=".repeat(50));
console.log(`\nContraseña: ${password}`);
console.log(`Hash SHA-256: ${hash}`);
console.log("\nPara usar en MySQL:");
console.log(
  `UPDATE usuarios SET password = '${hash}' WHERE username = 'admin';`
);
console.log("\n" + "=".repeat(50));

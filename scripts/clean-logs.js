import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

function cleanLogs() {
  console.log("🧹 Iniciando limpieza de logs y archivos temporales...");

  try {
    const files = fs.readdirSync(projectRoot);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(projectRoot, file);
      const isLogFile = file.endsWith(".log") || file.endsWith(".err") || file.endsWith(".out");
      const isTempViteFile = file.startsWith("tmp-vite-dev");

      if (isLogFile || isTempViteFile) {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          fs.unlinkSync(filePath);
          console.log(`  - Eliminado: ${file}`);
          deletedCount++;
        }
      }
    }

    console.log(`✨ Limpieza completada. Se eliminaron ${deletedCount} archivos temporales.`);
  } catch (error) {
    console.error("❌ Error durante la limpieza de logs:", error);
    process.exit(1);
  }
}

cleanLogs();

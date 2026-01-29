/**
 * Plugin Vite per risolvere gli import da @noble/hashes
 * Workaround per problemi di risoluzione con Vite 7+
 */
export default function nobleHashesPlugin() {
  return {
    name: "noble-hashes-resolver",
    enforce: "pre",
    resolveId(id) {
      // Risolvi import da @noble/hashes aggiungendo estensione se necessario
      if (id.startsWith("@noble/hashes/")) {
        // Se non ha già .js, aggiungilo
        if (!id.endsWith(".js")) {
          return {
            id: `${id}.js`,
            external: false,
          };
        }
      }
      return null;
    },
  };
}

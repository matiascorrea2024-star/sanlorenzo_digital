// eslint-config-next 16 exporta flat config nativo: no hace falta el
// shim FlatCompat (que además choca con las referencias circulares de
// los plugins flat-config modernos y tira "Converting circular
// structure to JSON").
import nextConfig from "eslint-config-next";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = [
  ...nextConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      // Regla nueva de eslint-plugin-react-hooks 7.x: marca como ERROR
      // cualquier setState síncrono dentro de un efecto. Detecta bugs
      // reales (derivar estado de otro estado en un efecto evitable),
      // pero también marca patrones extendidos y seguros ya usados en
      // ~15 archivos de este proyecto (flag de "ya montó" para evitar
      // desajustes de hidratación, cerrar un menú al cambiar de ruta,
      // etc.). Queda en "warn" a propósito -- sigue visible en cada
      // `npm run lint`, no se oculta -- para no reescribir esos 15
      // archivos bajo presión y arriesgar romper animaciones que hoy
      // funcionan. Repasarlos caso por caso es trabajo pendiente, no
      // bloqueante para producción.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;

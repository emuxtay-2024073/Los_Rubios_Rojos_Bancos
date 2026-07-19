// client-bank/metro.config.cjs

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Fix: algunos paquetes (ESM-only) exponen una variante que usa
// `import.meta.env`, y Metro a veces resuelve esa condición para web
// en vez de la versión CommonJS/require. El navegador no puede ejecutar
// esa sintaxis sin <script type="module">, lo que rompe el export web
// con "Uncaught SyntaxError: Cannot use 'import.meta' outside a module".
// Forzamos a Metro a priorizar require/react-native sobre exports ESM.
config.resolver.unstable_conditionNames = [
  "browser",
  "require",
  "react-native",
];

module.exports = config;

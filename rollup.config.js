// import { defineConfig } from "rollup";
// import typescript from "@rollup/plugin-typescript";

// export default defineConfig({
//   input: "./src/index.ts",
//   output: {
//     dir: "./dist",
//     format: "esm",
//     sourcemap: true,
//   },
//   plugins: [typescript({ tsconfig: "./tsconfig.json" })],
//   external: ["path", "fs", "fs/promises", "util"],
// });

const { defineConfig } = require("rollup");
const typescript = require("@rollup/plugin-typescript");
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");

module.exports = {
  input: "./src/index.ts",
  output: {
    dir: "./dist",
    format: "cjs",
    sourcemap: true,
  },
  plugins: [
    typescript({ tsconfig: "./tsconfig.json", outDir: "./dist" }),
    resolve({ jsnext: true, main: true }),
    commonjs(),
  ],
  external: ["path", "fs", "fs/promises", "util", "xmldom"],
};

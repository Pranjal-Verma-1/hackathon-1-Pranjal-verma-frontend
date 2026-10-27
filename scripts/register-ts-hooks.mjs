import { registerHooks } from "node:module";
import { extname } from "node:path";

registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL ?? "";
    const projectSource = parent.includes("/src/") && !parent.includes("/node_modules/");
    if (projectSource && (specifier.startsWith("./") || specifier.startsWith("../")) && extname(specifier) === "") {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

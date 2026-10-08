import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const source = ts.createSourceFile(
  "layout-client.tsx",
  readFileSync(new URL("../../app/layout-client.tsx", import.meta.url), "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

describe("browser-only wallet boundary", () => {
  it.each(["WalletRuntime", "AccountWidget"])("never prerenders %s before AppKit is initialized", (component) => {
    const declarations = source.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => [...statement.declarationList.declarations]);
    const declaration = declarations.find((entry) => ts.isIdentifier(entry.name) && entry.name.text === component);
    const initializer = declaration?.initializer;
    expect(initializer && ts.isCallExpression(initializer)).toBe(true);
    if (!initializer || !ts.isCallExpression(initializer)) throw new Error("Missing dynamic wallet boundary");
    expect(initializer.expression.getText(source)).toBe("dynamic");
    const options = initializer.arguments[1];
    expect(options && ts.isObjectLiteralExpression(options)).toBe(true);
    if (!options || !ts.isObjectLiteralExpression(options)) throw new Error("Missing wallet SSR options");
    const ssr = options.properties.find((property) => ts.isPropertyAssignment(property) && property.name.getText(source) === "ssr");
    expect(ssr && ts.isPropertyAssignment(ssr) && ssr.initializer.kind === ts.SyntaxKind.FalseKeyword).toBe(true);
  });
});
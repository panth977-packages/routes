import { z } from "zod";
import type { OpenAPIObject } from "../zod-openapi.ts";
export const zOpenAPIObject = z.custom<OpenAPIObject>(
  (data) => data as OpenAPIObject,
);
const methods = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;
export type Method = (typeof methods)[number];

export type DefaultOptions = {
  routesCreated: Record<string, string>;
  dependencyCreated: Record<string, string>;
  code: string;
  createSchemaFor?: "*" | string[] | undefined;
  createRoutesFor?: "*" | Set<string> | {
    method:
      | "get"
      | "put"
      | "post"
      | "delete"
      | "options"
      | "head"
      | "patch"
      | "trace";
    path: string;
  }[] | undefined;
};

export function getAllSchemas(json: OpenAPIObject, options: DefaultOptions) {
  const schemas = [];
  const createSchemaFor = options.createSchemaFor;
  const selection = createSchemaFor === undefined
    ? []
    : createSchemaFor === "*"
    ? Object.keys(json.components?.schemas ?? {})
    : createSchemaFor;
  for (const name of selection) {
    schemas.push({
      name: `#/components/schemas/${name}`,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      schema: json.components!.schemas![name]!,
    });
  }
  return schemas;
}

export function getAllRoutes(json: OpenAPIObject, options: DefaultOptions) {
  const routes = [];
  const createRoutesFor = options.createRoutesFor;
  const paths = json.paths ?? {};
  const selection = createRoutesFor === undefined
    ? []
    : createRoutesFor === "*"
    ? Object.keys(paths)
      .map((path) => methods.map((method) => ({ path, method })))
      .flat()
      .filter(({ path, method }) => paths[path][method]?.operationId)
    : createRoutesFor instanceof Set
    ? Object.keys(paths)
      .map((path) => methods.map((method) => ({ path, method })))
      .flat()
      .filter(({ path, method }) =>
        createRoutesFor.has(paths[path][method]?.operationId as never)
      )
    : createRoutesFor;
  for (const { method, path } of selection) {
    routes.push({
      method,
      path,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      schema: json.paths![path]![method]!,
    });
  }
  return routes;
}

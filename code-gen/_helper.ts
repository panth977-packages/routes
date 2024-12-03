import { z } from "zod";
import type { OpenAPIObject } from "../zod-openapi.ts";
import type { FUNCTIONS } from "@panth977/functions";
export const zOpenAPIObject = z.custom<OpenAPIObject>(
  (data) => data as OpenAPIObject
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
export const defaultOptionsSchema: z.ZodObject<{
  routesCreated: z.ZodDefault<
    z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>
  >;
  dependencyCreated: z.ZodDefault<
    z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>
  >;
  code: z.ZodDefault<z.ZodString>;
  createSchemaFor: z.ZodOptional<
    z.ZodUnion<[z.ZodLiteral<"*">, z.ZodArray<z.ZodString, "many">]>
  >;
  createRoutesFor: z.ZodOptional<
    z.ZodUnion<
      [
        z.ZodLiteral<"*">,
        z.ZodEffects<z.ZodArray<z.ZodString, "many">, Set<string>, string[]>,
        z.ZodArray<
          z.ZodObject<{
            method: z.ZodEnum<
              [
                "get",
                "put",
                "post",
                "delete",
                "options",
                "head",
                "patch",
                "trace"
              ]
            >;
            path: z.ZodString;
          }>,
          "many"
        >
      ]
    >
  >;
}> = z.object({
  routesCreated: z
    .record(z.string())
    .optional()
    .default(() => ({})),
  dependencyCreated: z
    .record(z.string())
    .optional()
    .default(() => ({})),
  code: z.string().default(() => ""),
  //
  createSchemaFor: z.union([z.literal("*"), z.string().array()]).optional(),
  createRoutesFor: z
    .union([
      z.literal("*"),
      z
        .string()
        .array()
        .transform((x) => new Set(x)),
      z.object({ method: z.enum(methods), path: z.string() }).array(),
    ])
    .optional(),
});
type Options = z.infer<typeof defaultOptionsSchema>;

export function getAllSchemas(json: OpenAPIObject, options: Options) {
  const schemas = [];
  const createSchemaFor = options.createSchemaFor;
  const selection =
    createSchemaFor === undefined
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

export function getAllRoutes(json: OpenAPIObject, options: Options) {
  const routes = [];
  const createRoutesFor = options.createRoutesFor;
  const paths = json.paths ?? {};
  const selection =
    createRoutesFor === undefined
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

export type GenCodeFn<O extends z.AnyZodObject> = FUNCTIONS.SyncFunction.Build<
  z.ZodObject<{ json: z.ZodType<OpenAPIObject>; options: O }>,
  z.ZodObject<Omit<O["shape"], "createRoutesFor" | "createSchemaFor">>,
  any,
  any,
  any
>;

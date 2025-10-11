import { createDocument, type ZodOpenApiObject } from "zod-openapi";
import {
  FuncHttp,
  type FuncHttpExported,
  FuncSse,
  type FuncSseExported,
  type HttpInput,
  type HttpOutput,
  type HttpTypes,
  type SseInput,
  type SseOutput,
  type SseTypes,
} from "./endpoint/index.ts";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import z from "zod";
import type { ZodOpenApiResponseObject } from "zod-openapi";

type Exists<T> = Exclude<T, undefined>;
export type SecuritySchemeObject = Exclude<
  Exists<Exists<ZodOpenApiObject["components"]>["securitySchemes"]>[string],
  { $ref: string }
>;
export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options"
  | "head"
  | "trace";
export type EndpointBuild =
  | FuncHttpExported<HttpInput, HttpOutput, HttpTypes>
  | FuncSseExported<SseInput, SseOutput, SseTypes>;
export type OpenAPIObject = ReturnType<typeof createDocument>;
export type PathItemObject = Exists<OpenAPIObject["paths"]>[string];
export type Methods = Exclude<
  keyof PathItemObject,
  "$ref" | `x-${string}` | "servers" | "parameters" | "summary" | "description"
>;
export type OperationObject = Exists<PathItemObject[Methods]>;

export type ComponentsObject = Exists<OpenAPIObject["components"]>;
export type SchemaObject = Exclude<
  Exists<ComponentsObject["schemas"]>[string],
  { $ref: string }
>;
export type ReferenceObject = Exclude<
  Exists<ComponentsObject["schemas"]>[string],
  SchemaObject
>;

/**
 * Document your routes by simply passing your endpoint bundle, and get a open-api.json
 * @param docEndpoints
 * @param params
 * @returns
 *
 * @example
 * ```ts
 * const routes = R.getEndpointsFromBundle({
 *   bundle: await import('./routes/index.ts'),
 *   excludeTags: ['internal-apis'],
 * }); // strong type will be lost
 * const OpenApiJson = ROUTES.getRouteDocJson(routes, {
 *   info: {
 *     title: 'My Apis',
 *     version: '0.0.1',
 *   }
 * });
 * ```
 */
export function getRouteDocJson(
  docEndpoints: Record<string, EndpointBuild>,
  params: Pick<
    ZodOpenApiObject,
    "info" | "tags" | "servers" | "security" | "externalDocs" | "components"
  >,
): OpenAPIObject {
  const paths: ZodOpenApiPathsObject = {};
  const securityData = Object.assign(
    {},
    params.components?.securitySchemes ?? {},
  );
  for (
    const build of Object.values(docEndpoints).sort((x, y) =>
      x.node.docsOrder - y.node.docsOrder
    )
  ) {
    const middlewares = build.node.middlewares;
    const security = [
      ...middlewares.map((m) => m.node.security ?? {}),
      build.node.security ?? {},
    ];
    Object.assign(securityData, ...security);
    let obj: ZodOpenApiOperationObject;
    if (build.node instanceof FuncHttp) {
      obj = {
        operationId: build.node.ref.name,
        tags: middlewares.reduce(
          (tags, m) => [...tags, ...(m.node.tags ?? [])],
          [...(build.node.tags ?? [])],
        ),
        security: security.map((security) =>
          Object.fromEntries(Object.keys(security).map((x) => [x, []]))
        ),
        description: build.node.description,
        summary: build.node.summary,
        requestParams: {
          header: z.object(
            middlewares.reduce(
              (shape, middleware) =>
                Object.assign(
                  shape,
                  middleware.node.reqHeaders instanceof z.ZodObject
                    ? middleware.node.reqHeaders.shape
                    : {},
                ),
              {
                ...(build.node.reqHeaders instanceof z.ZodObject
                  ? build.node.reqHeaders.shape
                  : {}),
              },
            ),
          ),
          query: z.object(
            middlewares.reduce(
              (shape, middleware) =>
                Object.assign(
                  shape,
                  middleware.node.reqQuery instanceof z.ZodObject
                    ? middleware.node.reqQuery.shape
                    : {},
                ),
              {
                ...(build.node.reqQuery instanceof z.ZodObject
                  ? build.node.reqQuery.shape
                  : {}),
              },
            ),
          ),
          path: z.object({
            ...(build.node.reqPath instanceof z.ZodObject
              ? build.node.reqPath.shape
              : {}),
          }),
        },
        requestBody: {
          content: {
            [build.node.reqMediaTypes ?? "application/json"]: {
              schema: build.node.reqBody,
            },
          },
        },
        responses: {
          default: {
            content: {
              [build.node.resMediaTypes ?? "application/json"]: {
                schema: build.node.resBody,
              },
            },
            headers: z.object(
              middlewares.reduce(
                (shape, middleware) =>
                  Object.assign(
                    shape,
                    middleware.node.resHeaders instanceof z.ZodObject
                      ? middleware.node.resHeaders.shape
                      : {},
                  ),
                {
                  ...(build.node.resHeaders instanceof z.ZodObject
                    ? build.node.resHeaders.shape
                    : {}),
                },
              ),
            ),
          } as ZodOpenApiResponseObject,
        },
      };
    } else if (build.node instanceof FuncSse) {
      obj = {
        operationId: build.node.ref.name,
        tags: middlewares.reduce(
          (tags, m) => tags.concat(m.node.tags ?? []),
          [...(build.node.tags ?? [])],
        ),
        security: security.map((security) =>
          Object.fromEntries(Object.keys(security).map((x) => [x, []]))
        ),
        description: build.node.description,
        summary: build.node.summary,
        requestParams: {
          header: z.object(
            middlewares.reduce(
              (shape, middleware) =>
                Object.assign(
                  shape,
                  middleware.node.reqHeaders instanceof z.ZodObject
                    ? middleware.node.reqHeaders.shape
                    : {},
                ),
              {},
            ),
          ),
          query: z.object(
            middlewares.reduce(
              (shape, middleware) =>
                Object.assign(
                  shape,
                  middleware.node.reqQuery instanceof z.ZodObject
                    ? middleware.node.reqQuery.shape
                    : {},
                ),
              {
                ...(build.node.reqQuery instanceof z.ZodObject
                  ? build.node.reqQuery.shape
                  : {}),
              },
            ),
          ),
          path: z.object({
            ...(build.node.reqPath instanceof z.ZodObject
              ? build.node.reqPath.shape
              : {}),
          }),
        },
        responses: {
          default: {
            description: "Server side event!",
            content: {
              "text/event-stream": {
                schema: z.string(),
              },
            },
            headers: z.object({
              "Content-Type": z.literal("text/event-stream"),
            }),
          },
        },
      };
    } else {
      throw new Error("Unimplemented");
    }
    for (const path of build.node.paths) {
      paths[path] ??= {};
      for (const method of build.node.methods) {
        if (paths[path][method]) {
          throw new Error(`[${[path, method]}] Found duplicate.`);
        }
        paths[path][method] = obj;
      }
    }
  }
  (params.components ??= {}).securitySchemes = securityData;
  return createDocument({ ...params, paths: paths, openapi: "3.1.0" });
}

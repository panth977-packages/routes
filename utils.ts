import type * as Sse from "./sse.ts";
import type * as Http from "./http.ts";
import type * as Middleware from "./middleware.ts";
import {
  createDocument,
  type ZodOpenApiObject,
  type ZodOpenApiPathsObject,
  type ZodOpenApiResponsesObject,
} from "zod-openapi";
import type { OpenAPIObject } from "./zod-openapi.ts";
import { z } from "zod";
import { FUNCTIONS } from "@panth977/functions";

/**
 * use this bundler to convert strongly typed Record<key, endpoint> to loosely.
 * @param bundle all the endpoints should be the value of given object
 * @param options filters based on tags applied on endpoint
 * @returns
 *
 * @example
 * ```ts
 * // --- routes/m.ts ---
 * export const myMiddleware = ROUTES.Middleware.build(...);
 * // --- routes/a.ts ---
 * export const myVariable1 = ...;
 * export const route1 = ROUTES.Http.build(...);
 * export const route2 = ROUTES.Http.build(...);
 * // --- routes/b.ts ---
 * export function myFunction(...) {...}
 * export const route3 = ROUTES.Http.build(...);
 * export const route4 = ROUTES.Sse.build(...);
 * // --- routes/index.ts ---
 * export * from './m.ts';
 * export * from './a.ts';
 * export * from './b.ts';
 * // --- server.ts ---
 * import * as routes_ from './routes/index.ts';
 * const routes = ROUTES.getEndpointsFromBundle(routes_); // strong type will be lost
 * console.log(routes) // {route1: ..., route2: ..., route3: ..., route4: ...}
 * ```
 */
export function getEndpointsFromBundle<B extends Record<never, never>>(
  bundle: B,
  options?: { includeTags?: string[]; excludeTags?: string[] }
): Record<string, Http.Build | Sse.Build> {
  const allReady: Record<string, Http.Build | Sse.Build> = {};
  for (const loc in bundle) {
    const build = bundle[loc];
    if (
      typeof build === "function" &&
      "endpoint" in build &&
      build.endpoint === "http"
    ) {
      allReady[loc] = build as unknown as Http.Build;
    }
    if (
      typeof build === "function" &&
      "endpoint" in build &&
      build.endpoint === "sse"
    ) {
      allReady[loc] = build as unknown as Sse.Build;
    }
  }
  if (options?.includeTags) {
    const tags = new Set(options.includeTags);
    loop: for (const loc in allReady) {
      const docTags = allReady[loc].middlewares.reduce(
        (tags, m) => [...tags, ...(m.tags ?? [])],
        [...(allReady[loc].tags ?? [])]
      );
      for (const tag of docTags) {
        if (tags.has(tag)) {
          continue loop;
        }
      }
      delete allReady[loc];
    }
  }
  if (options?.excludeTags) {
    const tags = new Set(options.excludeTags);
    loop: for (const loc in allReady) {
      const docTags = allReady[loc].middlewares.reduce(
        (tags, m) => [...tags, ...(m.tags ?? [])],
        [...(allReady[loc].tags ?? [])]
      );
      for (const tag of docTags) {
        if (tags.has(tag)) {
          delete allReady[loc];
          continue loop;
        }
      }
    }
  }
  return allReady;
}

/**
 * Document your routes by simply passing your endpoint bundle, and get a open-api.json
 * @param docEndpoints
 * @param params
 * @returns
 */
export function getRouteDocJson(
  docEndpoints: Record<string, Http.Build | Sse.Build>,
  params: Pick<
    ZodOpenApiObject,
    "info" | "tags" | "servers" | "security" | "externalDocs" | "components"
  >
): OpenAPIObject {
  const paths: ZodOpenApiPathsObject = {};
  const securityData = Object.assign(
    {},
    params.components?.securitySchemes ?? {}
  );
  for (const build of Object.values(docEndpoints)) {
    const { method, path } = build;
    const middlewares = build.middlewares;
    const security = [
      ...middlewares.map((m) => m.security ?? {}),
      build.security ?? {},
    ];
    Object.assign(securityData, ...security);
    if (build.endpoint === "http") {
      (paths[path] ??= {})[method] = {
        operationId: build.getName(),
        tags: middlewares.reduce(
          (tags, m) => [...tags, ...(m.tags ?? [])],
          [...(build.tags ?? [])]
        ),
        security: security.map((security) =>
          Object.fromEntries(Object.keys(security).map((x) => [x, []]))
        ),
        description: build.description,
        summary: build.summary,
        requestParams: {
          header: z.object(
            middlewares.reduce(
              (shape, middleware) =>
                Object.assign(
                  shape,
                  middleware.input.shape.headers?.shape ?? {}
                ),
              {
                ...(build.input.shape.headers?.shape ?? {}),
              }
            )
          ),
          query: z.object(
            middlewares.reduce(
              (shape, middleware) =>
                Object.assign(shape, middleware.input.shape.query?.shape ?? {}),
              {
                ...(build.input.shape.query?.shape ?? {}),
              }
            )
          ),
          path: z.object({ ...(build.input.shape.path?.shape ?? {}) }),
        },
        requestBody: {
          content: {
            [build.reqMediaTypes ?? "application/json"]: {
              schema: build.input.shape.body,
            },
          },
        },
        responses: {
          default: {
            content: {
              [build.resMediaTypes ?? "application/json"]: {
                schema: build.output.shape.body,
              },
            },
            headers: z.object(
              middlewares.reduce(
                (shape, middleware) =>
                  Object.assign(
                    shape,
                    middleware.output.shape.headers?.shape ?? {}
                  ),
                {
                  ...(build.output.shape.headers?.shape ?? {}),
                }
              )
            ),
          },
        } as ZodOpenApiResponsesObject,
      };
    }
    if (build.endpoint === "sse") {
      (paths[path] ??= {})[method] = {
        operationId: build.getName(),
        tags: middlewares.reduce(
          (tags, m) => tags.concat(m.tags ?? []),
          [...(build.tags ?? [])]
        ),
        security: security.map((security) =>
          Object.fromEntries(Object.keys(security).map((x) => [x, []]))
        ),
        description: build.description,
        summary: build.summary,
        requestParams: {
          header: z.object(
            middlewares.reduce(
              (shape, middleware) =>
                Object.assign(
                  shape,
                  middleware.input.shape.headers?.shape ?? {}
                ),
              {}
            )
          ),
          query: z.object(
            middlewares.reduce(
              (shape, middleware) =>
                Object.assign(shape, middleware.input.shape.query?.shape ?? {}),
              {
                ...(build.input.shape.query?.shape ?? {}),
              }
            )
          ),
          path: z.object({ ...(build.input.shape.path?.shape ?? {}) }),
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
    }
  }
  (params.components ??= {}).securitySchemes = securityData;
  return createDocument({ ...params, paths: paths, openapi: "3.1.0" });
}

/**
 * returns all the dynamic path variables expected
 * @param path
 * @returns
 *
 * @example
 * ```ts
 * ROUTES.pathParser('/health'); // []
 * ROUTES.pathParser('/users/{userId}'); // ['{userId}']
 * ROUTES.pathParser('/users/{userId}/devices/{deviceId}'); // ['{userId}', '{deviceId}']
 * ```
 */
export function pathParser(path: string): string[] {
  return [...(path.match(/{([^}]+)}/g) ?? [])];
}

export type LifeCycle = {
  onStatusChange?(
    status: "start" | "complete",
    context: FUNCTIONS.Context,
    build: Http.Build | Sse.Build
  ): void;

  onExecution?(context: FUNCTIONS.Context, build: Middleware.Build): void;
  onExecution?(context: FUNCTIONS.Context, build: Http.Build): void;
  onExecution?(context: FUNCTIONS.Context, build: Sse.Build): void;

  onResponse?(
    context: FUNCTIONS.Context,
    build: Middleware.Build,
    res: null | z.infer<Middleware.Build["output"]>,
    err: null | unknown
  ): void;
  onResponse?(
    context: FUNCTIONS.Context,
    build: Http.Build,
    res: null | z.infer<Http.Build["output"]>,
    err: null | unknown
  ): void;
  onResponse?(
    context: FUNCTIONS.Context,
    build: Sse.Build,
    res: null | z.infer<Sse.Build["yield"]>,
    err: null | unknown
  ): void;

  onComplete?(context: FUNCTIONS.Context, build: Middleware.Build): void;
  onComplete?(context: FUNCTIONS.Context, build: Http.Build): void;
  onComplete?(context: FUNCTIONS.Context, build: Sse.Build): void;
};

/**
 * To execute your http or sse builds.
 * @param context
 * @param build
 * @param req
 * @param cbs
 * @returns
 */
export async function execute(
  context: FUNCTIONS.Context | string | null,
  build: Http.Build | Sse.Build,
  req: {
    headers?: Record<string, string | string[]>;
    path?: Record<string, string>;
    query?: Record<string, string | string[]>;
    body?: any;
  },
  lc: LifeCycle
): Promise<void> {
  context = FUNCTIONS.DefaultBuildContext(context);
  const options: any[] = [];
  lc.onStatusChange?.("start", context, build);
  try {
    for (const middleware of build.middlewares) {
      lc.onExecution?.(context, middleware);
      try {
        const res = await middleware(context, req);
        options.push(res.options);
        lc.onResponse?.(context, middleware, res, null);
      } catch (err) {
        lc.onResponse?.(context, middleware, null, err);
        return;
      } finally {
        lc.onComplete?.(context, middleware);
      }
    }
    Object.assign(context, { options: Object.assign({}, ...options) });
    if (build.endpoint === "http") {
      lc.onExecution?.(context, build);
      try {
        const res = await build(context, req);
        lc.onResponse?.(context, build, res, null);
      } catch (err) {
        lc.onResponse?.(context, build, null, err);
        return;
      } finally {
        lc.onComplete?.(context, build);
      }
    } else {
      lc.onExecution?.(context, build);
      try {
        for await (const res of build(context, req)) {
          lc.onResponse?.(context, build, res, null);
        }
      } catch (err) {
        lc.onResponse?.(context, build, null, err);
        return;
      } finally {
        lc.onComplete?.(context, build);
      }
    }
  } finally {
    lc.onStatusChange?.("complete", context, build);
  }
}

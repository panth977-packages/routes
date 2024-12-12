import {
  createDocument,
  type ZodOpenApiObject,
  type ZodOpenApiOperationObject,
  type ZodOpenApiPathsObject,
  type ZodOpenApiResponseObject,
} from "zod-openapi";
import type { OpenAPIObject } from "./zod-openapi.ts";
import { z } from "zod";
import type { FUNCTIONS } from "@panth977/functions";
import type { Sse, Http, Middleware } from "./endpoint/index.ts";

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
 * const routes = ROUTES.getEndpointsFromBundle({bundle: routes_}); // strong type will be lost
 * console.log(routes) // {route1: ..., route2: ..., route3: ..., route4: ...}
 * ```
 */
export function getEndpointsFromBundle({
  bundle,
  excludeTags,
  includeTags,
}: {
  bundle: Record<string, any>;
  includeTags?: string[];
  excludeTags?: string[];
}): Record<string, Http.Build | Sse.Build> {
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
  if (includeTags) {
    const tags = new Set(includeTags);
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
  if (excludeTags) {
    const tags = new Set(excludeTags);
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
 *
 * @example
 * ```ts
 * const routes = ROUTES.getEndpointsFromBundle({
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
    const middlewares = build.middlewares;
    const security = [
      ...middlewares.map((m) => m.security ?? {}),
      build.security ?? {},
    ];
    Object.assign(securityData, ...security);
    let obj: ZodOpenApiOperationObject;
    if (build.endpoint === "http") {
      obj = {
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
                  middleware.request.shape.headers?.shape ?? {}
                ),
              {
                ...(build.request.shape.headers?.shape ?? {}),
              }
            )
          ),
          query: z.object(
            middlewares.reduce(
              (shape, middleware) =>
                Object.assign(
                  shape,
                  middleware.request.shape.query?.shape ?? {}
                ),
              {
                ...(build.request.shape.query?.shape ?? {}),
              }
            )
          ),
          path: z.object({ ...(build.request.shape.path?.shape ?? {}) }),
        },
        requestBody: {
          content: {
            [build.reqMediaTypes ?? "application/json"]: {
              schema: build.request.shape.body,
            },
          },
        },
        responses: {
          default: {
            content: {
              [build.resMediaTypes ?? "application/json"]: {
                schema: build.response.shape.body,
              },
            },
            headers: z.object(
              middlewares.reduce(
                (shape, middleware) =>
                  Object.assign(
                    shape,
                    middleware.response.shape.headers?.shape ?? {}
                  ),
                {
                  ...(build.response.shape.headers?.shape ?? {}),
                }
              )
            ),
          } as ZodOpenApiResponseObject,
        },
      };
    } else if (build.endpoint === "sse") {
      obj = {
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
                  middleware.request.shape.headers?.shape ?? {}
                ),
              {}
            )
          ),
          query: z.object(
            middlewares.reduce(
              (shape, middleware) =>
                Object.assign(
                  shape,
                  middleware.request.shape.query?.shape ?? {}
                ),
              {
                ...(build.request.shape.query?.shape ?? {}),
              }
            )
          ),
          path: z.object({ ...(build.request.shape.path?.shape ?? {}) }),
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
    for (const path of build.path) {
      paths[path] ??= {};
      for (const method of build.method) {
        if (paths[path][method])
          throw new Error(`[${[path, method]}] Found duplicate.`);
        paths[path][method] = obj;
      }
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

export type LifeCycle<Opt> = {
  init(
    context: FUNCTIONS.Context,
    opt: Opt
  ): Promise<{
    headers?: Record<string, string | string[]>;
    path?: Record<string, string>;
    query?: Record<string, string | string[]>;
    body?: any;
  }>;

  onStatusChange?(arg: {
    status: "start" | "complete";
    context: FUNCTIONS.Context;
    build: Http.Build | Sse.Build;
  }): void;

  onExecution?(arg: {
    context: FUNCTIONS.Context;
    build: Middleware.Build;
  }): void;
  onExecution?(arg: { context: FUNCTIONS.Context; build: Http.Build }): void;
  onExecution?(arg: { context: FUNCTIONS.Context; build: Sse.Build }): void;

  onResponse?(arg: {
    context: FUNCTIONS.Context;
    build: Middleware.Build;
    res: null | z.infer<Middleware.Build["response"]>;
    err: null | unknown;
  }): void;
  onResponse?(arg: {
    context: FUNCTIONS.Context;
    build: Http.Build;
    res: null | z.infer<Http.Build["response"]>;
    err: null | unknown;
  }): void;
  onResponse?(arg: {
    context: FUNCTIONS.Context;
    build: Sse.Build;
    res: null | z.infer<Sse.Build["response"]>;
    err: null | unknown;
  }): void;

  onComplete?(arg: {
    context: FUNCTIONS.Context;
    build: Middleware.Build;
  }): void;
  onComplete?(arg: { context: FUNCTIONS.Context; build: Http.Build }): void;
  onComplete?(arg: { context: FUNCTIONS.Context; build: Sse.Build }): void;
};

/**
 * To execute your http or sse builds.
 * @param context
 * @param build
 * @param req
 * @param cbs
 * @returns
 */
export async function execute<Opt>({
  context,
  build,
  lc,
  opt,
}: {
  context: FUNCTIONS.Context;
  build: Http.Build | Sse.Build;
  lc: LifeCycle<Opt>;
  opt: Opt;
}): Promise<void> {
  const req = await lc.init(context, opt);
  lc.onStatusChange?.({ status: "start", context, build });
  try {
    for (const middleware of build.middlewares) {
      lc.onExecution?.({ context, build: middleware });
      try {
        const res = await middleware({ context, ...req });
        lc.onResponse?.({
          context,
          build: middleware,
          res: res,
          err: null,
        });
      } catch (err) {
        lc.onResponse?.({
          context,
          build: middleware,
          res: null,
          err: err,
        });
        return;
      } finally {
        lc.onComplete?.({ context, build: middleware });
      }
    }
    if (build.endpoint === "http") {
      lc.onExecution?.({ context, build });
      try {
        const res = await build({ context, ...req });
        lc.onResponse?.({ context, build: build, res: res, err: null });
      } catch (err) {
        lc.onResponse?.({ context, build: build, res: null, err: err });
        return;
      } finally {
        lc.onComplete?.({ context, build: build });
      }
    } else {
      lc.onExecution?.({ context, build });
      try {
        for await (const res of build({ context, ...req })) {
          lc.onResponse?.({ context, build: build, res: res, err: null });
        }
      } catch (err) {
        lc.onResponse?.({ context, build: build, res: null, err: err });
        return;
      } finally {
        lc.onComplete?.({ context, build: build });
      }
    }
  } finally {
    lc.onStatusChange?.({ status: "complete", context, build });
  }
}

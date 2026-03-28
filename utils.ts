import { F } from "@panth977/functions";
import {
  FuncHttp,
  type FuncHttpExported,
  FuncMiddleware,
  FuncSse,
  type HttpInput,
  type HttpOutput,
  type HttpTypes,
} from "./endpoint/index.ts";
import type { EndpointBuild } from "./exports.ts";
import type {
  FuncSseExported,
  SseInput,
  SseOutput,
  SseTypes,
} from "./endpoint/sse.ts";
import { T } from "@panth977/tools";

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
}): Record<string, EndpointBuild> {
  const allReady: Record<string, EndpointBuild> = {};
  for (const loc in bundle) {
    const build = bundle[loc];
    if (
      typeof build === "function" &&
      "node" in build &&
      (build.node instanceof FuncHttp || build.node instanceof FuncSse)
    ) {
      allReady[loc] = build;
    }
  }
  if (includeTags) {
    const tags = new Set(includeTags);
    loop: for (const loc in allReady) {
      for (const m of allReady[loc].node.middlewares) {
        for (const tag of m.node.tags) {
          if (tags.has(tag)) {
            continue loop;
          }
        }
      }
      for (const tag of allReady[loc].node.tags) {
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
      for (const m of allReady[loc].node.middlewares) {
        for (const tag of m.node.tags) {
          if (tags.has(tag)) {
            delete allReady[loc];
            continue loop;
          }
        }
      }
      for (const tag of allReady[loc].node.tags) {
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
export type PromiseLikeOr<T> = T | PromiseLike<Awaited<T>>;
export function isHttpExport(
  build: any,
): build is FuncHttpExported<HttpInput, HttpOutput, HttpTypes> {
  return typeof build === "function" && "node" in build &&
    build.node instanceof FuncHttp;
}
export function isSseExport(
  build: any,
): build is FuncSseExported<SseInput, SseOutput, SseTypes> {
  return typeof build === "function" && "node" in build &&
    build.node instanceof FuncSse;
}

export abstract class RouteContext extends F.Context<null> {
  constructor(requestId: string, path: string) {
    super(requestId, path, null);
  }

  get requestId(): string {
    return this.id;
  }
}

export type HttpHandlers<C extends RouteContext, R> = {
  middlewareReq(context: C): PromiseLikeOr<
    {
      headers: Record<string, string | string[]>;
      query: Record<string, string | string[]>;
    }
  >;
  handlerReq(context: C): PromiseLikeOr<{
    headers: Record<string, string | string[]>;
    query: Record<string, string | string[]>;
    path: Record<string, string> | string[];
    body: any;
  }>;
  onError: (context: C, err: unknown) => {
    status: number;
    headers?: Record<string, string[] | string>;
    message: string;
  };
};

export async function executeHttp<C extends RouteContext, R>(
  context: C,
  http: FuncHttpExported<HttpInput, HttpOutput, HttpTypes>,
  handler: HttpHandlers<C, R>,
): Promise<
  {
    type: "success";
    headers: Record<string, string | string[]>;
    content: unknown;
  } | {
    type: "error";
    status: number;
    headers?: Record<string, string[] | string>;
    message: string;
  }
> {
  const headers: Record<string, string[] | string> = {};
  function addHeaders(result: { headers?: Record<string, string[] | string> }) {
    if (result.headers) {
      for (const key in result.headers) {
        if (headers[key] === undefined) {
          headers[key] = result.headers[key];
        } else {
          headers[key] = [
            ...(Array.isArray(headers[key]) ? headers[key] : [headers[key]]),
            ...(Array.isArray(result.headers[key])
              ? result.headers[key]
              : [result.headers[key]]),
          ];
        }
      }
    }
  }
  try {
    for (const middleware of http.node.middlewares) {
      const input = await handler.middlewareReq(context);
      const result = await middleware(context, input);
      FuncMiddleware.setOpt(context, middleware.node, result.opt);
      addHeaders(result);
    }
    const input = await handler.handlerReq(context);
    const result = await http(context, input);
    addHeaders(result);
    return { type: "success", headers, content: result.body };
  } catch (err) {
    const result = handler.onError(context, err);
    addHeaders(result);
    return {
      type: "error",
      headers,
      status: result.status,
      message: result.message,
    };
  }
}
export type SseHandlers<C extends RouteContext, R> = {
  req(
    context: C,
  ): { path: Record<string, string>; query: Record<string, string | string[]> };
  onError: (context: C, err: unknown) => string;
};

export function executeSse<C extends RouteContext, R>(
  context: C,
  sse: FuncSseExported<SseInput, SseOutput, SseTypes>,
  handler: SseHandlers<C, R>,
): ReadableStream<string> {
  const stream = new T.PStream<string>();
  (async function () {
    let isCanceled = false;
    stream.onAbort(() => isCanceled = true);
    try {
      for (const middleware of sse.node.middlewares) {
        const input = handler.req(context);
        const result = await middleware(context, input);
        if (isCanceled) return;
        FuncMiddleware.setOpt(context, middleware.node, result.opt);
      }
      await T.PStream.TransferStream(sse(context, handler.req(context)), stream, {
        listen(data) {
          stream.emit(sse.node.encoder(data));
        }
      });
    } catch (err) {
      try {
        stream.emit(handler.onError(context, err))
      } catch {
        // ignore
      }
      stream.error(err);
    }
  })();
  return stream.stream;
}

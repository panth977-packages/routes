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
  middlewareReq(
    context: C,
  ): PromiseLikeOr<
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
  successRes(
    context: C,
    contentType: "application/json" | (string & Record<never, never>),
    headers: Record<string, string | string[]>,
    content: unknown,
  ): R;
  errorRes(
    context: C,
    status: number,
    headers: Record<string, string[] | string>,
    message: string,
  ): R;
};

export async function executeHttp<C extends RouteContext, R>(
  context: C,
  http: FuncHttpExported<HttpInput, HttpOutput, HttpTypes>,
  handler: HttpHandlers<C, R>,
  onError: (
    context: C,
    err: unknown,
  ) => {
    status: number;
    headers?: Record<string, string[] | string>;
    message: string;
  },
): Promise<R> {
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
    const contentType = http.node.resMediaTypes || "application/json";
    return handler.successRes(context, contentType, headers, result.body);
  } catch (err) {
    const result = onError(context, err);
    addHeaders(result);
    return handler.errorRes(context, result.status, headers, result.message);
  }
}
export type SseHandlers<C extends RouteContext, R> = {
  req(
    context: C,
  ): { path: Record<string, string>; query: Record<string, string | string[]> };
  start(context: C): R;
  sendData(context: C, data: string): void;
  endSuccess(context: C): void;
  endError(context: C, data: string): void;
};

export function executeSse<C extends RouteContext, R>(
  context: C,
  sse: FuncSseExported<SseInput, SseOutput, SseTypes>,
  handler: SseHandlers<C, R>,
  onError: (context: C, err: unknown) => string,
  onEnd: (context: C) => void,
): R {
  const res = handler.start(context);
  (async function () {
    let reader: ReadableStreamDefaultReader<any> | null = null;
    try {
      for (const middleware of sse.node.middlewares) {
        const input = handler.req(context);
        const result = await middleware(context, input);
        FuncMiddleware.setOpt(context, middleware.node, result.opt);
      }
      const readable = sse(context, handler.req(context));
      reader = readable.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          handler.endSuccess(context);
          break;
        }
        const output = sse.node.encoder(value);
        handler.sendData(context, output);
      }
    } catch (err) {
      const output = onError(context, err);
      handler.endError(context, output);
    } finally {
      reader?.releaseLock();
      onEnd(context);
    }
  })();
  return res;
}

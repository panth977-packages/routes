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
import type z from "zod/v4";

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

export abstract class HttpContext extends F.Context<null> {
  abstract get req(): {
    headers: Record<string, string | string[]>;
    path: Record<string, string> | string[];
    query: Record<string, string | string[]>;
    body: any;
  };
  abstract setResHeaders(headers: Record<string, string | string[]>): void;
  abstract endWithData(
    contentType: "application/json" | (string & Record<never, never>),
    content: unknown,
  ): void;
  abstract endedWithError(err: unknown): void;

  constructor(requestId: string, path: string) {
    super(requestId, path, null);
  }

  get requestId(): string {
    return this.id;
  }
}
function onData<T>(
  cb: (result: ["Error", unknown] | ["Data", T]) => void,
  data: T,
): void {
  cb(["Data", data]);
}
function onError<T>(
  cb: (result: ["Error", unknown] | ["Data", T]) => void,
  error: unknown,
): void {
  cb(["Error", error]);
}
function executeFunc<
  I extends F.FuncInput,
  O extends F.FuncOutput,
  D extends F.FuncDeclaration,
  Type extends Extract<F.FuncTypes, "SyncFunc" | "AsyncFunc">,
  C extends F.Context,
>(
  func: F.FuncExported<I, O, D, Type>,
  context: C,
  input: z.infer<I>,
  cb: (result: ["Error", unknown] | ["Data", z.infer<O>]) => void,
): VoidFunction | null {
  try {
    if (func.node.type === "SyncFunc") {
      const data = func(context, input) as F.FuncReturn<O, "SyncFunc">;
      onData(cb, data);
    } else if (func.node.type === "AsyncFunc") {
      const promise = func(context, input) as F.FuncReturn<O, "AsyncFunc">;
      promise
        .ondata((onData<z.infer<O>>).bind(null, cb))
        .onerror((onError<z.infer<O>>).bind(null, cb));
    } else {
      onError(cb, new Error("Invalid function type"));
    }
  } catch (err) {
    onError(cb, err);
  }
  return null;
}

export class HttpExecutor<
  I extends HttpInput,
  O extends HttpOutput,
  D extends F.FuncDeclaration,
  Type extends HttpTypes,
  C extends HttpContext,
> {
  readonly context: C;
  readonly http: FuncHttpExported<I, O, D, Type>;
  protected status:
    | "WaitingToStart"
    | "Running"
    | "ErrorExit"
    | "SuccessExit"
    | "CanceledExit" = "WaitingToStart";
  getStatus(): typeof this.status {
    return this.status;
  }
  currentCancel: VoidFunction | null = null;
  constructor(context: C, http: FuncHttpExported<I, O, D, Type>) {
    this.context = context;
    this.http = http;
  }
  start(): void {
    if (this.status !== "WaitingToStart" && this.status !== "ErrorExit") {
      throw new Error(`Cannot run at [${this.status}] status`);
    }
    this.invokeBuildIndex(0);
    this.status = "Running";
  }
  cancel(): void {
    this.status = "CanceledExit";
    this.currentCancel?.();
    this.currentCancel = null;
  }
  protected handleMiddlewareInvoke(
    idx: number,
    result: ["Error", unknown] | ["Data", { headers: any; opt: any }],
  ) {
    if (this.status !== "Running") return;
    this.currentCancel = null;
    if (result[0] === "Error") {
      this.context.endedWithError(result[1]);
      this.status = "ErrorExit";
      return;
    }
    FuncMiddleware.setOpt(
      this.context,
      this.http.node.middlewares[idx].node,
      result[1].opt,
    );
    this.context.setResHeaders(result[1].headers);
    this.invokeBuildIndex(idx + 1);
  }
  protected handleHttpInvoke(
    result: ["Error", unknown] | ["Data", { headers: any; body: any }],
  ) {
    if (this.status !== "Running") return;
    this.currentCancel = null;
    if (result[0] === "Error") {
      this.context.endedWithError(result[1]);
      this.status = "ErrorExit";
      return;
    }
    this.context.setResHeaders(result[1].headers);
    if (
      !this.http.node.resMediaTypes ||
      this.http.node.resMediaTypes === "application/json"
    ) {
      this.context.endWithData("application/json", result[1].body);
    } else {
      this.context.endWithData(this.http.node.resMediaTypes, result[1].body);
    }
    this.status = "SuccessExit";
    return;
  }
  protected invokeBuildIndex(idx: number) {
    if (this.status !== "Running") return;
    this.currentCancel = null;
    if (idx < this.http.node.middlewares.length) {
      this.currentCancel = executeFunc(
        this.http.node.middlewares[idx],
        this.context,
        this.context.req,
        this.handleMiddlewareInvoke.bind(this, idx),
      );
    } else {
      this.currentCancel = executeFunc(
        this.http,
        this.context,
        this.context.req as any,
        this.handleHttpInvoke.bind(this),
      );
    }
  }
}

export abstract class SseContext extends F.Context<null> {
  abstract get req(): {
    path: Record<string, string>;
    query: Record<string, string | string[]>;
  };

  abstract send(data: string): void;
  abstract endedWithError(err: unknown): void;
  abstract endedWithSuccess(): void;

  constructor(requestId: string, path: string) {
    super(requestId, path, null);
  }

  get requestId(): string {
    return this.id;
  }
}

export class SseExecutor<
  I extends SseInput,
  O extends SseOutput,
  D extends F.FuncDeclaration,
  Type extends SseTypes,
  C extends SseContext,
> {
  readonly context: C;
  readonly sse: FuncSseExported<I, O, D, Type>;
  private status:
    | "WaitingToStart"
    | "Running"
    | "ErrorExit"
    | "SuccessExit"
    | "CanceledExit" = "WaitingToStart";
  currentCancel: VoidFunction | null = null;
  constructor(context: C, sse: FuncSseExported<I, O, D, Type>) {
    this.context = context;
    this.sse = sse;
  }
  start(): void {
    if (this.status !== "WaitingToStart" && this.status !== "ErrorExit") {
      throw new Error(`Cannot run at [${this.status}] status`);
    }
    this.invokeBuildIndex(0);
    this.status = "Running";
  }
  cancel(): void {
    this.status = "CanceledExit";
    this.currentCancel?.();
    this.currentCancel = null;
  }
  protected handleMiddlewareInvoke(
    idx: number,
    result: ["Error", unknown] | ["Data", { headers: any; opt: any }],
  ) {
    if (this.status !== "Running") return;
    this.currentCancel = null;
    if (result[0] === "Error") {
      this.context.endedWithError(result[1]);
      this.status = "ErrorExit";
      return;
    }
    FuncMiddleware.setOpt(
      this.context,
      this.sse.node.middlewares[idx].node,
      result[1].opt,
    );
    this.invokeBuildIndex(idx + 1);
  }
  protected onEnd() {
    this.currentCancel = null;
    this.context.endedWithSuccess();
    this.status = "SuccessExit";
  }
  protected onError(error: unknown) {
    this.currentCancel = null;
    this.context.endedWithError(error);
    this.status = "ErrorExit";
  }
  protected onData(data: z.infer<O>, _i: number) {
    let output;
    try {
      output = this.sse.node.encoder(data);
    } catch (error) {
      this.currentCancel?.();
      this.currentCancel = null;
      this.context.endedWithError(error);
      this.status = "ErrorExit";
      return;
    }
    this.context.send(output);
  }
  protected invokeBuildIndex(idx: number) {
    if (this.status !== "Running") return;
    this.currentCancel = null;
    if (idx < this.sse.node.middlewares.length) {
      this.currentCancel = executeFunc(
        this.sse.node.middlewares[idx],
        this.context,
        this.context.req as any,
        this.handleMiddlewareInvoke.bind(this, idx),
      );
    } else {
      const process = this.sse(this.context, this.context.req as any);
      this.currentCancel = process.cancel.bind(process);
      process.onfinish(this.onEnd.bind(this));
      process.onerror(this.onError.bind(this));
      process.listen(this.onData.bind(this));
    }
  }
}

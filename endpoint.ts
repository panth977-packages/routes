import type { HttpMethod, SecurityScheme } from "./zod-openapi.ts";
import {
  emptyHttpInput,
  emptyHttpOutput,
  emptySseInput,
  emptySseOutput,
  FuncHttpBuilder,
  type FuncMiddlewareExported,
  FuncSseBuilder,
  type HttpTypes,
  type MiddlewareInput,
  type MiddlewareOutput,
  type MiddlewareTypes,
  type SseMethod,
  type SseTypes,
} from "./endpoint/index.ts";
import { defaultEncoder } from "./endpoint/sse.ts";
type Meta = {
  tags?: string[];
  summary?: string;
  description?: string;
  security?: Record<string, SecurityScheme>;
  docsOrder?: number;
  showIndocs?: boolean;
};
/**
 * A Pipeline to create your endpoints.
 *
 * @example
 * ```ts
 * const initMiddleware = ROUTE.Middleware.build(...);
 * const userAuthMiddleware = ROUTE.Middleware.build(...);
 * const thirdPartyAuthMiddleware = ROUTE.Middleware.build(...);
 *
 * const EndpointFactory = ROUTE.Endpoint.build().addMiddleware(initMiddleware);
 * const endpoints = {
 *   userAuthorized: EndpointFactory.addMiddleware(userAuthMiddleware),
 *   thirdPartyAuthorized: EndpointFactory.addMiddleware(thirdPartyAuthMiddleware),
 * }
 *
 * const getProfile = endpoints.userAuthorized.HTTP('get', '/profile', 'AsyncFunc', ...);
 * ...;
 * ```
 */
export class Endpoint {
  protected middlewares: FuncMiddlewareExported<
    MiddlewareInput,
    MiddlewareOutput,
    MiddlewareTypes
  >[];
  protected tags: string[];
  protected namespace: string;
  static build(): Endpoint {
    return new Endpoint([], [], "Unknown");
  }
  protected constructor(
    middlewares: FuncMiddlewareExported<
      MiddlewareInput,
      MiddlewareOutput,
      MiddlewareTypes
    >[],
    tags: string[],
    namespace: string,
  ) {
    this.middlewares = middlewares;
    this.tags = tags;
    this.namespace = namespace;
  }
  //
  protected clone(): this {
    return new Endpoint(
      [...this.middlewares],
      [...this.tags],
      this.namespace,
    ) as this;
  }

  $middlewares<
    I extends MiddlewareInput,
    O extends MiddlewareOutput,
    Type extends MiddlewareTypes,
  >(middleware: FuncMiddlewareExported<I, O, Type>): this {
    const e = this.clone();
    e.middlewares.push(middleware as never);
    return e;
  }
  $addTags(...tags: string[]): this {
    const e = this.clone();
    e.tags.push(...tags);
    return e;
  }
  $namespace(namespace: string): this {
    const e = this.clone();
    e.namespace = namespace;
    return e;
  }
  //
  HTTP<Type extends HttpTypes>(
    methods: HttpMethod | HttpMethod[],
    paths: string | string[],
    type: Type,
    meta?: Meta,
    name?: string,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    Type
  > {
    return new FuncHttpBuilder(
      [...this.middlewares],
      Array.isArray(methods) ? methods : [methods],
      Array.isArray(paths) ? paths : [paths],
      type,
      emptyHttpInput,
      emptyHttpOutput,
      [],
      { namespace: this.namespace, name: name ?? "Unknown" },
      meta?.tags ?? [],
      meta?.summary ?? "",
      meta?.description ?? "",
      meta?.security ?? {},
      "",
      "",
      meta?.docsOrder ?? Number.MAX_SAFE_INTEGER,
      meta?.showIndocs ?? true,
    );
  }
  SSE<Type extends SseTypes>(
    methods: SseMethod | SseMethod[],
    paths: string | string[],
    type: Type,
    meta?: Meta,
    name?: string,
  ): FuncSseBuilder<
    typeof emptySseInput,
    typeof emptySseOutput,
    Type
  > {
    return new FuncSseBuilder(
      [...this.middlewares],
      Array.isArray(methods) ? methods : [methods],
      Array.isArray(paths) ? paths : [paths],
      type,
      emptySseInput,
      emptySseOutput,
      [],
      { namespace: this.namespace, name: name ?? "Unknown" },
      defaultEncoder,
      meta?.tags ?? [],
      meta?.summary ?? "",
      meta?.description ?? "",
      meta?.security ?? {},
      meta?.docsOrder ?? Number.MAX_SAFE_INTEGER,
      meta?.showIndocs ?? true,
    );
  }
}

export class EndpointWithAliases extends Endpoint {
  protected override clone(): this {
    return new EndpointWithAliases(
      [...this.middlewares],
      [...this.tags],
      this.namespace,
    ) as this;
  }

  get<Type extends HttpTypes>(
    path: string,
    type: Type,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    Type
  > {
    return this.HTTP("get", path, type, meta, path);
  }
  post<Type extends HttpTypes>(
    path: string,
    type: Type,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    Type
  > {
    return this.HTTP("post", path, type, meta, path);
  }
  patch<Type extends HttpTypes>(
    path: string,
    type: Type,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    Type
  > {
    return this.HTTP("patch", path, type, meta, path);
  }
  put<Type extends HttpTypes>(
    path: string,
    type: Type,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    Type
  > {
    return this.HTTP("put", path, type, meta, path);
  }
  delete<Type extends HttpTypes>(
    path: string,
    type: Type,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    Type
  > {
    return this.HTTP("delete", path, type, meta, path);
  }
  sse<Type extends SseTypes>(
    path: string,
    type: Type,
    meta?: Meta,
  ): FuncSseBuilder<
    typeof emptySseInput,
    typeof emptySseOutput,
    Type
  > {
    return this.SSE("get", path, type, meta, path);
  }
}

export class EndpointWithTypedAliases extends Endpoint {
  protected override clone(): this {
    return new EndpointWithTypedAliases(
      [...this.middlewares],
      [...this.tags],
      this.namespace,
    ) as this;
  }

  syncGET(
    path: string,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    "SyncFunc"
  > {
    return this.HTTP("get", path, "SyncFunc", meta, path);
  }
  syncPOST(
    path: string,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    "SyncFunc"
  > {
    return this.HTTP("post", path, "SyncFunc", meta, path);
  }
  syncPATCH(
    path: string,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    "SyncFunc"
  > {
    return this.HTTP("patch", path, "SyncFunc", meta, path);
  }
  syncPUT(
    path: string,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    "SyncFunc"
  > {
    return this.HTTP("put", path, "SyncFunc", meta, path);
  }
  syncDELETE(
    path: string,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    "SyncFunc"
  > {
    return this.HTTP("delete", path, "SyncFunc", meta, path);
  }
  asyncGET(
    path: string,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    "AsyncFunc"
  > {
    return this.HTTP("get", path, "AsyncFunc", meta, path);
  }
  asyncPOST(
    path: string,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    "AsyncFunc"
  > {
    return this.HTTP("post", path, "AsyncFunc", meta, path);
  }
  asyncPATCH(
    path: string,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    "AsyncFunc"
  > {
    return this.HTTP("patch", path, "AsyncFunc", meta, path);
  }
  asyncPUT(
    path: string,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    "AsyncFunc"
  > {
    return this.HTTP("put", path, "AsyncFunc", meta, path);
  }
  asyncDELETE(
    path: string,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    "AsyncFunc"
  > {
    return this.HTTP("delete", path, "AsyncFunc", meta, path);
  }
  streamSSE(
    path: string,
    meta?: Meta,
  ): FuncSseBuilder<
    typeof emptySseInput,
    typeof emptySseOutput,
    "StreamFunc"
  > {
    return this.SSE("get", path, "StreamFunc", meta, path);
  }
}

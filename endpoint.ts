import type { F } from "@panth977/functions";
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
 * const getProfile = endpoints.userAuthorized.HTTP('get', '/profile', ...);
 * const getProfile3rdParty = endpoints.thirdPartyAuthorized.get('/api/{userId}/profile', ...);
 * ...;
 * ```
 */
export class Endpoint {
  protected middlewares: FuncMiddlewareExported<
    MiddlewareInput,
    MiddlewareOutput,
    F.FuncDeclaration,
    MiddlewareTypes
  >[];
  protected tags: string[];
  protected namespace: string;
  static build(): Endpoint {
    return new Endpoint([], [], "Unknown");
  }
  private constructor(
    middlewares: FuncMiddlewareExported<
      MiddlewareInput,
      MiddlewareOutput,
      F.FuncDeclaration,
      MiddlewareTypes
    >[],
    tags: string[],
    namespace: string,
  ) {
    this.middlewares = middlewares;
    this.tags = tags;
    this.namespace = namespace;
  }
  $middlewares<
    I extends MiddlewareInput,
    O extends MiddlewareOutput,
    D extends F.FuncDeclaration,
    Type extends MiddlewareTypes,
  >(middleware: FuncMiddlewareExported<I, O, D, Type>): Endpoint {
    return new Endpoint(
      [...this.middlewares, middleware] as never,
      this.tags,
      this.namespace,
    );
  }
  $addTags(...tags: string[]): Endpoint {
    return new Endpoint(
      this.middlewares,
      [...this.tags, ...tags],
      this.namespace,
    );
  }
  $namespace(namespace: string): Endpoint {
    return new Endpoint(this.middlewares, this.tags, namespace);
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
    Record<never, never>,
    Type
  > {
    return new FuncHttpBuilder(
      [...this.middlewares],
      Array.isArray(methods) ? methods : [methods],
      Array.isArray(paths) ? paths : [paths],
      type,
      emptyHttpInput,
      emptyHttpOutput,
      {},
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
    Record<never, never>,
    Type
  > {
    return new FuncSseBuilder(
      [...this.middlewares],
      Array.isArray(methods) ? methods : [methods],
      Array.isArray(paths) ? paths : [paths],
      type,
      emptySseInput,
      emptySseOutput,
      {},
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
  //
  get<Type extends HttpTypes>(
    path: string,
    type: Type,
    meta?: Meta,
  ): FuncHttpBuilder<
    typeof emptyHttpInput,
    typeof emptyHttpOutput,
    Record<never, never>,
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
    Record<never, never>,
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
    Record<never, never>,
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
    Record<never, never>,
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
    Record<never, never>,
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
    Record<never, never>,
    Type
  > {
    return this.SSE("get", path, type, meta, path);
  }
}

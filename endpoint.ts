import { Sse, Http, type Middleware } from "./endpoint/index.ts";
import type { FUNCTIONS } from "@panth977/functions";

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
export class Endpoint<Ms extends [] | [any, ...any[]]> {
  middlewares: Ms;
  tags: string[];
  static build(): Endpoint<[]> {
    return new Endpoint([], []);
  }
  private constructor(middlewares: Ms, tags: string[]) {
    this.middlewares = middlewares;
    this.tags = tags;
  }
  addMiddleware<
    //
    I extends Middleware.zInput,
    O extends Middleware.zOutput,
    S extends Record<never, never>,
    C extends FUNCTIONS.Context,
    W extends Middleware.Wrappers<I, O, S, C>
  >(
    middleware: Middleware.Build<I, O, S, C, W>
  ): Endpoint<[...Ms, Middleware.Build<I, O, S, C, W>]> {
    return new Endpoint([...this.middlewares, middleware as never], this.tags);
  }
  addTags(...tags: string[]): Endpoint<Ms> {
    return new Endpoint(this.middlewares, [...this.tags, ...tags]);
  }
  //
  get<
    //
    I extends Http.zInput,
    O extends Http.zOutput,
    S extends Record<never, never>,
    C extends FUNCTIONS.Context,
    W extends Http.Wrappers<I, O, S, C>
  >(
    path: string,
    params: Http.Params<Ms, I, O, S, C, W>
  ): Http.Build<Ms, I, O, S, C, W> {
    params.tags = (params.tags ??= []).concat(this.tags);
    return Http.build(this.middlewares, "get", path, params);
  }
  post<
    //
    I extends Http.zInput,
    O extends Http.zOutput,
    S extends Record<never, never>,
    C extends FUNCTIONS.Context,
    W extends Http.Wrappers<I, O, S, C>
  >(
    path: string,
    params: Http.Params<Ms, I, O, S, C, W>
  ): Http.Build<Ms, I, O, S, C, W> {
    params.tags = (params.tags ??= []).concat(this.tags);
    return Http.build(this.middlewares, "post", path, params);
  }
  patch<
    //
    I extends Http.zInput,
    O extends Http.zOutput,
    S extends Record<never, never>,
    C extends FUNCTIONS.Context,
    W extends Http.Wrappers<I, O, S, C>
  >(
    path: string,
    params: Http.Params<Ms, I, O, S, C, W>
  ): Http.Build<Ms, I, O, S, C, W> {
    params.tags = (params.tags ??= []).concat(this.tags);
    return Http.build(this.middlewares, "patch", path, params);
  }
  put<
    //
    I extends Http.zInput,
    O extends Http.zOutput,
    S extends Record<never, never>,
    C extends FUNCTIONS.Context,
    W extends Http.Wrappers<I, O, S, C>
  >(
    path: string,
    params: Http.Params<Ms, I, O, S, C, W>
  ): Http.Build<Ms, I, O, S, C, W> {
    params.tags = (params.tags ??= []).concat(this.tags);
    return Http.build(this.middlewares, "put", path, params);
  }
  delete<
    //
    I extends Http.zInput,
    O extends Http.zOutput,
    S extends Record<never, never>,
    C extends FUNCTIONS.Context,
    W extends Http.Wrappers<I, O, S, C>
  >(
    path: string,
    params: Http.Params<Ms, I, O, S, C, W>
  ): Http.Build<Ms, I, O, S, C, W> {
    params.tags = (params.tags ??= []).concat(this.tags);
    return Http.build(this.middlewares, "delete", path, params);
  }
  trace<
    //
    I extends Http.zInput,
    O extends Http.zOutput,
    S extends Record<never, never>,
    C extends FUNCTIONS.Context,
    W extends Http.Wrappers<I, O, S, C>
  >(
    path: string,
    params: Http.Params<Ms, I, O, S, C, W>
  ): Http.Build<Ms, I, O, S, C, W> {
    params.tags = (params.tags ??= []).concat(this.tags);
    return Http.build(this.middlewares, "trace", path, params);
  }
  options<
    //
    I extends Http.zInput,
    O extends Http.zOutput,
    S extends Record<never, never>,
    C extends FUNCTIONS.Context,
    W extends Http.Wrappers<I, O, S, C>
  >(
    path: string,
    params: Http.Params<Ms, I, O, S, C, W>
  ): Http.Build<Ms, I, O, S, C, W> {
    params.tags = (params.tags ??= []).concat(this.tags);
    return Http.build(this.middlewares, "options", path, params);
  }
  sse<
    //
    I extends Sse.zInput,
    Y extends Sse.zYield,
    S extends Record<never, never>,
    C extends FUNCTIONS.Context,
    W extends Sse.Wrappers<I, Y, S, C>
  >(
    path: string,
    params: Sse.Params<Ms, I, Y, S, C, W>
  ): Sse.Build<Ms, I, Y, S, C, W> {
    (params.tags ??= []).concat(this.tags);
    return Sse.build(this.middlewares, "get", path, params);
  }
  //
  HTTP<
    //
    I extends Http.zInput,
    O extends Http.zOutput,
    S extends Record<never, never>,
    C extends FUNCTIONS.Context,
    W extends Http.Wrappers<I, O, S, C>
  >(
    method: Http.Method | Http.Method[],
    path: string | string[],
    params: Http.Params<Ms, I, O, S, C, W>
  ): Http.Build<Ms, I, O, S, C, W> {
    params.tags = (params.tags ??= []).concat(this.tags);
    return Http.build(this.middlewares, method, path, params);
  }
  SSE<
    //
    I extends Sse.zInput,
    Y extends Sse.zYield,
    S extends Record<never, never>,
    C extends FUNCTIONS.Context,
    W extends Sse.Wrappers<I, Y, S, C>
  >(
    method: Sse.Method | Sse.Method[],
    path: string | string[],
    params: Sse.Params<Ms, I, Y, S, C, W>
  ): Sse.Build<Ms, I, Y, S, C, W> {
    (params.tags ??= []).concat(this.tags);
    return Sse.build(this.middlewares, method, path, params);
  }
}

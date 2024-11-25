import type * as Middleware from "./middleware.ts";
import * as Sse from "./sse.ts";
import * as Http from "./http.ts";
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
 * const getProfile = endpoints.userAuthorized.http('get', '/profile', ...);
 * const getProfile3rdParty = endpoints.thirdPartyAuthorized.http('get', '/api/{userId}/profile', ...);
 * ...;
 * ```
 */
export class Endpoint<Ms extends [] | [any, ...any[]]> {
  middlewares: Ms;
  tags: string[];
  static build() {
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
    S,
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
  http<
    //
    I extends Http.zInput,
    O extends Http.zOutput,
    S,
    C extends FUNCTIONS.Context,
    W extends Http.Wrappers<Ms, I, O, S, C>
  >(
    method: Http.Method,
    path: string,
    params: Http.Params<Ms, I, O, S, C, W>
  ): Http.Build<Ms, I, O, S, C, W> {
    params.tags = (params.tags ??= []).concat(this.tags);
    return Http.build(this.middlewares, method, path, params);
  }
  sse<
    //
    I extends Sse.zInput,
    Y extends Sse.zYield,
    S,
    C extends FUNCTIONS.Context,
    W extends Sse.Wrappers<Ms, I, Y, S, C>
  >(
    method: Sse.Method,
    path: string,
    params: Sse.Params<Ms, I, Y, S, C, W>
  ): Sse.Build<Ms, I, Y, S, C, W> {
    (params.tags ??= []).concat(this.tags);
    return Sse.build(this.middlewares, method, path, params);
  }
}

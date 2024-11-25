import type * as Middleware from "./middleware.ts";
import { z } from "zod";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import type { SecuritySchemeObject } from "./zod-openapi.ts";
import { FUNCTIONS } from "@panth977/functions";

export type Method = "get";
export type zInput = z.ZodObject<{
  path?: z.AnyZodObject;
  query?: z.AnyZodObject;
}>;
export type zYield = z.ZodString;

export type WrapperBuild<
  Ms,
  I extends zInput = zInput,
  Y extends zYield = zYield,
  S = unknown,
  C extends FUNCTIONS.Context = FUNCTIONS.Context
> = FUNCTIONS.AsyncGenerator.WrapperBuild<
  I,
  Y,
  z.ZodVoid,
  z.ZodVoid,
  S,
  C & { options: Middleware.inferAllOptions<Ms> }
>;
export type Wrappers<
  Ms,
  I extends zInput = zInput,
  Y extends zYield = zYield,
  S = unknown,
  C extends FUNCTIONS.Context = FUNCTIONS.Context
> = [] | [WrapperBuild<Ms, I, Y, S, C>, ...WrapperBuild<Ms, I, Y, S, C>[]];
export type Params<
  Ms,
  I extends zInput,
  Y extends zYield,
  S,
  C extends FUNCTIONS.Context,
  W extends Wrappers<Ms, I, Y, S, C>
> = _Params &
  Omit<
    FUNCTIONS.AsyncGenerator.Params<
      I,
      Y,
      z.ZodVoid,
      z.ZodVoid,
      S,
      C & { options: Middleware.inferAllOptions<Ms> },
      W
    >,
    "output" | "next"
  >;

type _Params = {
  tags?: ZodOpenApiOperationObject["tags"];
  summary?: ZodOpenApiOperationObject["summary"];
  description?: ZodOpenApiOperationObject["description"];
  security?: Record<string, SecuritySchemeObject>;
};

export type Build<
  Ms = Middleware.Build[],
  I extends zInput = zInput,
  Y extends zYield = zYield,
  S = unknown,
  C extends FUNCTIONS.Context = FUNCTIONS.Context,
  W extends Wrappers<Ms, I, Y, S, C> = []
> = _Params &
  FUNCTIONS.AsyncGenerator.Build<
    I,
    Y,
    z.ZodVoid,
    z.ZodVoid,
    S,
    C & { options: Middleware.inferAllOptions<Ms> },
    W
  > & {
    path: string;
    method: Method;
    endpoint: "sse";
    middlewares: Middleware.Build[];
  };

/**
 * A complete builder with localized information for documenting sse route & building implementation with strict input/output schema
 * @param middlewares
 * @param method
 * @param path
 * @param _params
 * @returns
 *
 * @example
 * ```ts
 * export const getLogs = ROUTES.Sse.build([systemAuthorized], "get", "/logs/{requestId}", {
 *   input: ROUTES.zSseInput({
 *     path: z.object({
 *       requestId: z.string(),
 *     }),
 *   }),
 *   yield: ROUTES.zSseYield(),
 *   async *func(context, { path: { requestId } }) {
 *     let logs = [];
 *     let offset = 0;
 *     do {
 *       const result = await pg.query(`SELECT * FROM logs where id = ? ORDER BY ts OFFSET ? LIMIT 30`, [requestId, offset]);
 *       logs = result.rows
 *       offset += logs.length;
 *       yield JSON.stringify(logs);
 *     } while (logs.length);
 *   },
 * });
 * ```
 */
export function build<
  //
  Ms extends [] | [any, ...any[]],
  I extends zInput,
  Y extends zYield,
  S,
  C extends FUNCTIONS.Context,
  W extends Wrappers<Ms, I, Y, S, C>
>(
  middlewares: Middleware.Build[],
  method: Method,
  path: string,
  _params: Params<Ms, I, Y, S, C, W>
): Build<Ms, I, Y, S, C, W> {
  const params: _Params = {
    description: _params.description,
    security: _params.security,
    summary: _params.summary,
    tags: _params.tags,
  };
  const __params = Object.assign(_params, { output: z.void(), next: z.void() });
  return Object.assign(FUNCTIONS.AsyncGenerator.build(__params), params, {
    endpoint: "sse",
    path: path,
    method: method,
    middlewares,
  } as const);
}

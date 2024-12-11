import type * as Middleware from "./middleware.ts";
import { z } from "zod";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import type { SecuritySchemeObject } from "../zod-openapi.ts";
import { FUNCTIONS } from "@panth977/functions";

export type Method = "get";
export type zInput = z.ZodObject<{
  path?: z.AnyZodObject;
  query?: z.AnyZodObject;
}>;
export type zYield = z.ZodString;
export type ExtraParams = {
  tags?: ZodOpenApiOperationObject["tags"];
  summary?: ZodOpenApiOperationObject["summary"];
  description?: ZodOpenApiOperationObject["description"];
  security?: Record<string, SecuritySchemeObject>;
};

export type WrapperBuild<
  I extends zInput = zInput,
  Y extends zYield = zYield,
  S extends Record<never, never> = Record<never, never>,
  C extends FUNCTIONS.Context = FUNCTIONS.Context
> = FUNCTIONS.AsyncGenerator.WrapperBuild<I, Y, z.ZodVoid, z.ZodVoid, S, C>;
export type Wrappers<
  I extends zInput = zInput,
  Y extends zYield = zYield,
  S extends Record<never, never> = Record<never, never>,
  C extends FUNCTIONS.Context = FUNCTIONS.Context
> = [] | [WrapperBuild<I, Y, S, C>, ...WrapperBuild<I, Y, S, C>[]];
export type Params<
  Ms,
  I extends zInput,
  Y extends zYield,
  S extends Record<never, never>,
  C extends FUNCTIONS.Context,
  W extends Wrappers<I, Y, S, C>
> = Omit<
  FUNCTIONS.AsyncGenerator.Params<I, Y, z.ZodVoid, z.ZodVoid, S, C, W>,
  "input" | "yield" | "next" | "output" | "func"
> & {
  request: I;
  response: Y;
  func: (
    arg: { context: C; build: Build<Ms, I, Y, S, C, W> } & I["_output"]
  ) => AsyncGenerator<Y["_input"], void, void>;
} & ExtraParams;

type _Params<
  Ms = Middleware.Build[],
  I extends zInput = zInput,
  Y extends zYield = zYield
> = {
  request: I;
  response: Y;
  path: string[];
  method: Method[];
  endpoint: "sse";
  middlewares: Ms;
} & ExtraParams;

export type Build<
  Ms = Middleware.Build[],
  I extends zInput = zInput,
  Y extends zYield = zYield,
  S extends Record<never, never> = Record<never, never>,
  C extends FUNCTIONS.Context = FUNCTIONS.Context,
  W extends Wrappers<I, Y, S, C> = []
> = ((
  arg: { context: FUNCTIONS.Context } & I["_input"]
) => AsyncGenerator<Y["_output"], void, void>) &
  Omit<
    Pick<
      FUNCTIONS.AsyncGenerator.Build<I, Y, z.ZodVoid, z.ZodVoid, S, C, W>,
      keyof FUNCTIONS.AsyncGenerator.Build<I, Y, z.ZodVoid, z.ZodVoid, S, C, W>
    >,
    ("input" | "yield" | "next" | "output") | keyof _Params
  > &
  _Params<Ms, I, Y>;

/**
 * A complete builder with localized information for documenting sse route & building implementation with strict input/output schema
 * @param middlewares
 * @param method
 * @param path
 * @param params
 * @returns
 *
 * @example
 * ```ts
 * export const getLogs = ROUTES.Sse.build([systemAuthorized], "get", "/logs/{requestId}", {
 *   input: ROUTES.z.SseInput({
 *     path: z.object({
 *       requestId: z.string(),
 *     }),
 *   }),
 *   yield: ROUTES.z.SseYield(),
 *   async *func({context, path: { requestId }}) {
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
  S extends Record<never, never>,
  C extends FUNCTIONS.Context,
  W extends Wrappers<I, Y, S, C>
>(
  middlewares: Ms,
  method: Method | Method[],
  path: string | string[],
  params: Params<Ms, I, Y, S, C, W>
): Build<Ms, I, Y, S, C, W> {
  const extra: _Params<Ms, I, Y> = {
    request: params.request,
    response: params.response,
    endpoint: "sse",
    middlewares,
    method: Array.isArray(method) ? method : [method],
    path: Array.isArray(path) ? path : [path],
    description: params.description,
    security: params.security,
    summary: params.summary,
    tags: params.tags,
  };
  const _build = FUNCTIONS.AsyncGenerator.build({
    ...params,
    input: params.request,
    yield: params.response,
    next: z.void(),
    output: z.void(),
    func: ({ input, context }: { context: C; input: I["_output"] }) =>
      params.func({ context, build, ...input }),
  });

  const build: Build<Ms, I, Y, S, C, W> = Object.assign(
    ({ context, ...input }: { context: FUNCTIONS.Context } & I["_input"]) =>
      _build({ context, input }),
    _build,
    extra
  );
  return build;
}

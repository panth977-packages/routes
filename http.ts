import type * as Middleware from "./middleware.ts";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import type { SecuritySchemeObject } from "./zod-openapi.ts";
import type { z } from "zod";
import { FUNCTIONS } from "@panth977/functions";

export type Method =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options"
  | "trace";
export type zInput = z.ZodObject<{
  headers?: z.AnyZodObject;
  path?: z.AnyZodObject;
  query?: z.AnyZodObject;
  body?: z.ZodType;
}>;
export type zOutput = z.ZodObject<{
  headers?: z.AnyZodObject;
  body?: z.ZodType;
}>;

export type WrapperBuild<
  Ms,
  I extends zInput = zInput,
  O extends zOutput = zOutput,
  S = any,
  C extends FUNCTIONS.Context = FUNCTIONS.Context
> = FUNCTIONS.AsyncFunction.WrapperBuild<
  I,
  O,
  S,
  C & { options: Middleware.inferAllOptions<Ms> }
>;
export type Wrappers<
  Ms,
  I extends zInput = zInput,
  O extends zOutput = zOutput,
  S = any,
  C extends FUNCTIONS.Context = FUNCTIONS.Context
> = [] | [WrapperBuild<Ms, I, O, S, C>, ...WrapperBuild<Ms, I, O, S, C>[]];
export type Params<
  //
  Ms,
  I extends zInput,
  O extends zOutput,
  S,
  C extends FUNCTIONS.Context,
  W extends Wrappers<Ms, I, O, S, C>
> = _Params &
  FUNCTIONS.AsyncFunction.Params<
    I,
    O,
    S,
    C & { options: Middleware.inferAllOptions<Ms> },
    W
  >;

export type _Params = {
  tags?: ZodOpenApiOperationObject["tags"];
  summary?: ZodOpenApiOperationObject["summary"];
  description?: ZodOpenApiOperationObject["description"];
  security?: Record<string, SecuritySchemeObject>;
  resMediaTypes?: string;
  reqMediaTypes?: string;
};
export type Build<
  Ms = Middleware.Build[],
  I extends zInput = zInput,
  O extends zOutput = zOutput,
  S = unknown,
  C extends FUNCTIONS.Context = FUNCTIONS.Context,
  W extends Wrappers<Ms, I, O, S, C> = Wrappers<Ms, I, O, S, C>
> = _Params &
  FUNCTIONS.AsyncFunction.Build<
    I,
    O,
    S,
    C & { options: Middleware.inferAllOptions<Ms> },
    W
  > & {
    method: Method;
    path: string;
    endpoint: "http";
    middlewares: Ms;
  };
/**
 * A complete builder with localized information for documenting http route & building implementation with strict input/output schema
 * @param middlewares
 * @param method
 * @param path
 * @param _params
 * @returns
 *
 * @example
 * ```ts
 * const getProfile = ROUTES.Http.build([authorize], "get", "/profile", {
 *   description: `Get user profile.`,
 *   input: ROUTES.zHttpInput({}),
 *   output: ROUTES.zHttpOutput({
 *     body: z.object({
 *       id: z.number(),
 *       username: z.string(),
 *       address: z.string().nullable(),
 *       noOfProjects: z.number().int().gt(0),
 *     }),
 *   }),
 *   static: {
 *     query: `Select * from users where id = ? LIMIT 1`,
 *   },
 *   async func(context, input, build) {
 *     const { userId } = context.options.decodedToken;
 *     const result = await pg.query(build.static.query, [userId]);
 *     if (!result.rows.length) throw createHttpError.NotFound("Given user was not found in db, could be because someone has deleted the user.");
 *     return result.rows[0];
 *   },
 * });
 * ```
 */
export function build<
  Ms extends [] | [any, ...any[]],
  I extends zInput,
  O extends zOutput,
  S,
  C extends FUNCTIONS.Context,
  W extends Wrappers<Ms, I, O, S, C>
>(
  middlewares: Ms,
  method: Method,
  path: string,
  _params: Params<Ms, I, O, S, C, W>
): Build<Ms, I, O, S, C, W> {
  const params: _Params = {
    description: _params.description,
    reqMediaTypes: _params.reqMediaTypes,
    resMediaTypes: _params.resMediaTypes,
    security: _params.security,
    summary: _params.summary,
    tags: _params.tags,
  };
  return Object.assign(FUNCTIONS.AsyncFunction.build(_params), params, {
    middlewares,
    endpoint: "http",
    method: method,
    path: path,
  } as const);
}

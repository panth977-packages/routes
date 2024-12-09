import type * as Middleware from "./middleware.ts";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import type { SecuritySchemeObject } from "../zod-openapi.ts";
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
export type ExtraParams = {
  tags?: ZodOpenApiOperationObject["tags"];
  summary?: ZodOpenApiOperationObject["summary"];
  description?: ZodOpenApiOperationObject["description"];
  security?: Record<string, SecuritySchemeObject>;
  resMediaTypes?: string;
  reqMediaTypes?: string;
};

export type WrapperBuild<
  I extends zInput = zInput,
  O extends zOutput = zOutput,
  S extends Record<never, never> = Record<never, never>,
  C extends FUNCTIONS.Context = FUNCTIONS.Context
> = FUNCTIONS.AsyncFunction.WrapperBuild<I, O, S, C>;
export type Wrappers<
  I extends zInput = zInput,
  O extends zOutput = zOutput,
  S extends Record<never, never> = Record<never, never>,
  C extends FUNCTIONS.Context = FUNCTIONS.Context
> = [] | [WrapperBuild<I, O, S, C>, ...WrapperBuild<I, O, S, C>[]];
export type Params<
  //
  Ms,
  I extends zInput,
  O extends zOutput,
  S extends Record<never, never>,
  C extends FUNCTIONS.Context,
  W extends Wrappers<I, O, S, C>
> = Omit<FUNCTIONS.AsyncFunction.Params<I, O, S, C, W>, "func"> & {
  func: (
    arg: {
      context: C;
      build: Build<Ms, I, O, S, C, W>;
    } & I["_output"]
  ) => Promise<O["_input"]>;
} & ExtraParams;

export type Build<
  Ms = Middleware.Build[],
  I extends zInput = zInput,
  O extends zOutput = zOutput,
  S extends Record<never, never> = Record<never, never>,
  C extends FUNCTIONS.Context = FUNCTIONS.Context,
  W extends Wrappers<I, O, S, C> = Wrappers<I, O, S, C>
> = ((
  arg: { context: FUNCTIONS.Context } & I["_input"]
) => Promise<O["_output"]>) &
  Pick<
    FUNCTIONS.AsyncFunction.Build<I, O, S, C, W>,
    keyof FUNCTIONS.AsyncFunction.Build<I, O, S, C, W>
  > & {
    method: Method[];
    path: string[];
    endpoint: "http";
    middlewares: Ms;
  } & ExtraParams;
/**
 * A complete builder with localized information for documenting http route & building implementation with strict input/output schema
 * @param middlewares
 * @param method
 * @param path
 * @param params
 * @returns
 *
 * @example
 * ```ts
 * const getProfile = ROUTES.Http.build([authorize], "get", "/profile", {
 *   description: `Get user profile.`,
 *   input: ROUTES.z.HttpInput({}),
 *   output: ROUTES.z.HttpOutput({
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
 *   async func({context, build}) {
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
  S extends Record<never, never>,
  C extends FUNCTIONS.Context,
  W extends Wrappers<I, O, S, C>
>(
  middlewares: Ms,
  method: Method | Method[],
  path: string | string[],
  params: Params<Ms, I, O, S, C, W>
): Build<Ms, I, O, S, C, W> {
  const extra: ExtraParams = {
    description: params.description,
    reqMediaTypes: params.reqMediaTypes,
    resMediaTypes: params.resMediaTypes,
    security: params.security,
    summary: params.summary,
    tags: params.tags,
  };
  const _build = FUNCTIONS.AsyncFunction.build({
    ...params,
    func: ({ input, context }: { context: C; input: I["_output"] }) =>
      params.func({ context, build, ...input }),
  });
  const func = ({
    context,
    ...input
  }: { context: FUNCTIONS.Context } & I["_input"]) =>
    _build({ context, input });
  const build: Build<Ms, I, O, S, C, W> = Object.assign(func, _build, extra, {
    middlewares,
    endpoint: "http",
    method: Array.isArray(method) ? method : [method],
    path: Array.isArray(path) ? path : [path],
  } as const);
  return build;
}

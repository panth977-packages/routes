import type { z } from "zod";
import { FUNCTIONS } from "@panth977/functions";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import type { SecuritySchemeObject } from "../zod-openapi.ts";

export type zInput = z.ZodObject<{
  headers?: z.AnyZodObject;
  query?: z.AnyZodObject;
}>;
export type zOutput = z.ZodObject<{ headers?: z.AnyZodObject }>;

export type WrapperBuild<
  I extends zInput = zInput,
  O extends zOutput = zOutput,
  S = any,
  C extends FUNCTIONS.Context = FUNCTIONS.Context
> = FUNCTIONS.AsyncFunction.WrapperBuild<I, O, S, C>;
export type Wrappers<
  I extends zInput = zInput,
  O extends zOutput = zOutput,
  S = any,
  C extends FUNCTIONS.Context = FUNCTIONS.Context
> = [] | [WrapperBuild<I, O, S, C>, ...WrapperBuild<I, O, S, C>[]];
export type Params<
  I extends zInput,
  O extends zOutput,
  S,
  C extends FUNCTIONS.Context,
  W extends Wrappers<I, O, S, C>
> = _Params &
  Omit<FUNCTIONS.AsyncFunction.Params<I, O, S, C, W>, "func"> & {
    func: (
      arg: { context: C; build: Build<I, O, S, C, W> } & I["_output"]
    ) => Promise<O["_input"]>;
  };

type _Params = {
  tags?: ZodOpenApiOperationObject["tags"];
  summary?: ZodOpenApiOperationObject["summary"];
  description?: ZodOpenApiOperationObject["description"];
  security?: Record<string, SecuritySchemeObject>;
};

export type Build<
  I extends zInput = zInput,
  O extends zOutput = zOutput,
  S = unknown,
  C extends FUNCTIONS.Context = FUNCTIONS.Context,
  W extends Wrappers<I, O, S, C> = Wrappers<I, O, S, C>
> = ((
  arg: {
    context?: FUNCTIONS.Context | string | null;
  } & I["_input"]
) => Promise<O["_output"]>) &
  _Params &
  Pick<
    FUNCTIONS.AsyncFunction.Build<I, O, S, C, W>,
    keyof FUNCTIONS.AsyncFunction.Build
  > & {
    endpoint: "middleware";
  };

/**
 * A complete builder with localized information for documenting middleware & building implementation with strict input/output schema
 * @param _params
 * @returns
 *
 * @example
 * ```ts
 * const authorize = ROUTES.Middleware.build({
 *   security: {
 *     JwtAuth: {
 *       type: "apiKey", // this rules will be used for documentation of routes
 *       description: "Authorize ** /users/login **.",
 *       name: "x-auth-token",
 *       in: "header",
 *     },
 *   },
 *   input: ROUTES.z.MiddlewareInput({ // this schema will be used to address route request schema, in documentation
 *     headers: z.object({ "x-auth-token": z.string() }).passthrough(),
 *   }),
 *   output: ROUTES.z.MiddlewareOutput({ // same goes for route response schema
 *     options: z.object({
 *       decodedToken: z.object({
 *         userId: z.number(),
 *       }),
 *     }),
 *   }),
 *   async func({context, headers}) {
 *     const token =
 *       headers["x-auth-token"] ??
 *       headers["authorized"] ??
 *       headers["x-token"];
 *     const decoded = await decodeToken(token);
 *     if (!decoded) throw createHttpError.Unauthorized("Token not found / Token got Expired / Invalid Token!");
 *     return { options: { decodedToken: decoded } };
 *   },
 * });
 * ```
 */
export function build<
  I extends zInput,
  O extends zOutput,
  S,
  C extends FUNCTIONS.Context,
  W extends Wrappers<I, O, S, C>
>(_params: Params<I, O, S, C, W>): Build<I, O, S, C, W> {
  const params: _Params = {
    security: _params.security,
    tags: _params.tags,
    description: _params.description,
    summary: _params.summary,
  };
  const _build = FUNCTIONS.AsyncFunction.build({
    ..._params,
    func: ({ input, context }) => _params.func({ context, build, ...input }),
  });
  const build: Build<I, O, S, C, W> = Object.assign(
    ({
      context,
      ...input
    }: { context?: FUNCTIONS.Context | string | null } & I["_input"]) =>
      _build({ context, input }),
    _build,
    params,
    { endpoint: "middleware" } as const
  );
  return build;
}

import type { z } from "zod";
import { FUNCTIONS } from "@panth977/functions";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import type { SecuritySchemeObject } from "./zod-openapi.ts";

export type zInput = z.ZodObject<{
  headers?: z.AnyZodObject;
  query?: z.AnyZodObject;
}>;
export type zOutput = z.ZodObject<{
  headers?: z.AnyZodObject;
  options: z.ZodType;
}>;

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
> = _Params & FUNCTIONS.AsyncFunction.Params<I, O, S, C, W>;

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
> = _Params &
  FUNCTIONS.AsyncFunction.Build<I, O, S, C, W> & {
    endpoint: "middleware";
  };
export type inferAllOptions<Ms> = Ms extends [
  Build<
    any,
    z.ZodObject<{ options: infer O extends z.ZodType }>,
    any,
    any,
    any
  >,
  ...infer Bs
]
  ? z.infer<O> & inferAllOptions<Bs>
  : unknown;
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
 *   input: ROUTES.zMiddlewareInput({ // this schema will be used to address route request schema, in documentation
 *     headers: z.object({ "x-auth-token": z.string() }).passthrough(),
 *   }),
 *   output: ROUTES.zMiddlewareOutput({ // same goes for route response schema
 *     options: z.object({
 *       decodedToken: z.object({
 *         userId: z.number(),
 *       }),
 *     }),
 *   }),
 *   async func(context, input) {
 *     const token =
 *       input.headers["x-auth-token"] ??
 *       input.headers["authorized"] ??
 *       input.headers["x-token"];
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
  return Object.assign(FUNCTIONS.AsyncFunction.build(_params), params, {
    endpoint: "middleware",
  } as const);
}

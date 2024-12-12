import type { z } from "zod";
import { FUNCTIONS } from "@panth977/functions";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import type { SecuritySchemeObject } from "../zod-openapi.ts";

export type zInput = z.ZodObject<{
  headers?: z.AnyZodObject;
  query?: z.AnyZodObject;
}>;
export type zOutput = z.ZodObject<{ headers?: z.AnyZodObject }>;

export type ExtraParams = {
  tags?: ZodOpenApiOperationObject["tags"];
  summary?: ZodOpenApiOperationObject["summary"];
  description?: ZodOpenApiOperationObject["description"];
  security?: Record<string, SecuritySchemeObject>;
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
  I extends zInput,
  O extends zOutput,
  S extends Record<never, never>,
  C extends FUNCTIONS.Context,
  W extends Wrappers<I, O, S, C>
> = Omit<
  FUNCTIONS.AsyncFunction.Params<I, O, S, C, W>,
  "func" | "input" | "output"
> & {
  request: I;
  response: O;
  func: (
    arg: { context: C; build: Build<I, O, S, C, W> } & I["_output"]
  ) => Promise<O["_input"]>;
} & ExtraParams;

type _Params<I extends zInput = zInput, O extends zOutput = zOutput> = {
  request: I;
  response: O;
  endpoint: "middleware";
} & ExtraParams;

export type Build<
  I extends zInput = zInput,
  O extends zOutput = zOutput,
  S extends Record<never, never> = Record<never, never>,
  C extends FUNCTIONS.Context = FUNCTIONS.Context,
  W extends Wrappers<I, O, S, C> = Wrappers<I, O, S, C>
> = ((
  arg: { context: FUNCTIONS.Context } & I["_input"]
) => Promise<O["_output"]>) &
  Omit<
    Pick<
      FUNCTIONS.AsyncFunction.Build<I, O, S, C, W>,
      keyof FUNCTIONS.AsyncFunction.Build<I, O, S, C, W>
    >,
    ("input" | "output") | keyof _Params
  > &
  _Params<I, O>;

/**
 * A complete builder with localized information for documenting middleware & building implementation with strict input/output schema
 * @param params
 * @returns
 *
 * @example
 * ```ts
 * const DecodedStateKey = FUNCTIONS.DefaultContextState.CreateKey<ReturnType<typeof decodeToken>>({ label: 'Decoded',scope: 'global' });
 * const authorize = ROUTES.Middleware.build({
 *   security: {
 *     JwtAuth: {
 *       type: "apiKey", // this rules will be used for documentation of routes
 *       description: "Authorize ** /users/login **.",
 *       name: "x-auth-token",
 *       in: "header",
 *     },
 *   },
 *   request: ROUTES.z.MiddlewareRequest({ // this schema will be used to address route request schema, in documentation
 *     headers: z.object({ "x-auth-token": z.string() }).passthrough(),
 *   }),
 *   response: ROUTES.z.MiddlewareResponse({}),
 *   async func({context, headers}) {
 *     const token =
 *       headers["x-auth-token"] ??
 *       headers["authorized"] ??
 *       headers["x-token"];
 *     const decoded = await decodeToken(token);
 *     if (!decoded) throw createHttpError.Unauthorized("Token not found / Token got Expired / Invalid Token!");
 *     context.useState(DecodedStateKey).set(decoded);
 *     return {};
 *   },
 * });
 * ```
 */
export function build<
  I extends zInput,
  O extends zOutput,
  S extends Record<never, never>,
  C extends FUNCTIONS.Context,
  W extends Wrappers<I, O, S, C>
>(params: Params<I, O, S, C, W>): Build<I, O, S, C, W> {
  const extra: _Params<I, O> = {
    endpoint: "middleware",
    request: params.request,
    response: params.response,
    description: params.description,
    security: params.security,
    summary: params.summary,
    tags: params.tags,
  };
  const _build = FUNCTIONS.AsyncFunction.build({
    ...params,
    input: params.request,
    output: params.response,
    func: ({ input, context }: { context: C; input: I["_output"] }) =>
      params.func({ context, build, ...input }),
  });
  const build: Build<I, O, S, C, W> = Object.assign(
    ({ context, ...input }: { context: FUNCTIONS.Context } & I["_input"]) =>
      _build({ context, input }),
    _build,
    extra
  );
  return build;
}

import { z } from "zod/v4";
import { F } from "@panth977/functions";
import type { SecurityScheme } from "../zod-openapi.ts";

export type MiddlewareInput = z.ZodObject<{
  headers: z.ZodOptional<z.ZodAny> | z.ZodObject<any>;
  query: z.ZodOptional<z.ZodAny> | z.ZodObject<any>;
}>;
export type MiddlewareOutput = z.ZodObject<{
  headers: z.ZodOptional<z.ZodAny> | z.ZodObject<any>;
  opt: z.ZodType;
}>;
export type MiddlewareTypes = Extract<
  F.FuncTypes,
  "SyncFunc" | "AsyncFunc"
>;
export type FuncMiddlewareExported<
  I extends MiddlewareInput,
  O extends MiddlewareOutput,
  Type extends MiddlewareTypes,
> =
  & F.FuncExposed<I, O, Type>
  & {
    node: FuncMiddleware<I, O, Type>;
    output: z.infer<O>;
    input: z.infer<I>;
  };
/**
 * Base Middleware Node [Is one of node used in Context.node]
 */
export class FuncMiddleware<
  I extends MiddlewareInput,
  O extends MiddlewareOutput,
  Type extends MiddlewareTypes,
> extends F.Func<I, O, Type> {
  protected state: F.ContextState<z.infer<O["shape"]["opt"]>>;
  constructor(
    type: Type,
    input: I,
    output: O,
    wrappers: F.FuncWrapper<I, O, Type>[],
    implementation: F.FuncImplementation<I, O, Type>,
    ref: { namespace: string; name: string },
    readonly tags: string[],
    readonly summary: string,
    readonly description: string,
    readonly security: Record<string, SecurityScheme>,
  ) {
    super(type, input, output, wrappers, implementation, ref);
    this.state = F.ContextState.Cascade("Middleware", "create&read");
  }

  getOpt(context: F.Context): z.infer<O["shape"]["opt"]> | undefined {
    return this.state.of(context);
  }
  static setOpt<
    I extends MiddlewareInput,
    O extends MiddlewareOutput,
    Type extends MiddlewareTypes,
  >(
    context: F.Context,
    middleware: FuncMiddleware<I, O, Type>,
    opt: z.infer<O["shape"]["opt"]>,
  ): void {
    middleware.state.set(context, opt);
  }
  addTags(...tags: string[]) {
    this.tags.push(...tags);
  }
  addSecurity(schemeName: string, scheme: SecurityScheme) {
    this.security[schemeName] = scheme;
  }
  override create(): FuncMiddlewareExported<I, O, Type> {
    return super.create() as never;
  }
  get reqHeaders(): I["shape"]["headers"] {
    return this.input.shape.headers;
  }
  get reqQuery(): I["shape"]["query"] {
    return this.input.shape.query;
  }
  get resHeaders(): O["shape"]["headers"] {
    return this.output.shape.headers;
  }
  get contextOpt(): O["shape"]["opt"] {
    return this.output.shape.opt;
  }
}

/**
 * Base Middleware Builder, Use this to build a Func Node
 */
export class FuncMiddlewareBuilder<
  I extends MiddlewareInput,
  O extends MiddlewareOutput,
  Type extends MiddlewareTypes,
> extends F.FuncBuilder<I, O, Type> {
  constructor(
    type: Type,
    input: I,
    output: O,
    wrappers: F.FuncWrapper<I, O, Type>[],
    ref: { namespace: string; name: string },
    protected tags: string[],
    protected summary: string,
    protected description: string,
    protected security: Record<string, SecurityScheme>,
  ) {
    super(type, input, output, wrappers, ref);
  }
  $addTags(...tags: string[]): this {
    this.tags.push(...tags);
    return this;
  }
  $addSecurity(schemeName: string, scheme: SecurityScheme): this {
    this.security[schemeName] = scheme;
    return this;
  }
  $addSummary(summary: string): this {
    this.summary = summary;
    return this;
  }
  $addDescription(description: string): this {
    this.description = description;
    return this;
  }
  override $input = null as never;
  override $output = null as never;
  $reqHeaders<H extends z.ZodObject<any>>(headers: H): FuncMiddlewareBuilder<
    z.ZodObject<Omit<I["shape"], "headers"> & { headers: H }>,
    O,
    Type
  > {
    this.input = z.object({ ...this.input.shape, headers }) as never;
    return this as never;
  }
  $reqQuery<Q extends z.ZodObject<any>>(query: Q): FuncMiddlewareBuilder<
    z.ZodObject<Omit<I["shape"], "query"> & { query: Q }>,
    O,
    Type
  > {
    this.input = z.object({ ...this.input.shape, query }) as never;
    return this as never;
  }
  $resHeaders<H extends z.ZodObject<any>>(headers: H): FuncMiddlewareBuilder<
    I,
    z.ZodObject<Omit<O["shape"], "headers"> & { headers: H }>,
    Type
  > {
    this.output = z.object({ ...this.output.shape, headers }) as never;
    return this as never;
  }
  $contextOpt<Opt extends z.ZodType>(opt: Opt): FuncMiddlewareBuilder<
    I,
    z.ZodObject<Omit<O["shape"], "opt"> & { opt: Opt }>,
    Type
  > {
    this.output = z.object({ ...this.output.shape, opt }) as never;
    return this as never;
  }
  override $wrap(
    wrap: F.FuncWrapper<I, O, Type>,
  ): FuncMiddlewareBuilder<I, O, Type> {
    return super.$wrap(wrap) as never;
  }
  override $ref(
    ref: { namespace: string; name: string },
  ): FuncMiddlewareBuilder<I, O, Type> {
    return super.$ref(ref) as never;
  }
  override $(
    implementation: F.FuncImplementation<I, O, Type>,
  ): FuncMiddlewareExported<I, O, Type> {
    return new FuncMiddleware(
      this.type,
      this.input,
      this.output,
      this.wrappers,
      implementation,
      this.ref,
      this.tags,
      this.summary,
      this.description,
      this.security,
    ).create();
  }
}

const emptyInput: z.ZodObject<{
  headers: z.ZodOptional<z.ZodAny>;
  query: z.ZodOptional<z.ZodAny>;
}, z.core.$strip> = z.object({
  headers: z.any().optional(),
  query: z.any().optional(),
});
const emptyOutput: z.ZodObject<{
  headers: z.ZodOptional<z.ZodAny>;
  opt: z.ZodOptional<z.ZodAny>;
}, z.core.$strip> = z.object({
  headers: z.any().optional(),
  opt: z.any().optional(),
});

/**
 * Base Middleware Builder for synchronous functions
 * @example
 * ```ts
 * const jwtDecodeMiddleware = syncFuncMiddleware()
 *   .$addTags("Authorized-Routes")
 *   .$addSecurity("Authorization", {
 *     type: "apiKey",
 *     description: "Authorize using **Bearer [web_access_token]**.",
 *     name: "Authorization",
 *     in: "header",
 *   })
 *   .$reqHeaders(z.object({ "x-auth": z.string().startsWith("Bearer ") }))
 *   .$contextOpt(z.object({ uid: z.string(), email: z.string() }))
 *   .$wrap(new F.SyncFuncParser({ output: false }))
 *   .$((context, input) => {
 *     const token = input.headers["x-auth"];
 *     const decoded = jwt.decode(token, process.env.JWT_SECRET);
 *     return { opt: decoded };
 *   });
 * ```
 */
export function syncFuncMiddleware(): FuncMiddlewareBuilder<
  typeof emptyInput,
  typeof emptyOutput,
  "SyncFunc"
> {
  return new FuncMiddlewareBuilder(
    "SyncFunc",
    emptyInput,
    emptyOutput,
    [],
    { namespace: "Unknown", name: "Unknown" },
    [],
    "",
    "",
    {},
  );
}

/**
 * Base Middleware Builder for asynchronous functions
 * @example
 * ```ts
 * const rateLimitHttp = asyncFuncMiddleware()
 *   .$wrap(new F.WFTimer())
 *   .$((context, _) => {
 *     const [port, promise] = context.node.createPort();
 *     const opt = jwtDecodeHttp.node.getOpt(context);
 *     if (!opt) {
 *       port.throw(HttpError.Unauthorized("JWT not provided!"));
 *       return;
 *     }
 *     const job = redis.incr(`RateLimit:${opt.uid}`, (result, error) => {
 *       if (error) {
 *         port.throw(HttpError.Internal());
 *         return;
 *       }
 *       if (+result > 200) {
 *         port.throw(HttpError.Forbidden("Rate limit exceeded!"));
 *         return;
 *       }
 *       if (result === 1) {
 *         redis.expire(`RateLimit:${opt.uid}`, 60, () => {});
 *       }
 *       port.return({});
 *     });
 *     port.oncancel(redis.cancel.bind(redis, job));
 *     return promise;
 *   });
 * ```
 */
export function asyncFuncMiddleware(): FuncMiddlewareBuilder<
  typeof emptyInput,
  typeof emptyOutput,
  "AsyncFunc"
> {
  return new FuncMiddlewareBuilder(
    "AsyncFunc",
    emptyInput,
    emptyOutput,
    [],
    { namespace: "Unknown", name: "Unknown" },
    [],
    "",
    "",
    {},
  );
}

import { z } from "zod/v4";
import { F } from "@panth977/functions";
import type { HttpMethod, SecurityScheme } from "../zod-openapi.ts";
import type {
  FuncMiddlewareExported,
  MiddlewareInput,
  MiddlewareOutput,
  MiddlewareTypes,
} from "../exports.ts";

export type HttpInput = z.ZodObject<{
  path: z.ZodOptional<z.ZodAny> | z.ZodObject<any>;
  headers: z.ZodOptional<z.ZodAny> | z.ZodObject<any>;
  query: z.ZodOptional<z.ZodAny> | z.ZodObject<any>;
  body: z.ZodType;
}>;
export type HttpOutput = z.ZodObject<{
  headers: z.ZodOptional<z.ZodAny> | z.ZodObject<any>;
  body: z.ZodType;
}>;
export type HttpTypes =
  | F.FunctionTypes["SyncFunc"]
  | F.FunctionTypes["AsyncFunc"]
  | F.FunctionTypes["AsyncCb"]
  | F.FunctionTypes["AsyncCancelableCb"];
export type FuncHttpExported<
  I extends HttpInput,
  O extends HttpOutput,
  D extends F.FuncDeclaration,
  Type extends HttpTypes,
> =
  & F.FuncExposed<I, O, Type>
  & { node: FuncHttp<I, O, D, Type> };
/**
 * Base Http Node [Is one of node used in Context.node]
 */
export class FuncHttp<
  I extends HttpInput,
  O extends HttpOutput,
  D extends F.FuncDeclaration,
  Type extends HttpTypes,
> extends F.Func<I, O, D, Type> {
  readonly middlewares: FuncMiddlewareExported<
    MiddlewareInput,
    MiddlewareOutput,
    F.FuncDeclaration,
    MiddlewareTypes
  >[];
  readonly methods: HttpMethod[];
  readonly paths: string[];
  readonly tags: string[];
  readonly summary: string;
  readonly description: string;
  readonly security: Record<string, SecurityScheme>;
  readonly reqMediaTypes: string;
  readonly resMediaTypes: string;
  readonly docsOrder: number;
  readonly showIndocs: boolean;
  constructor(
    middlewares: FuncMiddlewareExported<
      MiddlewareInput,
      MiddlewareOutput,
      F.FuncDeclaration,
      MiddlewareTypes
    >[],
    methods: HttpMethod[],
    paths: string[],
    type: Type,
    input: I,
    output: O,
    declaration: D,
    wrappers: F.FuncWrapper<I, O, D, Type>[],
    implementation: F.FuncImplementation<I, O, D, Type>,
    ref: { namespace: string; name: string },
    tags: string[],
    summary: string,
    description: string,
    security: Record<string, SecurityScheme>,
    reqMediaTypes: string,
    resMediaTypes: string,
    docsOrder: number,
    showIndocs: boolean,
  ) {
    super(type, input, output, declaration, wrappers, implementation, ref);
    this.middlewares = middlewares;
    this.methods = methods;
    this.paths = paths;
    this.tags = tags;
    this.summary = summary;
    this.description = description;
    this.security = security;
    this.reqMediaTypes = reqMediaTypes;
    this.resMediaTypes = resMediaTypes;
    this.docsOrder = docsOrder;
    this.showIndocs = showIndocs;
    Object.freeze(middlewares);
  }
  addTags(...tags: string[]) {
    this.tags.push(...tags);
  }
  addSecurity(schemeName: string, scheme: SecurityScheme) {
    this.security[schemeName] = scheme;
  }
  override create(): FuncHttpExported<I, O, D, Type> {
    return super.create() as never;
  }
  get reqPath(): I["shape"]["path"] {
    return this.input.shape.path;
  }
  get reqHeaders(): I["shape"]["headers"] {
    return this.input.shape.headers;
  }
  get reqQuery(): I["shape"]["query"] {
    return this.input.shape.query;
  }
  get reqBody(): I["shape"]["body"] {
    return this.input.shape.body;
  }
  get resHeaders(): O["shape"]["headers"] {
    return this.output.shape.headers;
  }
  get resBody(): O["shape"]["body"] {
    return this.output.shape.body;
  }
}

/**
 * Base Http Builder, Use this to build a Func Node
 */
export class FuncHttpBuilder<
  I extends HttpInput,
  O extends HttpOutput,
  D extends F.FuncDeclaration,
  Type extends HttpTypes,
> extends F.FuncBuilder<I, O, D, Type> {
  protected middlewares: FuncMiddlewareExported<
    MiddlewareInput,
    MiddlewareOutput,
    F.FuncDeclaration,
    MiddlewareTypes
  >[];
  protected methods: HttpMethod[];
  protected paths: string[];
  protected tags: string[];
  protected summary: string;
  protected description: string;
  protected security: Record<string, SecurityScheme>;
  protected reqMediaTypes: string;
  protected resMediaTypes: string;
  protected docsOrder: number;
  protected showIndocs: boolean;
  constructor(
    middlewares: FuncMiddlewareExported<
      MiddlewareInput,
      MiddlewareOutput,
      F.FuncDeclaration,
      MiddlewareTypes
    >[],
    methods: HttpMethod[],
    paths: string[],
    type: Type,
    input: I,
    output: O,
    declaration: D,
    wrappers: F.FuncWrapper<I, O, D, Type>[],
    ref: { namespace: string; name: string },
    tags: string[],
    summary: string,
    description: string,
    security: Record<string, SecurityScheme>,
    reqMediaTypes: string,
    resMediaTypes: string,
    docsOrder: number,
    showIndocs: boolean,
  ) {
    super(type, input, output, declaration, wrappers, ref);
    this.middlewares = middlewares;
    this.methods = methods;
    this.paths = paths;
    this.tags = tags;
    this.summary = summary;
    this.description = description;
    this.security = security;
    this.reqMediaTypes = reqMediaTypes;
    this.resMediaTypes = resMediaTypes;
    this.docsOrder = docsOrder;
    this.showIndocs = showIndocs;
  }
  $middlewares<
    I extends MiddlewareInput,
    O extends MiddlewareOutput,
    D extends F.FuncDeclaration,
    Type extends MiddlewareTypes,
  >(middleware: FuncMiddlewareExported<I, O, D, Type>): this {
    this.middlewares.push(middleware as never);
    return this;
  }
  $docsOrder(order: number): this {
    this.docsOrder = order;
    return this;
  }
  $hideFromDocs(): this {
    this.showIndocs = false;
    return this;
  }
  $alliesMethods(...methods: HttpMethod[]): this {
    this.methods.push(...methods);
    return this;
  }
  $alliesPaths(...paths: string[]): this {
    this.paths.push(...paths);
    return this;
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

  override $input(_: never): never {
    throw new Error("Method not implemented.");
  }
  $reqPath<P extends z.ZodObject<any>>(path: P): FuncHttpBuilder<
    z.ZodObject<Omit<I["shape"], "path"> & { path: P }>,
    O,
    D,
    Type
  > {
    this.input = z.object({ ...this.input.shape, path }) as never;
    return this as never;
  }
  $reqHeaders<H extends z.ZodObject<any>>(headers: H): FuncHttpBuilder<
    z.ZodObject<Omit<I["shape"], "headers"> & { headers: H }>,
    O,
    D,
    Type
  > {
    this.input = z.object({ ...this.input.shape, headers }) as never;
    return this as never;
  }
  $reqQuery<Q extends z.ZodObject<any>>(query: Q): FuncHttpBuilder<
    z.ZodObject<Omit<I["shape"], "query"> & { query: Q }>,
    O,
    D,
    Type
  > {
    this.input = z.object({ ...this.input.shape, query }) as never;
    return this as never;
  }
  $reqBody<B extends z.ZodType>(body: B): FuncHttpBuilder<
    z.ZodObject<Omit<I["shape"], "body"> & { body: B }>,
    O,
    D,
    Type
  > {
    this.input = z.object({ ...this.input.shape, body }) as never;
    return this as never;
  }
  $reqMediaType(mt: string): FuncHttpBuilder<I, O, D, Type> {
    this.reqMediaTypes = mt;
    return this as never;
  }
  override $output(_: never): never {
    throw new Error("Method not implemented.");
  }
  $resHeaders<H extends z.ZodObject<any>>(headers: H): FuncHttpBuilder<
    I,
    z.ZodObject<Omit<O["shape"], "headers"> & { headers: H }>,
    D,
    Type
  > {
    this.output = z.object({ ...this.output.shape, headers }) as never;
    return this as never;
  }
  $resBody<B extends z.ZodType>(body: B): FuncHttpBuilder<
    I,
    z.ZodObject<Omit<O["shape"], "body"> & { body: B }>,
    D,
    Type
  > {
    this.output = z.object({ ...this.output.shape, body }) as never;
    return this as never;
  }
  $resMediaType(mt: string): FuncHttpBuilder<I, O, D, Type> {
    this.resMediaTypes = mt;
    return this as never;
  }
  override $wrap(
    wrap: F.FuncWrapper<I, O, D, Type>,
  ): FuncHttpBuilder<I, O, D, Type> {
    return super.$wrap(wrap) as never;
  }
  override $declare<$D extends F.FuncDeclaration>(
    dec: $D,
  ): FuncHttpBuilder<I, O, $D & D, Type> {
    return super.$declare(dec) as never;
  }
  override $ref(
    ref: { namespace: string; name: string },
  ): FuncHttpBuilder<I, O, D, Type> {
    return super.$ref(ref) as never;
  }
  override $(
    implementation: F.FuncImplementation<I, O, D, Type>,
  ): FuncHttpExported<I, O, D, Type> {
    if (this.methods.length === 0) {
      throw new Error("No methods specified");
    }
    if (this.paths.length === 0) {
      throw new Error("No paths specified");
    }
    return new FuncHttp(
      this.middlewares,
      this.methods,
      this.paths,
      this.type,
      this.input,
      this.output,
      this.declaration,
      this.wrappers,
      implementation,
      this.ref,
      this.tags,
      this.summary,
      this.description,
      this.security,
      this.reqMediaTypes,
      this.resMediaTypes,
      this.docsOrder,
      this.showIndocs,
    ).create();
  }
}

export const emptyHttpInput: z.ZodObject<{
  path: z.ZodOptional<z.ZodAny>;
  headers: z.ZodOptional<z.ZodAny>;
  query: z.ZodOptional<z.ZodAny>;
  body: z.ZodOptional<z.ZodAny>;
}, z.core.$strip> = z.object({
  path: z.any().optional(),
  headers: z.any().optional(),
  query: z.any().optional(),
  body: z.any().optional(),
});
export const emptyHttpOutput: z.ZodObject<{
  headers: z.ZodOptional<z.ZodAny>;
  body: z.ZodOptional<z.ZodAny>;
}, z.core.$strip> = z.object({
  headers: z.any().optional(),
  body: z.any().optional(),
});

/**
 * Base Http Builder for synchronous functions
 * @example
 * ```ts
 * const jwtDecodeHttp = syncFuncHttp()
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
export function syncFuncHttp(method: HttpMethod, path: string): FuncHttpBuilder<
  typeof emptyHttpInput,
  typeof emptyHttpOutput,
  Record<never, never>,
  F.FunctionTypes["SyncFunc"]
> {
  return new FuncHttpBuilder(
    [],
    [method],
    [path],
    F.FunctionTypes.SyncFunc,
    emptyHttpInput,
    emptyHttpOutput,
    {},
    [],
    { namespace: "Unknown", name: "Unknown" },
    [],
    "",
    "",
    {},
    "",
    "",
    Number.MAX_SAFE_INTEGER,
    true,
  );
}

/**
 * Base Http Builder for asynchronous functions
 * @example
 * ```ts
 * const rateLimitHttp = asyncFuncHttp()
 *   .$wrap(new F.AsyncFuncTime())
 *   .$wrap(new F.AsyncFuncMemo())
 *   .$(async (context, _) => {
 *     const opt = jwtDecodeHttp.node.getOpt(context);
 *     if (!opt) throw HttpError.Unauthorized("JWT not provided!");
 *     const result = await redis.incr(`RateLimit:${opt.uid}`);
 *     if (+result > 200) throw HttpError.Forbidden("Rate limit exceeded!");
 *     if (result === 1) await redis.expire(`RateLimit:${opt.uid}`, 60);
 *     return {};
 *   });
 * ```
 */
export function asyncFuncHttp(
  method: HttpMethod,
  path: string,
): FuncHttpBuilder<
  typeof emptyHttpInput,
  typeof emptyHttpOutput,
  Record<never, never>,
  F.FunctionTypes["AsyncFunc"]
> {
  return new FuncHttpBuilder(
    [],
    [method],
    [path],
    F.FunctionTypes.AsyncFunc,
    emptyHttpInput,
    emptyHttpOutput,
    {},
    [],
    { namespace: "Unknown", name: "Unknown" },
    [],
    "",
    "",
    {},
    "",
    "",
    Number.MAX_SAFE_INTEGER,
    true,
  );
}

/**
 * Base Http Builder for asynchronous functions
 * @example
 * ```ts
 * const rateLimitHttp = asyncCbHttp()
 *   .$wrap(new F.AsyncCbTime())
 *   .$wrap(new F.AsyncCbMemo())
 *   .$((context, _, callback) => {
 *     const opt = jwtDecodeHttp.node.getOpt(context);
 *     if (!opt) {
 *       callback({ t: "Error", e: HttpError.Unauthorized("JWT not provided!") });
 *       return;
 *     }
 *     redis.incr(`RateLimit:${opt.uid}`, (result, error) => {
 *       if (error) {
 *         callback({t: "Error", e: HttpError.Internal()});
 *         return;
 *       }
 *       if (+result > 200) {
 *         callback({t: "Error",e: HttpError.Forbidden("Rate limit exceeded!"),});
 *         return;
 *       }
 *       if (result === 1) {
 *         redis.expire(`RateLimit:${opt.uid}`, 60, () => {});
 *       }
 *       callback({ t: "Data", d: {} });
 *     });
 *   });
 * ```
 */
export function asyncCbHttp(method: HttpMethod, path: string): FuncHttpBuilder<
  typeof emptyHttpInput,
  typeof emptyHttpOutput,
  Record<never, never>,
  F.FunctionTypes["AsyncCb"]
> {
  return new FuncHttpBuilder(
    [],
    [method],
    [path],
    F.FunctionTypes.AsyncCb,
    emptyHttpInput,
    emptyHttpOutput,
    {},
    [],
    { namespace: "Unknown", name: "Unknown" },
    [],
    "",
    "",
    {},
    "",
    "",
    Number.MAX_SAFE_INTEGER,
    true,
  );
}

/**
 * Base Http Builder for asynchronous functions
 * @example
 * ```ts
 * const rateLimitHttp = asyncCbHttp()
 *   .$wrap(new F.AsyncCbCancelableTime())
 *   .$((context, _, callback) => {
 *     const opt = jwtDecodeHttp.node.getOpt(context);
 *     if (!opt) {
 *       callback({ t: "Error", e: HttpError.Unauthorized("JWT not provided!") });
 *       return;
 *     }
 *     function cancel() {
 *       redis.cancel(job);
 *     }
 *     let job;
 *     job = redis.incr(`RateLimit:${opt.uid}`, (result, error) => {
 *       if (error) {
 *         callback({t: "Error", e: HttpError.Internal()});
 *         return;
 *       }
 *       if (+result > 200) {
 *         callback({t: "Error",e: HttpError.Forbidden("Rate limit exceeded!"),});
 *         return;
 *       }
 *       if (result === 1) {
 *         job = redis.expire(`RateLimit:${opt.uid}`, 60, () => {});
 *       }
 *       callback({ t: "Data", d: {} });
 *     });
 *     return cancel;
 *   });
 *
 * ```
 */
export function asyncCancelableCbHttp(
  method: HttpMethod,
  path: string,
): FuncHttpBuilder<
  typeof emptyHttpInput,
  typeof emptyHttpOutput,
  Record<never, never>,
  F.FunctionTypes["AsyncCancelableCb"]
> {
  return new FuncHttpBuilder(
    [],
    [method],
    [path],
    F.FunctionTypes.AsyncCancelableCb,
    emptyHttpInput,
    emptyHttpOutput,
    {},
    [],
    { namespace: "Unknown", name: "Unknown" },
    [],
    "",
    "",
    {},
    "",
    "",
    Number.MAX_SAFE_INTEGER,
    true,
  );
}

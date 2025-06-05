import { z } from "zod/v4";
import { F } from "@panth977/functions";
import type { HttpMethod, SecurityScheme } from "../zod-openapi.ts";
import type { FuncMiddlewareExported } from "../exports.ts";
import type {
  MiddlewareInput,
  MiddlewareOutput,
  MiddlewareTypes,
} from "./index.ts";

export type SseMethod = Extract<HttpMethod, "get">;
export type SseInput = z.ZodObject<{
  path: z.ZodOptional<z.ZodAny> | z.ZodObject<any>;
  query: z.ZodOptional<z.ZodAny> | z.ZodObject<any>;
}>;
export type SseOutput = z.ZodString;
export type SseTypes =
  | F.FunctionTypes["SubsCb"]
  | F.FunctionTypes["SubsCancelableCb"];
export type FuncSseExported<
  I extends SseInput,
  O extends SseOutput,
  D extends F.FuncDeclaration,
  Type extends SseTypes,
> =
  & F.FuncExposed<I, O, Type>
  & { node: FuncSse<I, O, D, Type> };
/**
 * Base Sse Node [Is one of node used in Context.node]
 */
export class FuncSse<
  I extends SseInput,
  O extends SseOutput,
  D extends F.FuncDeclaration,
  Type extends SseTypes,
> extends F.Func<I, O, D, Type> {
  readonly middlewares: FuncMiddlewareExported<
    MiddlewareInput,
    MiddlewareOutput,
    F.FuncDeclaration,
    MiddlewareTypes
  >[];
  readonly methods: SseMethod[];
  readonly paths: string[];
  readonly tags: string[];
  readonly summary: string;
  readonly description: string;
  readonly security: Record<string, SecurityScheme>;
  readonly docsOrder: number;
  readonly showIndocs: boolean;
  constructor(
    middlewares: FuncMiddlewareExported<
      MiddlewareInput,
      MiddlewareOutput,
      F.FuncDeclaration,
      MiddlewareTypes
    >[],
    methods: SseMethod[],
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
    this.docsOrder = docsOrder;
    this.showIndocs = showIndocs;
    Object.freeze(this.middlewares);
  }
  addTags(...tags: string[]) {
    this.tags.push(...tags);
  }
  addSecurity(schemeName: string, scheme: SecurityScheme) {
    this.security[schemeName] = scheme;
  }
  override create(): FuncSseExported<I, O, D, Type> {
    return super.create() as never;
  }
  get reqPath(): I["shape"]["path"] {
    return this.input.shape.path;
  }
  get reqQuery(): I["shape"]["query"] {
    return this.input.shape.query;
  }
  get resEvent(): O {
    return this.output;
  }
}

/**
 * Base Sse Builder, Use this to build a Func Node
 */
export class FuncSseBuilder<
  I extends SseInput,
  O extends SseOutput,
  D extends F.FuncDeclaration,
  Type extends SseTypes,
> extends F.FuncBuilder<I, O, D, Type> {
  protected middlewares: FuncMiddlewareExported<
    MiddlewareInput,
    MiddlewareOutput,
    F.FuncDeclaration,
    MiddlewareTypes
  >[];
  protected methods: SseMethod[];
  protected paths: string[];
  protected tags: string[];
  protected summary: string;
  protected description: string;
  protected security: Record<string, SecurityScheme>;
  protected docsOrder: number;
  protected showIndocs: boolean;
  constructor(
    middlewares: FuncMiddlewareExported<
      MiddlewareInput,
      MiddlewareOutput,
      F.FuncDeclaration,
      MiddlewareTypes
    >[],
    methods: SseMethod[],
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
  $alliesMethods(...methods: SseMethod[]): this {
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
  $reqPath<P extends z.ZodObject<any>>(path: P): FuncSseBuilder<
    z.ZodObject<Omit<I["shape"], "path"> & { path: P }>,
    O,
    D,
    Type
  > {
    this.input = z.object({ ...this.input.shape, path }) as never;
    return this as never;
  }
  $reqQuery<Q extends z.ZodObject<any>>(query: Q): FuncSseBuilder<
    z.ZodObject<Omit<I["shape"], "query"> & { query: Q }>,
    O,
    D,
    Type
  > {
    this.input = z.object({ ...this.input.shape, query }) as never;
    return this as never;
  }
  override $output(_: never): never {
    throw new Error("Method not implemented.");
  }
  $resEvent<E extends z.ZodString>(event: E): FuncSseBuilder<
    I,
    E,
    D,
    Type
  > {
    this.output = event as never;
    return this as never;
  }
  override $wrap(
    wrap: F.FuncWrapper<I, O, D, Type>,
  ): FuncSseBuilder<I, O, D, Type> {
    return super.$wrap(wrap) as never;
  }
  override $declare<$D extends F.FuncDeclaration>(
    dec: $D,
  ): FuncSseBuilder<I, O, $D & D, Type> {
    return super.$declare(dec) as never;
  }
  override $ref(
    ref: { namespace: string; name: string },
  ): FuncSseBuilder<I, O, D, Type> {
    return super.$ref(ref) as never;
  }
  override $(
    implementation: F.FuncImplementation<I, O, D, Type>,
  ): FuncSseExported<I, O, D, Type> {
    if (this.methods.length === 0) {
      throw new Error("No methods specified");
    }
    if (this.paths.length === 0) {
      throw new Error("No paths specified");
    }
    return new FuncSse(
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
      this.docsOrder,
      this.showIndocs,
    ).create();
  }
}

export const emptySseInput: z.ZodObject<{
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
export const emptySseOutput: z.ZodString = z.string();

/**
 * Base Sse Builder for synchronous functions
 * ```ts
 * const jwtDecodeSse = syncFuncSse()
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
export function subsCbSse(method: SseMethod, path: string): FuncSseBuilder<
  typeof emptySseInput,
  typeof emptySseOutput,
  Record<never, never>,
  F.FunctionTypes["SubsCb"]
> {
  return new FuncSseBuilder(
    [],
    [method],
    [path],
    F.FunctionTypes.SubsCb,
    emptySseInput,
    emptySseOutput,
    {},
    [],
    { namespace: "Unknown", name: "Unknown" },
    [],
    "",
    "",
    {},
    Number.MAX_SAFE_INTEGER,
    true,
  );
}

/**
 * Base Sse Builder for asynchronous functions
 * ```ts
 * const rateLimitSse = asyncFuncSse()
 *   .$wrap(new F.AsyncFuncTime())
 *   .$wrap(new F.AsyncFuncMemo())
 *   .$(async (context, _) => {
 *     const opt = jwtDecodeSse.node.getOpt(context);
 *     if (!opt) throw SseError.Unauthorized("JWT not provided!");
 *     const result = await redis.incr(`RateLimit:${opt.uid}`);
 *     if (+result > 200) throw SseError.Forbidden("Rate limit exceeded!");
 *     if (result === 1) await redis.expire(`RateLimit:${opt.uid}`, 60);
 *     return {};
 *   });
 * ```
 */
export function subsCancelableCbSse(
  method: SseMethod,
  path: string,
): FuncSseBuilder<
  typeof emptySseInput,
  typeof emptySseOutput,
  Record<never, never>,
  F.FunctionTypes["SubsCancelableCb"]
> {
  return new FuncSseBuilder(
    [],
    [method],
    [path],
    F.FunctionTypes.SubsCancelableCb,
    emptySseInput,
    emptySseOutput,
    {},
    [],
    { namespace: "Unknown", name: "Unknown" },
    [],
    "",
    "",
    {},
    Number.MAX_SAFE_INTEGER,
    true,
  );
}

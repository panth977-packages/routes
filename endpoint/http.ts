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
  path:
    | z.ZodOptional<z.ZodAny>
    | z.ZodObject<any>
    | z.ZodArray<any>
    | z.ZodTuple<any, any>;
  headers: z.ZodOptional<z.ZodAny> | z.ZodObject<any>;
  query: z.ZodOptional<z.ZodAny> | z.ZodObject<any>;
  body: z.ZodType;
}>;
export type HttpOutput = z.ZodObject<{
  headers: z.ZodOptional<z.ZodAny> | z.ZodObject<any>;
  body: z.ZodType;
}>;
export type HttpTypes = Extract<F.FuncTypes, "SyncFunc" | "AsyncFunc">;
export type FuncHttpExported<
  I extends HttpInput,
  O extends HttpOutput,
  D extends F.FuncDeclaration,
  Type extends HttpTypes,
> = F.FuncExposed<I, O, Type> & {
  node: FuncHttp<I, O, D, Type>;
  output: z.infer<O>;
  input: z.infer<I>;
};
/**
 * Base Http Node [Is one of node used in Context.node]
 */
export class FuncHttp<
  I extends HttpInput,
  O extends HttpOutput,
  D extends F.FuncDeclaration,
  Type extends HttpTypes,
> extends F.Func<I, O, D, Type> {
  constructor(
    readonly middlewares: FuncMiddlewareExported<
      MiddlewareInput,
      MiddlewareOutput,
      F.FuncDeclaration,
      MiddlewareTypes
    >[],
    readonly methods: HttpMethod[],
    readonly paths: string[],
    type: Type,
    input: I,
    output: O,
    declaration: D,
    wrappers: F.FuncWrapper<I, O, D, Type>[],
    implementation: F.FuncImplementation<I, O, D, Type>,
    ref: { namespace: string; name: string },
    readonly tags: string[],
    readonly summary: string,
    readonly description: string,
    readonly security: Record<string, SecurityScheme>,
    readonly reqMediaTypes: string,
    readonly resMediaTypes: string,
    readonly docsOrder: number,
    readonly showIndocs: boolean,
  ) {
    super(type, input, output, declaration, wrappers, implementation, ref);
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
export type HttpBuildTypes = Exclude<F.BuilderType, "StreamFunc">;
/**
 * Base Http Builder, Use this to build a Func Node
 */
export class FuncHttpBuilder<
  I extends HttpInput,
  O extends HttpOutput,
  D extends F.FuncDeclaration,
  Type extends HttpBuildTypes,
> extends F.FuncBuilder<I, O, D, Type> {
  constructor(
    protected middlewares: FuncMiddlewareExported<
      MiddlewareInput,
      MiddlewareOutput,
      F.FuncDeclaration,
      MiddlewareTypes
    >[],
    protected methods: HttpMethod[],
    protected paths: string[],
    type: Type,
    input: I,
    output: O,
    declaration: D,
    wrappers: F.FuncWrapper<I, O, D, F.BuilderToFuncType<Type>>[],
    ref: { namespace: string; name: string },
    protected tags: string[],
    protected summary: string,
    protected description: string,
    protected security: Record<string, SecurityScheme>,
    protected reqMediaTypes: string,
    protected resMediaTypes: string,
    protected docsOrder: number,
    protected showIndocs: boolean,
  ) {
    super(type, input, output, declaration, wrappers, ref);
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
  override $input = null as never;
  override $output = null as never;
  $reqPath<P extends z.ZodObject<any> | z.ZodArray<any> | z.ZodTuple<any, any>>(
    path: P,
  ): FuncHttpBuilder<
    z.ZodObject<Omit<I["shape"], "path"> & { path: P }>,
    O,
    D,
    Type
  > {
    this.input = z.object({ ...this.input.shape, path }) as never;
    return this as never;
  }
  $reqHeaders<H extends z.ZodObject<any>>(
    headers: H,
  ): FuncHttpBuilder<
    z.ZodObject<Omit<I["shape"], "headers"> & { headers: H }>,
    O,
    D,
    Type
  > {
    this.input = z.object({ ...this.input.shape, headers }) as never;
    return this as never;
  }
  $reqQuery<Q extends z.ZodObject<any>>(
    query: Q,
  ): FuncHttpBuilder<
    z.ZodObject<Omit<I["shape"], "query"> & { query: Q }>,
    O,
    D,
    Type
  > {
    this.input = z.object({ ...this.input.shape, query }) as never;
    return this as never;
  }
  $reqBody<B extends z.ZodType>(
    body: B,
  ): FuncHttpBuilder<
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
  $resHeaders<H extends z.ZodObject<any>>(
    headers: H,
  ): FuncHttpBuilder<
    I,
    z.ZodObject<Omit<O["shape"], "headers"> & { headers: H }>,
    D,
    Type
  > {
    this.output = z.object({ ...this.output.shape, headers }) as never;
    return this as never;
  }
  $resBody<B extends z.ZodType>(
    body: B,
  ): FuncHttpBuilder<
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
    wrap: F.FuncWrapper<I, O, D, F.BuilderToFuncType<Type>>,
  ): FuncHttpBuilder<I, O, D, Type> {
    return super.$wrap(wrap) as never;
  }
  override $declare<$D extends F.FuncDeclaration>(
    dec: $D,
  ): FuncHttpBuilder<I, O, $D & D, Type> {
    return super.$declare(dec) as never;
  }
  override $ref(ref: {
    namespace: string;
    name: string;
  }): FuncHttpBuilder<I, O, D, Type> {
    return super.$ref(ref) as never;
  }
  override $(
    implementation: F.BuilderImplementation<I, O, D, Type>,
  ): FuncHttpExported<I, O, D, F.BuilderToFuncType<Type>> {
    if (this.methods.length === 0) {
      throw new Error("No methods specified");
    }
    if (this.paths.length === 0) {
      throw new Error("No paths specified");
    }
    const [type, funcImp] = this.toFuncTypes(implementation);
    return new FuncHttp(
      this.middlewares,
      this.methods,
      this.paths,
      type,
      this.input,
      this.output,
      this.declaration,
      this.wrappers,
      funcImp,
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

export const emptyHttpInput: z.ZodObject<
  {
    path: z.ZodOptional<z.ZodAny>;
    headers: z.ZodOptional<z.ZodAny>;
    query: z.ZodOptional<z.ZodAny>;
    body: z.ZodOptional<z.ZodAny>;
  },
  z.core.$strip
> = z.object({
  path: z.any().optional(),
  headers: z.any().optional(),
  query: z.any().optional(),
  body: z.any().optional(),
});
export const emptyHttpOutput: z.ZodObject<
  {
    headers: z.ZodOptional<z.ZodAny>;
    body: z.ZodOptional<z.ZodAny>;
  },
  z.core.$strip
> = z.object({
  headers: z.any().optional(),
  body: z.any().optional(),
});

/**
 * Base Http Builder for synchronous functions
 * @example
 * ```ts
 * const getConfig = syncFuncHttp('get', '/config')
 *   .$resBody(z.object({...}))
 *   .$wrap(new F.WFMemo())
 *   .$wrap(new F.WFParser(false, true))
 *   .$((context, _) => ({ body: fs.readFileSync('./public_config.json') }));
 * ```
 */
export function syncFuncHttp(
  method: HttpMethod,
  path: string,
): FuncHttpBuilder<
  typeof emptyHttpInput,
  typeof emptyHttpOutput,
  Record<never, never>,
  "SyncFunc"
> {
  return new FuncHttpBuilder(
    [],
    [method],
    [path],
    "SyncFunc",
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
 * const patchProfile = asyncLikeHttp("patch", "/profile/{userId}")
 *   .$wrap(new F.WFTimer())
 *   .$reqPath(z.object({ userId: z.string() }))
 *   .$reqBody(z.object({ name: z.string() }))
 *   .$resBody(z.string())
 *   .$(async (context, {body: {name}, path: {userId}}) => {
 *     await pg.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, userId]);
 *     return { body: "Success" };
 *   });
 * ```
 */
export function asyncLikeHttp(
  method: HttpMethod,
  path: string,
): FuncHttpBuilder<
  typeof emptyHttpInput,
  typeof emptyHttpOutput,
  Record<never, never>,
  "AsyncLike"
> {
  return new FuncHttpBuilder(
    [],
    [method],
    [path],
    "AsyncLike",
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
 * const patchProfile = asyncFuncHttp("patch", "/profile/{userId}")
 *   .$wrap(new F.WFTimer())
 *   .$reqPath(z.object({ userId: z.string() }))
 *   .$reqBody(z.object({ name: z.string() }))
 *   .$resBody(z.string())
 *   .$((context, {body: {name}, path: {userId}}) => {
 *     const [port, promise] = context.node.createPort();
 *     const job = pg.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, userId], (error, _) => {
 *       if (error) {
 *         port.throw(error);
 *         return;
 *       }
 *       port.return({ body: "Success" });
 *     });
 *     port.oncancel(pg.cancel.bind(pg, job));
 *     return promise;
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
  "AsyncFunc"
> {
  return new FuncHttpBuilder(
    [],
    [method],
    [path],
    "AsyncFunc",
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

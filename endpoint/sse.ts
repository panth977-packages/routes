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
export type SseOutput = z.ZodType;
export type SseTypes = Extract<F.FuncTypes, "StreamFunc">;
export type FuncSseExported<
  I extends SseInput,
  O extends SseOutput,
  Type extends SseTypes,
> =
  & F.FuncExposed<I, O, Type>
  & {
    node: FuncSse<I, O, Type>;
    output: z.infer<O>;
    input: z.infer<I>;
  };
/**
 * Base Sse Node [Is one of node used in Context.node]
 */
export class FuncSse<
  I extends SseInput,
  O extends SseOutput,
  Type extends SseTypes,
> extends F.Func<I, O, Type> {
  constructor(
    readonly middlewares: FuncMiddlewareExported<
      MiddlewareInput,
      MiddlewareOutput,
      MiddlewareTypes
    >[],
    readonly methods: SseMethod[],
    readonly paths: string[],
    type: Type,
    input: I,
    output: O,
    wrappers: F.FuncWrapper<I, O, Type>[],
    implementation: F.FuncImplementation<I, O, Type>,
    ref: { namespace: string; name: string },
    readonly encoder: (data: z.infer<O>) => string,
    readonly tags: string[],
    readonly summary: string,
    readonly description: string,
    readonly security: Record<string, SecurityScheme>,
    readonly docsOrder: number,
    readonly showIndocs: boolean,
  ) {
    super(type, input, output, wrappers, implementation, ref);
    Object.freeze(this.middlewares);
  }
  addTags(...tags: string[]) {
    this.tags.push(...tags);
  }
  addSecurity(schemeName: string, scheme: SecurityScheme) {
    this.security[schemeName] = scheme;
  }
  override create(): FuncSseExported<I, O, Type> {
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
  Type extends SseTypes,
> extends F.FuncBuilder<I, O, Type> {
  constructor(
    protected middlewares: FuncMiddlewareExported<
      MiddlewareInput,
      MiddlewareOutput,
      MiddlewareTypes
    >[],
    protected methods: SseMethod[],
    protected paths: string[],
    type: Type,
    input: I,
    output: O,
    wrappers: F.FuncWrapper<I, O, Type>[],
    ref: { namespace: string; name: string },
    protected encoder: (data: z.infer<O>) => string,
    protected tags: string[],
    protected summary: string,
    protected description: string,
    protected security: Record<string, SecurityScheme>,
    protected docsOrder: number,
    protected showIndocs: boolean,
  ) {
    super(type, input, output, wrappers, ref);
  }
  $middlewares<
    I extends MiddlewareInput,
    O extends MiddlewareOutput,
    Type extends MiddlewareTypes,
  >(middleware: FuncMiddlewareExported<I, O, Type>): this {
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
  override $input = null as never;
  override $output = null as never;
  $reqPath<P extends z.ZodObject<any>>(path: P): FuncSseBuilder<
    z.ZodObject<Omit<I["shape"], "path"> & { path: P }>,
    O,
    Type
  > {
    this.input = z.object({ ...this.input.shape, path }) as never;
    return this as never;
  }
  $reqQuery<Q extends z.ZodObject<any>>(query: Q): FuncSseBuilder<
    z.ZodObject<Omit<I["shape"], "query"> & { query: Q }>,
    O,
    Type
  > {
    this.input = z.object({ ...this.input.shape, query }) as never;
    return this as never;
  }
  $resEvent<E extends z.ZodType>(event: E): FuncSseBuilder<
    I,
    E,
    Type
  > {
    this.output = event as never;
    return this as never;
  }
  $encoder(encoder: (data: z.infer<O>) => string): FuncSseBuilder<
    I,
    O,
    Type
  > {
    this.encoder = encoder;
    return this;
  }
  override $wrap(
    wrap: F.FuncWrapper<I, O, Type>,
  ): FuncSseBuilder<I, O, Type> {
    return super.$wrap(wrap) as never;
  }
  override $ref(
    ref: { namespace: string; name: string },
  ): FuncSseBuilder<I, O, Type> {
    return super.$ref(ref) as never;
  }
  override $(
    implementation: F.FuncImplementation<I, O, Type>,
  ): FuncSseExported<I, O, Type> {
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
      this.wrappers,
      implementation,
      this.ref,
      this.encoder,
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
export function defaultEncoder<OT>(data: OT): string {
  return JSON.stringify(data);
}

/**
 * Base Sse Builder for synchronous functions
 * @example
 * ```ts
 * const jwtDecodeSse = streamFuncSse("get", "/realtime")
 *   .$resEvent(
 *     z.object({ deviceId: z.string(), data: z.record(z.string(), z.number()) }),
 *   )
 *   .$encoder((data) =>
 *     [data.deviceId, ...Object.entries(data.data).flat()].join(",")
 *   )
 *   .$wrap(new F.WFParser())
 *   .$((context, input) => {
 *     const [port, stream] = context.node.createPort();
 *     const client = mqtt.connect({...});
 *     client.on('message', (topic, message) => {
 *       port.emit(JSON.parse(message.toString()));
 *     });
 *     client.subscribeSync('/device/data/latest', () => {
 *       port.throw(error);
 *       client.end();
 *     });
 *     client.on('close', port.end);
 *     const completeTimeout = setTimeout(client.end.bind(client), 1000 * 3600 * 24);
 *     port.oncancel(clearTimeout.bind(null, completeTimeout));
 *     return stream;
 *   });
 * ```
 */
export function streamFuncSse(method: SseMethod, path: string): FuncSseBuilder<
  typeof emptySseInput,
  typeof emptySseOutput,
  "StreamFunc"
> {
  return new FuncSseBuilder(
    [],
    [method],
    [path],
    "StreamFunc",
    emptySseInput,
    emptySseOutput,
    [],
    { namespace: "Unknown", name: "Unknown" },
    defaultEncoder,
    [],
    "",
    "",
    {},
    Number.MAX_SAFE_INTEGER,
    true,
  );
}

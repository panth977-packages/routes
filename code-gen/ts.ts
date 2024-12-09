import { z } from "zod";
import type {
  OpenAPIObject,
  OperationObject,
  ReferenceObject,
  SchemaObject,
} from "../zod-openapi.ts";
import {
  defaultOptionsSchema,
  getAllRoutes,
  getAllSchemas,
  zOpenAPIObject,
  type GenCodeFn,
  type Method,
} from "./_helper.ts";
import { FUNCTIONS } from "@panth977/functions";

const optionsSchema: z.ZodObject<
  (typeof defaultOptionsSchema)["shape"] & {
    EndpointClassName: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    EndpointClassCode: z.ZodOptional<z.ZodBoolean>;
  }
> = defaultOptionsSchema.extend({
  EndpointClassName: z.string().optional().default("Endpoint"),
  EndpointClassCode: z.boolean().optional(),
});
type Options = z.infer<typeof optionsSchema>;
let options: Options = null as never;
let json: OpenAPIObject = null as never;

function createSchemaCode(
  schema: SchemaObject | ReferenceObject | null | undefined
): { code: string; decorator: string } {
  if (!schema || !Object.keys(schema).length) {
    return { code: `any`, decorator: "" };
  }
  if ("$ref" in schema) {
    const refName = dependency(schema.$ref);
    return { code: `${refName}`, decorator: "" };
  }
  let nullable = false;
  if (Array.isArray(schema.type)) {
    if (schema.type.length === 1) {
      schema.type = schema.type[0];
    } else if (schema.type.length === 2) {
      const index = schema.type.indexOf("null");
      if (index === -1) throw new Error("Unimplemented!");
      nullable = true;
      schema.type = schema.type[1 - index];
    } else {
      throw new Error("Unimplemented!");
    }
  }
  let outputCode: string;
  if (schema.anyOf) {
    if (schema.anyOf.length === 1) {
      return createSchemaCode(schema.anyOf[0]);
    }
    if (!schema.anyOf.length) {
      outputCode = `any`;
    } else {
      let code = "";
      for (const possibleSchema of schema.anyOf) {
        const possibleSchemaCode = createSchemaCode(possibleSchema);
        if (code) code += "|";
        code += `${possibleSchemaCode.decorator} ${possibleSchemaCode.code}`;
      }
      outputCode = `${code}`;
    }
  } else if (schema.type === "array") {
    const itemSchemaCode = createSchemaCode(schema.items);
    const code = `${itemSchemaCode.decorator} ${itemSchemaCode.code}`;
    outputCode = `Array<${code}>`;
  } else if (schema.discriminator) {
    let code = "";
    for (const caseName in schema.discriminator.mapping) {
      const caseSchemaCode = createSchemaCode({
        $ref: schema.discriminator.mapping[caseName],
      });
      if (code) code += "|";
      code += `${caseSchemaCode.code} ${caseSchemaCode.decorator}`;
    }
    if (!code.length) {
      outputCode = `any`;
    } else {
      outputCode = `${code}`;
    }
  } else if (
    schema.type === "object" &&
    typeof schema.additionalProperties === "object"
  ) {
    const valueSchemaCode = createSchemaCode(schema.additionalProperties);
    const code = `${valueSchemaCode.decorator} ${valueSchemaCode.code}`;
    outputCode = `Record<string | number | symbol, ${code}>`;
  } else if (schema.type === "object") {
    let code = "";
    for (const propName in schema.properties) {
      const propSchemaCode = createSchemaCode(schema.properties[propName]);
      if (
        schema.required?.includes(propName) &&
        Object.keys(schema.properties[propName])
      ) {
        code += `${propSchemaCode.decorator}${JSON.stringify(propName)}: ${
          propSchemaCode.code
        },`;
      } else {
        code += `${propSchemaCode.decorator}${JSON.stringify(propName)}?: ${
          propSchemaCode.code
        },`;
      }
    }
    if (schema.additionalProperties === false) {
      code = `{${code}}`;
    } else if (schema.additionalProperties === true) {
      code = `{${code}} & {[k: string]: unknown}`;
    } else {
      code = `{${code}}`;
    }
    outputCode = code;
  } else if (schema.type === "string" && schema.enum) {
    if (!schema.enum.length) {
      outputCode = `any`;
    } else if (schema.enum.length === 1) {
      outputCode = `${JSON.stringify(schema.enum[0])}`;
    } else {
      let code = ``;
      for (const element of schema.enum) {
        if (code) code += "|";
        code += `${JSON.stringify(element)}`;
      }
      outputCode = `${code}`;
    }
  } else {
    outputCode =
      {
        string: "string",
        number: "number",
        boolean: "boolean",
        date: "Date",
        integer: "number",
        null: "null",
        any: "any",
      }[schema.type || "any"] || "any";
  }
  outputCode = `(${outputCode})`;
  if (nullable) outputCode += `|null`;
  const decoratorObj: Record<string, unknown> = {};
  if (!schema) {
    Object.assign(decoratorObj, {
      //
    });
  } else if ("$ref" in schema) {
    Object.assign(decoratorObj, {
      //
    });
  } else {
    Object.assign(decoratorObj, {
      nullable: nullable,
      readOnly: schema.readOnly,
      writeOnly: schema.writeOnly,
      xml: schema.xml,
      externalDocs: schema.externalDocs,
      example: schema.example,
      examples: schema.examples,
      deprecated: schema.deprecated,
      format: schema.format,
      not: schema.not,
      description: schema.description,
      default: schema.default,
      title: schema.title,
      multipleOf: schema.multipleOf,
      maximum: schema.maximum,
      exclusiveMaximum: schema.exclusiveMaximum,
      minimum: schema.minimum,
      exclusiveMinimum: schema.exclusiveMinimum,
      maxLength: schema.maxLength,
      minLength: schema.minLength,
      pattern: schema.pattern,
      maxItems: schema.maxItems,
      minItems: schema.minItems,
      uniqueItems: schema.uniqueItems,
      maxProperties: schema.maxProperties,
      minProperties: schema.minProperties,
    });
  }
  const decoratorCodeLines = [];
  for (const key in decoratorObj) {
    if (decoratorObj[key] !== undefined) {
      decoratorCodeLines.push(`@${key} ${JSON.stringify(decoratorObj[key])}`);
    }
  }
  const decoratorCode = `/** ${decoratorCodeLines.join("\n * ")} */`;
  return { code: outputCode, decorator: decoratorCode };
}
function createRouteCode(
  method: Method,
  path: string,
  route: OperationObject | null | undefined
) {
  if (!route) throw new Error("Unimplemented!");
  const name = route.operationId;
  if (!name)
    throw new Error(
      "OperationId was expected found non, set this using route.setName()"
    );
  if (!/^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(name))
    throw new Error("Route name was expected to be valid variable name");
  if (name in options.routesCreated) return options.routesCreated[name];
  const parameters =
    route.parameters?.map(function (x) {
      if ("$ref" in x) throw new Error("Unimplemented!");
      return x;
    }) ?? [];
  const reqBody = (function (): SchemaObject | ReferenceObject {
    if (!route.requestBody) return {};
    if ("$ref" in route.requestBody || !route.requestBody.content)
      throw new Error("Unimplemented!");
    const schemas = Object.values(route.requestBody.content);
    if (schemas.length > 1)
      return { oneOf: schemas.map((x) => x.schema ?? {}) };
    return schemas[0]?.schema ?? {};
  })();
  const resBody = (function (): SchemaObject | ReferenceObject {
    if (!route.responses?.default) return {};
    if ("$ref" in route.responses.default || !route.responses.default.content)
      throw new Error("Unimplemented!");
    const schemas = Object.values(route.responses.default.content);
    if (schemas.length > 1)
      return { oneOf: schemas.map((x) => x.schema ?? {}) };
    return schemas[0]?.schema ?? {};
  })();
  const resHeaders = (function () {
    if (!route.responses?.default || "$ref" in route.responses.default)
      return [];
    const schemas = [];
    for (const key in route.responses.default?.headers) {
      const x = route.responses.default?.headers?.[key];
      if (!x || "$ref" in x) throw new Error("Unimplemented!");
      schemas.push({
        name: key,
        ...x,
      });
    }
    return schemas;
  })();
  const requestSchemaCode = createSchemaCode({
    type: "object",
    required: [
      //
      parameters.filter((x) => x.required && x.in === "path").length
        ? "params"
        : "",
      parameters.filter((x) => x.required && x.in === "query").length
        ? "query"
        : "",
      parameters.filter((x) => x.required && x.in === "header").length
        ? "headers"
        : "",
      Object.keys(reqBody).length ? "body" : "",
    ].filter((x) => x),
    properties: {
      params: {
        type: "object",
        required: parameters
          .filter((x) => x.required && x.in === "path")
          .map((x) => x.name),
        properties: Object.fromEntries(
          parameters
            .filter((x) => x.in === "path")
            .map((x) => [x.name, x.schema ?? {}] as const)
        ),
        additionalProperties: false,
      },
      query: {
        type: "object",
        required: parameters
          .filter((x) => x.required && x.in === "query")
          .map((x) => x.name),
        properties: Object.fromEntries(
          parameters
            .filter((x) => x.in === "query")
            .map((x) => [x.name, x.schema ?? {}] as const)
        ),
        additionalProperties: true,
      },
      headers: {
        type: "object",
        required: parameters
          .filter((x) => x.required && x.in === "header")
          .map((x) => x.name),
        properties: Object.fromEntries(
          parameters
            .filter((x) => x.in === "header")
            .map((x) => [x.name, x.schema ?? {}] as const)
        ),
        additionalProperties: true,
      },
      body: reqBody,
    },
    additionalProperties: false,
  }).code;
  const responseSchemaCode = createSchemaCode({
    type: "object",
    required: [
      //
      resHeaders.filter((x) => x.required).length ? "headers" : "",
      Object.keys(resBody).length ? "body" : "",
    ].filter((x) => x),
    properties: {
      headers: {
        type: "object",
        required: resHeaders.filter((x) => x.required).map((x) => x.name),
        properties: Object.fromEntries(
          resHeaders.map((x) => [x.name, x.schema ?? {}] as const)
        ),
        additionalProperties: true,
      },
      body: resBody,
    },
    additionalProperties: false,
  }).code;
  let props = ``;
  props += `name: ${JSON.stringify(name)},`;
  props += `path: ${JSON.stringify(path)},`;
  props += `method: ${JSON.stringify(method)},`;
  props += `request: null as never as Req,`;
  props += `response: null as never as Res,`;
  const code = `(function () {
        type Req = ${requestSchemaCode};
        type Res = ${responseSchemaCode};
        return new ${options.EndpointClassName}({${props}})
    })()`;
  const decoratorObj: Record<string, unknown> = {
    tags: route.tags,
    summary: route.summary,
    externalDocs: route.externalDocs,
    description: route.description,
    operationId: route.operationId,
    deprecated: route.deprecated,
    security: route.security,
    servers: route.servers,
  };
  const decoratorCodeLines = [];
  for (const key in decoratorObj) {
    if (decoratorObj[key] !== undefined) {
      decoratorCodeLines.push(`@${key} ${JSON.stringify(decoratorObj[key])}`);
    }
  }
  const decoratorCode = `/** ${decoratorCodeLines.join("\n * ")} */`;
  options.code += `${decoratorCode} const ${name} = ${code};`;
  options.routesCreated[name] = name;
  return name;
}
function dependency($ref: string): string {
  if (!$ref.startsWith("#/components/schemas/"))
    throw new Error("Ref expected to be located at [#/components/schemas/]");
  const name = $ref.substring($ref.lastIndexOf("/") + 1);
  if (!/^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(name))
    throw new Error("Ref name was expected to be valid variable name");
  if (name in options.dependencyCreated) return options.dependencyCreated[name];
  const schema = createSchemaCode(json.components?.schemas?.[name]);
  options.code += `${schema.decorator} type ${name} = ${schema.code};`;
  options.dependencyCreated[name] = name;
  return name;
}

const EndpointClassCode = `
class Endpoint<Req, Res> {
    name: string;
    method: string;
    path: string;
    request: Req;
    response: Res;
    constructor(options: { name: string; method: string; path: string; request: Req; response: Res }) {
        this.name = options.name;
        this.method = options.method;
        this.path = options.path;
        this.request = options.request;
        this.response = options.response;
    }
    trigger(payload: Req): Promise<Res> {
        console.log(${"`${this.name}({payload})`"});
        /**
            // You have to implement this using prototype
            Endpoint.prototype.trigger = async function (this, payload) {
                // YOUR CODE
            };
        **/
        throw new Error('Unimplemented!');
    }
}
`;

const exe = FUNCTIONS.SyncFunction.build({
  input: z.object({
    json: zOpenAPIObject,
    options: optionsSchema,
  }),
  output: optionsSchema.omit({
    createRoutesFor: true,
    createSchemaFor: true,
  }),
  wrappers: (_params) => [
    FUNCTIONS.WRAPPERS.SafeParse({ _params }),
    function ({ context, input, func, build }) {
      json = input.json;
      options = input.options;
      return func({ context, input, build });
    },
  ],
  func() {
    if (options.EndpointClassCode) options.code += EndpointClassCode;
    for (const schema of getAllSchemas(json, options)) {
      dependency(schema.name);
    }
    for (const route of getAllRoutes(json, options)) {
      createRouteCode(route.method, route.path, route.schema);
    }
    return options;
  },
});
/**
 * Generate Typescript code
 */
export const genTsCode: GenCodeFn<typeof optionsSchema> = exe;

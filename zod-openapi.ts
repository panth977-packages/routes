// openapi-generator.ts

import { z } from "zod/v4";
import {
  emptyHttpOutput,
  FuncHttp,
  type FuncHttpExported,
  FuncSse,
  type HttpInput,
  type HttpOutput,
  type HttpTypes,
} from "./endpoint/index.ts";
import type {
  FuncSseExported,
  SseInput,
  SseOutput,
  SseTypes,
} from "./endpoint/sse.ts";
import type { F } from "@panth977/functions";
export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options"
  | "head"
  | "trace";

export type EndpointBuild =
  | FuncHttpExported<HttpInput, HttpOutput, F.FuncDeclaration, HttpTypes>
  | FuncSseExported<SseInput, SseOutput, F.FuncDeclaration, SseTypes>;

// JSON Schema for OpenAPI 3.1 (loosely modeled for flexibility)
export type JsonSchema = z.core.JSONSchema.BaseSchema;

// OpenAPI Operation Object
export type Route = {
  operationId: string;
  tags: string[];
  security?: {
    [scheme: string]: unknown[];
  }[];
  description?: string;
  summary?: string;
  parameters: Array<{
    name: string;
    in: "query" | "header" | "path" | "cookie";
    required?: boolean;
    schema?: JsonSchema;
    description?: string;
    example?: any;
  }>;
  requestBody?: {
    description?: string;
    required?: boolean;
    content: {
      [contentType: string]: {
        schema: JsonSchema;
        example?: any;
      };
    };
  };
  responses: {
    [statusCode: string]: {
      description: string;
      content?: {
        [contentType: string]: {
          schema: JsonSchema;
          example?: any;
        };
      };
    };
  };
  deprecated?: boolean;
  [extension: `x-${string}`]: any;
};

// Security Scheme Object
export type SecurityScheme =
  | {
    type: "apiKey";
    description?: string;
    name: string;
    in: "query" | "header" | "cookie";
  }
  | {
    type: "http";
    scheme: "basic" | "bearer";
    bearerFormat?: string;
    description?: string;
  }
  | {
    type: "oauth2";
    description?: string;
    flows: {
      implicit?: {
        authorizationUrl: string;
        scopes: Record<string, string>;
      };
      password?: {
        tokenUrl: string;
        scopes: Record<string, string>;
      };
      clientCredentials?: {
        tokenUrl: string;
        scopes: Record<string, string>;
      };
      authorizationCode?: {
        authorizationUrl: string;
        tokenUrl: string;
        scopes: Record<string, string>;
      };
    };
  }
  | {
    type: "openIdConnect";
    openIdConnectUrl: string;
    description?: string;
  };

export type OpenApiJson = {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    termsOfService?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  paths: Record<string, Record<HttpMethod, Route>>;
  components: {
    $defs: Record<string, JsonSchema>;
    securitySchemes: Record<string, SecurityScheme>;
  };
  security?: Array<{ [scheme: string]: string[] }>;
  tags?: Array<{ name: string; description?: string }>;
  servers?: Array<{ url: string; description?: string }>;
  [extension: `x-${string}`]: any;
};
/**
 * Document your routes by simply passing your endpoint bundle, and get a open-api.json
 * @param docEndpoints
 * @param params
 * @returns
 *
 * @example
 * ```ts
 * const routes = ROUTES.getEndpointsFromBundle({
 *   bundle: await import('./routes/index.ts'),
 *   excludeTags: ['internal-apis'],
 * }); // strong type will be lost
 * const OpenApiJson = ROUTES.getRouteDocJson(routes, {
 *   info: {
 *     title: 'My Apis',
 *     version: '0.0.1',
 *   }
 * });
 * ```
 */
export function generateOpenAPI(
  info: OpenApiJson["info"],
  servers: Array<{ url: string; description?: string }>,
  bundle: Record<string, EndpointBuild>,
): OpenApiJson {
  //
  const securitySchemes: Record<string, SecurityScheme> = {};
  const paths: Record<string, Record<HttpMethod, Route>> = {};
  const allRoutes: [number, Route, EndpointBuild][] = [];
  const globalTypeShape: Record<string, z.ZodType> = {};
  for (
    const build of Object.values(bundle).sort((a, b) =>
      a.node.docsOrder - b.node.docsOrder
    )
  ) {
    const middlewares = build.node.middlewares;
    const security = [
      ...middlewares.map((m) => m.node.security),
      build.node.security,
    ];
    Object.assign(securitySchemes, ...security);
    const params: Route = {
      operationId: build.node.ref.name,
      tags: middlewares.reduce(
        (tags, m) => [...tags, ...(m.node.tags ?? [])],
        [...(build.node.tags ?? [])],
      ),
      security: security.map((security) =>
        Object.fromEntries(Object.keys(security).map((x) => [x, []]))
      ),
      description: build.node.description,
      summary: build.node.summary,
      parameters: [],
      requestBody: {
        content: {},
      },
      responses: {
        "200": {
          description: "OK",
          content: {},
        },
      },
    };
    const id = allRoutes.length;
    allRoutes.push([id, params, build]);
    if (build instanceof FuncHttp) {
      const {
        reqPath,
        reqHeaders,
        reqQuery,
        reqBody,
        resBody,
        resHeaders,
      } = build;
      const pathShape = reqPath instanceof z.ZodObject
        ? { ...reqPath.shape }
        : {};
      const headerShape = reqHeaders instanceof z.ZodObject
        ? { ...reqHeaders.shape }
        : {};
      const queryShape = reqQuery instanceof z.ZodObject
        ? { ...reqQuery.shape }
        : {};
      const bodyShape = reqBody;
      const responseShape = resBody;
      const responseHeaderShape = resHeaders instanceof z.ZodObject
        ? { ...resHeaders.shape }
        : {};
      for (const middleware of build.middlewares) {
        const { reqHeaders, reqQuery, resHeaders } = middleware.node;
        if (reqHeaders instanceof z.ZodObject) {
          Object.assign(headerShape, reqHeaders.shape);
        }
        if (reqQuery instanceof z.ZodObject) {
          Object.assign(queryShape, reqQuery.shape);
        }
        if (resHeaders instanceof z.ZodObject) {
          Object.assign(responseHeaderShape, resHeaders.shape);
        }
      }
      if (bodyShape === emptyHttpOutput.shape.body) {
        delete params.requestBody;
      }
      const routeSchema = z.object({
        pathShape,
        headerShape,
        queryShape,
        bodyShape,
        responseShape,
        responseHeaderShape,
      });
      globalTypeShape[`Route-${id}`] = routeSchema;
    } else if (build instanceof FuncSse) {
      const { reqPath, reqQuery } = build;
      const pathShape = reqPath instanceof z.ZodObject
        ? { ...reqPath.shape }
        : {};
      const queryShape = reqQuery instanceof z.ZodObject
        ? { ...reqQuery.shape }
        : {};
      for (const middleware of build.middlewares) {
        const { reqQuery } = middleware.node;
        if (reqQuery instanceof z.ZodObject) {
          Object.assign(queryShape, reqQuery.shape);
        }
      }
      const routeSchema = z.object({
        pathShape,
        queryShape,
      });
      globalTypeShape[`Route-${id}`] = routeSchema;
      delete params.requestBody;
      params.responses["200"].content = {
        "text/event-stream": {
          schema: { type: "string" },
        },
      };
    } else {
      throw new Error("Invalid build");
    }
    for (const path of build.paths) {
      paths[path] ??= {} as Record<HttpMethod, Route>;
      for (const method of build.methods) {
        paths[path][method] = params;
      }
    }
  }
  const jsonSchema = z.toJSONSchema(z.object(globalTypeShape), {
    cycles: "ref",
    reused: "ref",
    unrepresentable: "any",
    io: "output",
    target: "draft-2020-12",
  }) as any;
  if ("properties" in jsonSchema === false) {
    throw new Error("Invalid JSON schema");
  }
  for (const [id, route, build] of allRoutes) {
    const routeSchema = jsonSchema.properties[`Route-${id}`];
    if (build instanceof FuncHttp) {
      const {
        pathShape,
        headerShape,
        queryShape,
        bodyShape,
        responseShape,
        // responseHeaderShape,
      } = routeSchema.properties;
      for (
        const parameter of [{
          in: "path",
          schema: pathShape.properties,
        }, {
          in: "header",
          schema: headerShape.properties,
        }, {
          in: "query",
          schema: queryShape.properties,
        }] as const
      ) {
        for (const key in parameter.schema) {
          route.parameters.push({
            in: parameter.in,
            name: key,
            schema: parameter.schema[key],
            required: true,
            description: parameter.schema[key].description,
            example: parameter.schema[key].example,
          });
        }
      }
      if (route.requestBody) {
        if (
          !build.reqMediaTypes || build.reqMediaTypes === "application/json"
        ) {
          route.requestBody.content = {
            "application/json": {
              schema: bodyShape,
            },
          };
        } else {
          route.requestBody.content = {
            [build.reqMediaTypes]: {
              schema: {},
            },
          };
        }
      }
      if (
        !build.resMediaTypes || build.resMediaTypes === "application/json"
      ) {
        route.responses[200].content = {
          "application/json": {
            schema: responseShape,
          },
        };
      } else {
        route.responses[200].content = {
          [build.resMediaTypes]: {
            schema: {},
          },
        };
      }
    } else if (build instanceof FuncSse) {
      const {
        pathShape,
        queryShape,
      } = routeSchema.properties;
      for (
        const parameter of [{
          in: "path",
          schema: pathShape.properties,
        }, {
          in: "query",
          schema: queryShape.properties,
        }] as const
      ) {
        for (const key in parameter.schema) {
          route.parameters.push({
            in: parameter.in,
            name: key,
            schema: parameter.schema[key],
            required: true,
            description: parameter.schema[key].description,
            example: parameter.schema[key].example,
          });
        }
      }
    } else {
      throw new Error("Invalid build");
    }
  }
  const json: OpenApiJson = {
    openapi: "3.1.0",
    info: info,
    servers,
    paths,
    components: { $defs: jsonSchema.$defs ?? {}, securitySchemes },
  };
  return json;
}

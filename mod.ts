/**
 * # Endpoint
 * - {@link ROUTES.Endpoint}
 * - {@link ROUTES.Middleware.build}
 * - {@link ROUTES.Http.build}
 * - {@link ROUTES.Sse.build}
 * 
 * # Schemas
 * - {@link ROUTES.z.MiddlewareRequest}
 * - {@link ROUTES.z.MiddlewareResponse}
 * - {@link ROUTES.z.HttpRequest}
 * - {@link ROUTES.z.HttpResponse}
 * - {@link ROUTES.z.SseRequest}
 * - {@link ROUTES.z.SseResponse}
 * - {@link ROUTES.z.is}
 * 
 * # Helper
 * - {@link ROUTES.getRouteDocJson}
 * - {@link ROUTES.getEndpointsFromBundle}
 * - {@link ROUTES.execute}
 * - {@link ROUTES.pathParser}
 * 
 * # Code Generation
 * - {@link ROUTES.CodeGen.genJsCode}
 * - {@link ROUTES.CodeGen.genTsCode}
 * 
 * @module
 * 
 * @example
 * ```ts
 * import { ROUTES } from "@panth977/routes";
 *
 * ROUTES.{api}
 * ```
 */

export * as ROUTES from "./exports.ts";

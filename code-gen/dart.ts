// import { z } from "zod";
// import type {
//   OpenAPIObject,
//   OperationObject,
//   ReferenceObject,
//   SchemaObject,
// } from "../zod-openapi.ts";
// import {
//   defaultOptionsSchema,
//   getAllRoutes,
//   getAllSchemas,
//   zOpenAPIObject,
//   type GenCodeFn,
//   type Method,
// } from "./_helper.ts";
// import { FUNCTIONS } from "@panth977/functions";

// const optionsSchema: z.ZodObject<
//   (typeof defaultOptionsSchema)["shape"] & {
//     FactoryClassCode: z.ZodOptional<z.ZodBoolean>;
//     CollapseSchema: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
//     MandatoryStructName: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
//   }
// > = defaultOptionsSchema.extend({
//   FactoryClassCode: z.boolean().optional(),
//   CollapseSchema: z.boolean().optional().default(true),
//   MandatoryStructName: z.boolean().optional().default(true),
// });
// type Options = z.infer<typeof optionsSchema>;
// let options: Options = null as never;
// let json: OpenAPIObject = null as never;
// let structs: Record<string, { args: string[]; mixins: string[] }> = {};
// let enums = new Set<string>();

// function createSchemaCode(
//   schema: SchemaObject | ReferenceObject | null | undefined,
//   className?: undefined | null | string
// ): { type: string; parser: string } {
//   if (!schema || !Object.keys(schema).length) {
//     return {
//       type: "BaseTypedClass<dynamic>",
//       parser: `BaseTypedClass.parse<dynamic>()`,
//     };
//   }
//   if ("$ref" in schema) {
//     const refName = dependency(schema.$ref);
//     if (className) {
//       const refSchema = createSchemaCode(schema);
//       if (structs[schema.$ref]) {
//         options.code += `
// class ${className} extends ${refSchema.type} {
//   ${className}({${structs[schema.$ref].args
//           .map((x) => x.replace(" ", " super."))
//           .join(", ")}}) : super();
//   static final _factory = ${refSchema.parser};
//   factory ${className}.fromJson(dynamic data) {
//     return ${className}(_factory(data)._val);
//   }
//   static ${className} Function(dynamic data) parse() {
//     return ${className}.fromJson;
//   }
// }
//         `;
//       }
//       options.code += `
// class ${className} extends ${refSchema.type} {
//   ${className}(super._val) : super();
//   static final _factory = ${refSchema.parser};
//   factory ${className}.fromJson(dynamic data) {
//     return ${className}(_factory(data)._val);
//   }
//   static ${className} Function(dynamic data) parse() {
//     return ${className}.fromJson;
//   }
// }
//       `;
//       return { type: className, parser: `${className}.parse()` };
//     }
//     return { type: refName, parser: `${refName}.parse()` };
//   }
//   if (Array.isArray(schema.type)) {
//     schema.type = [...new Set(schema.type)];
//     if (schema.type.length === 2) {
//       const index = schema.type.indexOf("null");
//       if (index === -1) throw new Error("Unimplemented!");
//       schema.type = schema.type[1 - index];
//       const nonNullableSchema = createSchemaCode(schema);
//       if (className) {
//         options.code += `
// class ${className} extends NullableClass<${nonNullableSchema.type}> {
//   ${className}(super._val) : super();
//   static final _factory = ${nonNullableSchema.parser};
//   factory ${className}.fromJson(dynamic data, List<String> path) {
//     return ${className}(NullableClass.fromJson(data, _factory, path)._val);
//   }
//   static ${className} Function(dynamic data, List<String> path) parse() {
//     return ${className}.fromJson;
//   }
// }
//       `;
//         return { type: className, parser: `${className}.parse()` };
//       }
//       return {
//         type: `NullableClass<${nonNullableSchema.type}>`,
//         parser: `NullableClass.parse<${nonNullableSchema.type}>(${nonNullableSchema.parser})`,
//       };
//     }
//     if (schema.type.length !== 1) throw new Error("Unimplemented!");
//     schema.type = schema.type[0];
//     return createSchemaCode(schema, className);
//   }

//   if (!schema.discriminator && Array.isArray(schema.oneOf)) {
//     if (schema.oneOf.length === 2) {
//       const index = schema.oneOf.findIndex(
//         (x) => "$ref" in x === false && x.type === "null"
//       );
//       if (index === -1) throw new Error("Unimplemented!");
//       const nonNullableSchema = createSchemaCode(schema.oneOf[1 - index]);
//       if (className) {
//         options.code += `
// class ${className} extends NullableClass<${nonNullableSchema.type}> {
//   ${className}(super._val) : super();
//   static final _factory = ${nonNullableSchema.parser};
//   factory ${className}.fromJson(dynamic data, List<String> path) {
//     return ${className}(NullableClass.fromJson(data, _factory, path)._val);
//   }
//   static ${className} Function(dynamic data, List<String> path) parse() {
//     return ${className}.fromJson;
//   }
// }
//       `;
//         return { type: className, parser: `${className}.parse()` };
//       }
//       return {
//         type: `NullableClass<${nonNullableSchema.type}>`,
//         parser: `NullableClass.parse<${nonNullableSchema.type}>(${nonNullableSchema.parser})`,
//       };
//     }
//     if (schema.oneOf.length !== 1) throw new Error("Unimplemented!");
//     return createSchemaCode(schema.oneOf[0], className);
//   }
//   if (schema.anyOf) {
//     if (schema.anyOf.length === 1) {
//       return createSchemaCode(schema.anyOf[0], className);
//     }
//     if (!schema.anyOf.length) {
//       return {
//         type: "BaseTypedClass<dynamic>",
//         parser: `BaseTypedClass.parse<dynamic>()`,
//       };
//     }
//     throw new Error("Unimplemented!");
//   }
//   if (schema.type === "array") {
//     const itemSchemaCode = createSchemaCode(schema.items);
//     if (className) {
//       options.code += `
// class ${className} extends BaseListClass<${itemSchemaCode.type}> {
//   ${className}(super._val) : super();
//   static final _itemFactory = ${itemSchemaCode.parser};
//   factory ${className}.fromJson(dynamic data, List<String> path) {
//     return ${className}(BaseListClass.fromJson(data, _itemFactory, path)._val);
//   }
//   static ${className} Function(dynamic data, List<String> path) parse() {
//     return ${className}.fromJson;
//   }
// }
//       `;
//       return {
//         type: className,
//         parser: `${className}.parse()`,
//       };
//     }
//     return {
//       type: `BaseListClass<${itemSchemaCode.type}>`,
//       parser: `BaseListClass.parse<${itemSchemaCode.type}>(${itemSchemaCode.parser})`,
//     };
//   }
//   if (schema.discriminator) {
//     const mapping = [];
//     for (const caseName in schema.discriminator.mapping) {
//       const caseSchemaCode = createSchemaCode({
//         $ref: schema.discriminator.mapping[caseName],
//       });
//       mapping.push(`${JSON.stringify(caseName)}: ${caseSchemaCode.parser}`);
//     }
//     if (!mapping.length) {
//       return {
//         type: "BaseTypedClass<dynamic>",
//         parser: `BaseTypedClass.parse<dynamic>()`,
//       };
//     }
//     const param = JSON.stringify(schema.discriminator.propertyName);
//     const getters = [];
//     for (const caseName in schema.discriminator.mapping) {
//       const refClassName = dependency(schema.discriminator.mapping[caseName]);
//       getters.push(
//         `bool get is${refClassName} => _val is ${refClassName};`,
//         `${refClassName} get as${refClassName} {
//     assert(is${refClassName});
//     return _val as ${refClassName};
//   }`
//       );
//     }
//     if (className) {
//       options.code += `
// mixin ${className}Mixin on BaseStructClass {}
// class ${className} extends BaseDiscriminatorClass<${className}Mixin> {
//   ${className}(super._val) : super();
//   static final _factories = <String, ${className}Mixin Function(dynamic, List<String>)>{
//     ${mapping.join(",\n    ")}
//   };
//   static const _param = ${param};
//   factory ${className}.fromJson(dynamic data, List<String> path) {
//     return ${className}(BaseDiscriminatorClass<${className}Mixin>.fromJson(data, _param, _factories, path)._val);
//   }
//   static ${className} Function(dynamic data, List<String> path) parse() {
//     return ${className}.fromJson;
//   }
//   ${getters.join("\n  ")}
// }
//         `;
//       for (const caseName in schema.discriminator.mapping) {
//         const refClassName = dependency(schema.discriminator.mapping[caseName]);
//         options.code = options.code.replace(
//           `class ${refClassName} extends BaseStructClass with `,
//           `class ${refClassName} extends BaseStructClass with ${className}Mixin, `
//         );
//       }
//       return { type: className, parser: `${className}.parse()` };
//     }
//     return {
//       type: `BaseDiscriminatorClass<BaseStructClass>`,
//       parser: `BaseDiscriminatorClass.parse<BaseStructClass>(${param}, {${mapping.join(
//         ","
//       )}})`,
//     };
//   }
//   if (
//     schema.type === "object" &&
//     typeof schema.additionalProperties === "object"
//   ) {
//     const keySchemaCode = createSchemaCode(
//       schema.propertyNames ?? { type: "string" }
//     );
//     const valueSchemaCode = createSchemaCode(schema.additionalProperties);
//     if (className) {
//       options.code += `
// class ${className} extends BaseMapClass<${keySchemaCode.type}, ${valueSchemaCode.type}> {
//   ${className}(super._val) : super();
//   static final _keyFactory = ${keySchemaCode.parser};
//   static final _valueFactory = ${valueSchemaCode.parser};
//   factory ${className}.fromJson(dynamic data, List<String> path) {
//     return ${className}(BaseMapClass.fromJson(data, _keyFactory, _valueFactory, path)._val);
//   }
//   static ${className} Function(dynamic data, List<String> path) parse() {
//     return ${className}.fromJson;
//   }
// }
//       `;
//       return { type: className, parser: `${className}.parse()` };
//     }
//     return {
//       parser: `BaseMapClass.parse<${keySchemaCode.type}, ${valueSchemaCode.type}>(${keySchemaCode.parser}, ${valueSchemaCode.parser})`,
//       type: `BaseMapClass<${keySchemaCode.type}, ${valueSchemaCode.type}>`,
//     };
//   }
//   if (schema.type === "object" || schema.allOf) {
//     const props: Record<
//       string,
//       { req: boolean; code: ReturnType<typeof createSchemaCode> }
//     > = {};
//     for (const propName in schema.properties) {
//       let valueSchema = schema.properties[propName];
//       let isRequired =
//         Object.keys(valueSchema).length &&
//         (schema.required?.includes(propName) ?? false);
//       if (options.CollapseSchema && "$ref" in valueSchema === false) {
//         if (Array.isArray(valueSchema.type) && valueSchema.type.length == 2) {
//           const index = valueSchema.type.indexOf("null");
//           if (index > -1) {
//             isRequired = false;
//             valueSchema.type = valueSchema.type[1 - index];
//           }
//         }
//         if (
//           !valueSchema.discriminator &&
//           Array.isArray(valueSchema.oneOf) &&
//           valueSchema.oneOf.length == 2
//         ) {
//           const index = valueSchema.oneOf.findIndex(
//             (x) => "$ref" in x === false && x.type === "null"
//           );
//           if (index > -1) {
//             isRequired = false;
//             valueSchema = valueSchema.oneOf[1 - index];
//           }
//         }
//       }
//       props[propName] = {
//         req: isRequired || false,
//         code: createSchemaCode(valueSchema),
//       };
//     }
//     const required = [
//       `<String>{${Object.keys(props)
//         .filter((x) => props[x].req)
//         .map((x) => JSON.stringify(x))
//         .join(",")}}`,
//     ];
//     const factories = [
//       `{${Object.keys(props)
//         .map((x) => `${JSON.stringify(x)}: ${props[x].code.parser}`)
//         .join(",")}}`,
//     ];
//     for (const s of schema.allOf ?? []) {
//       if ("$ref" in s) {
//         const refClassName = dependency(s.$ref);
//         factories.push(`${refClassName}._factories`);
//         required.push(`${refClassName}._required`);
//       } else {
//         throw new Error("Unimplemented!");
//       }
//     }
//     if (className) {
//       const propsCode = [];
//       const args = [];
//       const mappingArgs = [];
//       for (const propName in props) {
//         const propCode = props[propName].code;
//         const key = JSON.stringify(propName);
//         const camelCaseName = propName
//           .split(/[^a-zA-Z0-9]+/) // Split by non-alphanumeric characters
//           .filter(Boolean) // Remove empty strings
//           .map((word, index) => {
//             if (index === 0) {
//               return word.charAt(0).toLowerCase() + word.slice(1);
//             }
//             return word.charAt(0).toUpperCase() + word.slice(1);
//           })
//           .join("");
//         if (props[propName].req) {
//           propsCode.push(
//             `${propCode.type} get ${camelCaseName} => _get<${propCode.type}>(${key});`
//           );
//           propsCode.push(
//             `set ${camelCaseName}(${propCode.type} value) => _set<${propCode.type}>(${key}, value);`
//           );
//           args.push(`required ${propCode.type} ${camelCaseName}`);
//           mappingArgs.push(`${key}: ${camelCaseName}`);
//         } else {
//           propsCode.push(
//             `${propCode.type}? get ${camelCaseName} => _get<${propCode.type}?>(${key});`
//           );
//           propsCode.push(
//             `set ${camelCaseName}(${propCode.type}? value) => _set<${propCode.type}?>(${key}, value);`
//           );
//           args.push(`${propCode.type}? ${camelCaseName}`);
//           mappingArgs.push(`${key}: ${camelCaseName}`);
//         }
//       }
//       const mixins = [`${className}Mixin`];
//       for (const s of schema.allOf ?? []) {
//         if ("$ref" in s) {
//           const refClassName = dependency(s.$ref);
//           mixins.push(`${refClassName}Mixin`);
//           args.push(...structs[refClassName].args);
//         } else {
//           throw new Error("Unimplemented!");
//         }
//       }
//       options.code += `
// mixin ${className}Mixin on BaseStructClass {
//   ${propsCode.join("\n  ")}
// }
// class ${className} extends BaseStructClass with ${mixins.join(",")} {
//   ${className}({${args.join(",")}}) : super({${mappingArgs.join(",")}});
//   ${className}._(super._val) : super();
//   static final _factories = <String, JsonBind Function(dynamic, List<String>)>{
//     ${factories.map((x) => `...${x}`).join(",\n    ")}
//   };
//   static const _required = <String>{
//     ${required.map((x) => `...${x}`).join(",\n    ")}
//   };
//   factory ${className}.fromJson(dynamic data, List<String> path) {
//     return ${className}._(BaseStructClass.fromJson(data, _factories, _required, null, path)._val);
//   }
//   static ${className} Function(dynamic data, List<String> path) parse() {
//     return ${className}.fromJson;
//   }
// }
//       `;
//       structs[className] = { args, mixins };
//       return { type: className, parser: `${className}.parse()` };
//     }
//     if (options.MandatoryStructName) {
//       throw new Error("MandatoryStructName but no struct name was provided!");
//     }
//     return {
//       parser: `BaseStructClass.parse({${factories
//         .map((x) => `...${x}`)
//         .join(",")}}, const {${required.map((x) => `...${x}`).join(",")}}, null)`,
//       type: `BaseStructClass`,
//     };
//   }
//   if (schema.enum || schema.const) {
//     const constants = schema.enum || [schema.const];
//     if (!constants.length) {
//       return {
//         type: "BaseTypedClass<dynamic>",
//         parser: `BaseTypedClass.parse<dynamic>()`,
//       };
//     }
//     const enumName = className ?? `BaseLiteralClass`;
//     const initializers = [];
//     const allowed = [];
//     for (const s of constants) {
//       if (typeof s === "string" && /^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(s) && !enums.has(s)) {
//         initializers.push(`static const literal${s[0].toUpperCase()}${s.slice(1)} = ${enumName}._(${JSON.stringify(s)});`);
//         enums.add(s);
//       }
//       allowed.push(JSON.stringify(s));
//     }
//     if (className) {
//       options.code += `
// class ${className} extends BaseLiteralClass {
//   const ${className}._(super._val): super._();
//   static const _allowed = {${allowed.join(",")}};
//   static ${className} Function(dynamic data, List<String> path) parse() {
//     final parser = BaseLiteral.parse(_allowed);
//     return (data, path) {
//       return ${className}._(parser(data, path)._val);
//     };
//   }
//   ${initializers.join("\n  ")}
// }
//         `;
//       return { type: className, parser: `${className}.parse()` };
//     }
//     if (initializers.length) {
//       if (!options.code.includes(`class Literals {`))
//         options.code += `\nclass Literals {\n}`;
//       options.code = options.code.replace(
//         `class Literals {`,
//         `class Literals {
//   ${initializers.join("\n  ")}`
//       );
//     }
//     return {
//       type: enumName,
//       parser: `BaseLiteralClass.parse(const {${allowed.join(",")}})`,
//     };
//   }
//   if (schema.type === "string" && schema.format === "date") {
//     if (className) {
//       options.code += `
// class ${className} extends BaseDateTimeClass {
//   ${className}(super._dateTime) : super();
//   factory ${className}.fromJson(dynamic data, List<String> path) {
//     return ${className}(BaseDateTimeClass.fromJson(data, path));
//   }
//   static ${className} Function(dynamic data, List<String> path) parse() {
//     return ${className}.fromJson;
//   }
// }
//       `;
//     }
//     return {
//       type: "BaseDateTimeClass",
//       parser: `BaseDateTimeClass.parse()`,
//     };
//   }
//   const outputParserCode =
//     {
//       string: "String",
//       number: "double",
//       boolean: "bool",
//       integer: "int",
//       null: "Null",
//       any: "dynamic",
//     }[schema.type || "any"] || "dynamic";
//   if (className) {
//     options.code += `
// class ${className} extends BaseTypedClass<${outputParserCode}> {
//   ${className}(super._val) : super();
//   factory ${className}.fromJson(dynamic data, List<String> path) {
//     return ${className}(BaseTypedClass<${outputParserCode}>.fromJson(data, path)._val);
//   }
//   static ${className} Function(dynamic data, List<String> path) parse() {
//     return ${className}.fromJson;
//   }
// }
//     `;
//     return { type: className, parser: `${className}.parse()` };
//   }
//   return {
//     type: `BaseTypedClass<${outputParserCode}>`,
//     parser: `BaseTypedClass.parse<${outputParserCode}>()`,
//   };
// }

// function createRouteCode(
//   method: Method,
//   path: string,
//   route: OperationObject | null | undefined
// ) {
//   if (!options.code.includes(`class APIsBundlers`)) {
//     options.code += `
// class APIsBundlers {
//   const APIsBundlers();
// }
//     `;
//   }
//   const tags = [...(route?.tags ?? []).map((x) => `${x}APIs`), "DefaultAPIs"];
//   for (const tag of tags) {
//     if (!options.code.includes(`class ${tag}`)) {
//       options.code += `
// class ${tag} {
//   const ${tag}();
// }
//       `;
//       options.code = options.code.replace(
//         `class APIsBundlers {`,
//         `class APIsBundlers {
//   final ${tag[0].toLowerCase()}${tag.slice(1)} = const ${tag}();`
//       );
//     }
//   }
//   if (!route) throw new Error("Unimplemented!");
//   const name = route.operationId;
//   if (!name)
//     throw new Error(
//       "OperationId was expected found non, set this using route.setName()"
//     );
//   if (!/^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(name))
//     throw new Error("Route name was expected to be valid variable name");
//   if (name in options.routesCreated) return options.routesCreated[name];
//   const parameters =
//     route.parameters?.map(function (x) {
//       if ("$ref" in x) throw new Error("Unimplemented!");
//       return x;
//     }) ?? [];
//   const reqBody = (function (): SchemaObject | ReferenceObject {
//     if (!route.requestBody) return {};
//     if ("$ref" in route.requestBody || !route.requestBody.content)
//       throw new Error("Unimplemented!");
//     const schemas = Object.values(route.requestBody.content);
//     if (schemas.length > 1)
//       return { oneOf: schemas.map((x) => x.schema ?? {}) };
//     return schemas[0]?.schema ?? {};
//   })();
//   const resBody = (function (): SchemaObject | ReferenceObject {
//     if (!route.responses?.default) return {};
//     if ("$ref" in route.responses.default || !route.responses.default.content)
//       throw new Error("Unimplemented!");
//     const schemas = Object.values(route.responses.default.content);
//     if (schemas.length > 1)
//       return { oneOf: schemas.map((x) => x.schema ?? {}) };
//     return schemas[0]?.schema ?? {};
//   })();
//   const resHeaders = (function () {
//     if (!route.responses?.default || "$ref" in route.responses.default)
//       return [];
//     const schemas = [];
//     for (const key in route.responses.default?.headers) {
//       const x = route.responses.default?.headers?.[key];
//       if (!x || "$ref" in x) throw new Error("Unimplemented!");
//       schemas.push({
//         name: key,
//         ...x,
//       });
//     }
//     return schemas;
//   })();
//   const requestPath = parameters.filter((x) => x.in === "path").length
//     ? createSchemaCode(
//         {
//           type: "object",
//           required: parameters
//             .filter((x) => x.in === "path")
//             .map((x) => x.name),
//           properties: Object.fromEntries(
//             parameters
//               .filter((x) => x.in === "path")
//               .map((x) => [x.name, x.schema ?? {}] as const)
//           ),
//           additionalProperties: false,
//         },
//         `${name}RequestParams`
//       )
//     : null;
//   const requestQuery = parameters.filter((x) => x.in === "query").length
//     ? createSchemaCode(
//         {
//           type: "object",
//           required: parameters
//             .filter((x) => x.required && x.in === "query")
//             .map((x) => x.name),
//           properties: Object.fromEntries(
//             parameters
//               .filter((x) => x.in === "query")
//               .map((x) => [x.name, x.schema ?? {}] as const)
//           ),
//           additionalProperties: true,
//         },
//         `${name}RequestQuery`
//       )
//     : null;
//   const requestHeaders = parameters.filter((x) => x.in === "header").length
//     ? createSchemaCode(
//         {
//           type: "object",
//           required: parameters
//             .filter((x) => x.required && x.in === "header")
//             .map((x) => x.name),
//           properties: Object.fromEntries(
//             parameters
//               .filter((x) => x.in === "header")
//               .map((x) => [x.name, x.schema ?? {}] as const)
//           ),
//           additionalProperties: true,
//         },
//         `${name}RequestHeaders`
//       )
//     : null;
//   const requestBody = Object.keys(reqBody).length
//     ? "$ref" in reqBody
//       ? createSchemaCode(reqBody)
//       : createSchemaCode(reqBody, `${name}RequestBody`)
//     : null;
//   const responseHeaders = resHeaders.length
//     ? createSchemaCode(
//         {
//           type: "object",
//           required: resHeaders.filter((x) => x.required).map((x) => x.name),
//           properties: Object.fromEntries(
//             resHeaders.map((x) => [x.name, x.schema ?? {}] as const)
//           ),
//           additionalProperties: true,
//         },
//         `${name}ResponseHeaders`
//       )
//     : {
//         type: "BaseLiteralClass",
//         parser: "((dynamic headers, List<String> path) => const BaseLiteralClass._(null))",
//       };
//   const responseBody =
//     "$ref" in resBody
//       ? createSchemaCode(resBody)
//       : createSchemaCode(resBody, `${name}ResponseBody`);
//   const methodEnum = {
//     post: "Method.post",
//     get: "Method.get",
//     patch: "Method.patch",
//     put: "Method.put",
//     delete: "Method.delete",
//     head: "Method.head",
//     options: "Method.options",
//     trace: "Method.trace",
//   }[method];
//   const args = [];
//   const types = [];
//   const nullArgs = [];
//   if (requestPath) {
//     args.push(`required super.path`);
//     types.push(requestPath.type);
//   } else {
//     types.push("Null");
//     nullArgs.push("path: null");
//   }
//   if (requestHeaders) {
//     args.push(`required super.headers`);
//     types.push(requestHeaders.type);
//   } else {
//     types.push("Null");
//     nullArgs.push("headers: null");
//   }
//   if (requestQuery) {
//     args.push(`required super.query`);
//     types.push(requestQuery.type);
//   } else {
//     types.push("Null");
//     nullArgs.push("query: null");
//   }
//   if (requestBody) {
//     args.push(`required super.body`);
//     types.push(requestBody.type);
//   } else {
//     types.push("Null");
//     nullArgs.push("body: null");
//   }
//   options.code += `
// class Request${name} extends RequestClass<${types.join(", ")}> {
//   Request${name}(${
//     !args.length ? "" : `{${args.join(", ")}}`
//   }): super(${nullArgs.join(", ")});
// }
// class Response${name} extends ResponseClass<${responseHeaders.type}, ${
//     responseBody.type
//   }> {
//   Response${name}({required super.headers, required super.body}): super();
//   static final _headerFactory = ${responseHeaders.parser};
//   static final _bodyFactory = ${responseBody.parser};
//   factory Response${name}.fromJson(dynamic headers, dynamic body) {
//     return Response${name}(headers: _headerFactory(headers, ["Response${name}", "headers"]), body: _bodyFactory(body, ["Response${name}", "body"]));
//   }
// }
// class Api${name} extends BaseApiClass<Request${name}, Response${name}> {
//   Api${name}.build(super.request): super(path: ${JSON.stringify(
//     path
//   )}, method: ${methodEnum}, responseFactory: Response${name}.fromJson);
// }
//   `;
//   for (const tag of tags) {
//     options.code = options.code.replace(
//       `class ${tag} {`,
//       `class ${tag} {
//   final ${name[0].toLowerCase()}${name.slice(1)} = Api${name}.build;`
//     );
//   }
//   options.routesCreated[name] = name;
//   return name;
// }

// function dependency($ref: string): string {
//   if (!$ref.startsWith("#/components/schemas/"))
//     throw new Error("Ref expected to be located at [#/components/schemas/]");
//   const name = $ref.substring($ref.lastIndexOf("/") + 1);
//   if (!/^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(name))
//     throw new Error("Ref name was expected to be valid variable name");
//   if (name in options.dependencyCreated) return options.dependencyCreated[name];
//   createSchemaCode(json.components?.schemas?.[name], name);
//   options.dependencyCreated[name] = name;
//   return name;
// }

// const FactoryClassCode = `import 'dart:math';

// class DataParsingError extends Error {
//   final dynamic data;
//   final String factory;
//   final Map<String, dynamic> info;
//   final List<String> path;
//   DataParsingError({required this.data, required this.path, required this.factory, required this.info});

//   String get message {
//     final dataStr = data.toString();
//     return 'DataError:'
//         '\\tfactory: $factory'
//         '\\tpath: $path'
//         '\\tinfo: $info'
//         '\\tdata: \${dataStr.length > 150 ? '\${dataStr.substring(0, 70)}...\${dataStr.substring(dataStr.length - 70)}' : dataStr}';
//   }

//   @override
//   String toString() => message;
// }

// class DataRuntimeError extends Error {
//   final String message;
//   DataRuntimeError(this.message);
//   @override
//   String toString() => message;
// }

// abstract class JsonBind {
//   const JsonBind();
//   toJson();
//   @override
//   String toString() {
//     return '[\${super.runtimeType.toString()}] \${toJson()}';
//   }
// }

// class NullableClass<T extends JsonBind> extends JsonBind {
//   final T? _val;
//   const NullableClass(this._val);
//   factory NullableClass.fromJson(dynamic data, T Function(dynamic data, List<String> path) factory, List<String> path) {
//     if (data == null) return NullableClass(null);
//     return NullableClass(factory(data, path));
//   }
//   static NullableClass<T> Function(dynamic data, List<String> path) parse<T extends JsonBind>(T Function(dynamic data, List<String> path) factory) {
//     return (data, path) {
//       return NullableClass.fromJson(data, factory, path);
//     };
//   }

//   T? get val => _val;
//   T get nonNullVal {
//     if (_val == null) throw DataRuntimeError("NullableClass.nonNullVal: is null");
//     return _val;
//   }

//   bool get isNull => _val == null;
//   bool get isNotNull => _val != null;

//   @override
//   int get hashCode => _val.hashCode;

//   @override
//   bool operator ==(Object other) {
//     if (other is NullableClass<T>) return other._val == _val;
//     if (other is JsonBind) return other == _val;
//     return false;
//   }

//   @override
//   toJson() {
//     return _val?.toJson();
//   }
// }

// class BaseTypedClass<T> extends JsonBind {
//   final T _val;
//   const BaseTypedClass(this._val);
//   factory BaseTypedClass.fromJson(dynamic data, List<String> path) {
//     if (data is! T) {
//       throw DataParsingError(factory: "BaseTypedClass.fromJson:", info: {'typeFound': data.runtimeType, 'expected': T}, path: path, data: data);
//     }
//     return BaseTypedClass(data);
//   }
//   T get val => _val;

//   static BaseTypedClass<T> Function(dynamic data, List<String> path) parse<T>() {
//     return BaseTypedClass<T>.fromJson;
//   }

//   @override
//   int get hashCode => runtimeType.hashCode + _val.hashCode;
//   @override
//   bool operator ==(Object other) {
//     return other is BaseTypedClass<T> && other.runtimeType == other.runtimeType && other._val == _val;
//   }

//   @override
//   toJson() {
//     return _val;
//   }
// }

// class BaseLiteralClass extends JsonBind {
//   final dynamic _val;
//   const BaseLiteralClass(this._val);
//   const BaseLiteralClass._(this._val);
//   static BaseLiteralClass Function(dynamic data, List<String> path) parse(Set<dynamic> allowed) {
//     return (data, path) {
//       if (data is! int && data is! double && data is! bool && data is! String && data != null) {
//         throw DataParsingError(
//           factory: "BaseLiteralClass.parse:",
//           info: {
//             'typeFound': data.runtimeType,
//             'allowed': {int, double, bool, String, null},
//           },
//           path: path,
//           data: data,
//         );
//       }
//       if (!allowed.contains(data)) {
//         throw DataParsingError(factory: "BaseLiteralClass.parse:", info: {'valueFound': data, 'allowed': allowed}, path: path, data: data);
//       }
//       return BaseLiteralClass._(data);
//     };
//   }

//   @override
//   int get hashCode => runtimeType.hashCode + _val.hashCode;

//   @override
//   bool operator ==(Object other) {
//     return other is BaseLiteralClass && other.runtimeType == other.runtimeType && other._val == _val;
//   }

//   @override
//   toJson() {
//     return _val;
//   }
// }

// class BaseDateTimeClass extends JsonBind implements DateTime {
//   final DateTime _val;
//   const BaseDateTimeClass(this._val);
//   factory BaseDateTimeClass.fromJson(dynamic data, List<String> path) {
//     if (data is! String) {
//       throw DataParsingError(factory: "BaseDateTimeClass.fromJson:", info: {'typeFound': data.runtimeType, 'expected': String}, path: path, data: data);
//     }
//     final date = DateTime.tryParse(data);
//     if (date == null) {
//       throw DataParsingError(factory: "BaseDateTimeClass.fromJson:", info: {'valueFound': data, 'expected': 'ISO 8601'}, path: path, data: data);
//     }
//     return BaseDateTimeClass(date);
//   }

//   static BaseDateTimeClass Function(dynamic data, List<String> path) parse() {
//     return BaseDateTimeClass.fromJson;
//   }

//   @override
//   int get hashCode => runtimeType.hashCode + _val.hashCode;

//   @override
//   bool operator ==(Object other) {
//     return other is BaseDateTimeClass && other.runtimeType == other.runtimeType && other._val == _val;
//   }

//   @override
//   toJson() {
//     return _val.toIso8601String();
//   }

//   @override
//   DateTime add(Duration duration) {
//     return _val.add(duration);
//   }

//   @override
//   int compareTo(DateTime other) {
//     return _val.compareTo(other);
//   }

//   @override
//   int get day => _val.day;

//   @override
//   Duration difference(DateTime other) {
//     return _val.difference(other);
//   }

//   @override
//   int get hour => _val.hour;

//   @override
//   bool isAfter(DateTime other) {
//     return _val.isAfter(other);
//   }

//   @override
//   bool isAtSameMomentAs(DateTime other) {
//     return _val.isAtSameMomentAs(other);
//   }

//   @override
//   bool isBefore(DateTime other) {
//     return _val.isBefore(other);
//   }

//   @override
//   bool get isUtc => _val.isUtc;

//   @override
//   int get microsecond => _val.microsecond;

//   @override
//   int get microsecondsSinceEpoch => _val.microsecondsSinceEpoch;

//   @override
//   int get millisecond => _val.millisecond;

//   @override
//   int get millisecondsSinceEpoch => _val.millisecondsSinceEpoch;

//   @override
//   int get minute => _val.minute;

//   @override
//   int get month => _val.month;

//   @override
//   int get second => _val.second;

//   @override
//   DateTime subtract(Duration duration) {
//     return _val.subtract(duration);
//   }

//   @override
//   String get timeZoneName => _val.timeZoneName;

//   @override
//   Duration get timeZoneOffset => _val.timeZoneOffset;

//   @override
//   String toIso8601String() {
//     return _val.toIso8601String();
//   }

//   @override
//   DateTime toLocal() {
//     return _val.toLocal();
//   }

//   @override
//   DateTime toUtc() {
//     return _val.toUtc();
//   }

//   @override
//   int get weekday => _val.weekday;

//   @override
//   int get year => _val.year;
// }

// class BaseListClass<T extends JsonBind> extends JsonBind implements List<T> {
//   final List<T> _val;
//   const BaseListClass(this._val);
//   factory BaseListClass.fromJson(dynamic data, T Function(dynamic, List<String>) factory, List<String> path) {
//     if (data is! Iterable) {
//       throw DataParsingError(factory: "BaseListClass.fromJson:", info: {'typeFound': data.runtimeType, 'expected': Iterable}, path: path, data: data);
//     }
//     return BaseListClass(List.generate(data.length, (i) => factory(data.elementAt(i), [...path, '{BaseListClass element: $i}'])));
//   }
//   static BaseListClass<T> Function(dynamic data, List<String> path) parse<T extends JsonBind>(T Function(dynamic, List<String>) factory) {
//     return (data, path) {
//       return BaseListClass.fromJson(data, factory, path);
//     };
//   }

//   @override
//   toJson() {
//     return _val.map((e) => e.toJson()).toList();
//   }

//   @override
//   T get first => _val.first;

//   @override
//   T get last => _val.last;

//   @override
//   int get length => _val.length;

//   @override
//   set first(T value) {
//     _val.first = value;
//   }

//   @override
//   set last(T value) {
//     _val.last = value;
//   }

//   @override
//   set length(int newLength) {
//     _val.length = newLength;
//   }

//   @override
//   List<T> operator +(List<T> other) {
//     return _val + other;
//   }

//   @override
//   T operator [](int index) {
//     return _val[index];
//   }

//   @override
//   void operator []=(int index, T value) {
//     _val[index] = value;
//   }

//   @override
//   void add(T value) {
//     return _val.add(value);
//   }

//   @override
//   void addAll(Iterable<T> iterable) {
//     return _val.addAll(iterable);
//   }

//   @override
//   bool any(bool Function(T element) test) {
//     return _val.any(test);
//   }

//   @override
//   Map<int, T> asMap() {
//     return _val.asMap();
//   }

//   @override
//   List<R> cast<R>() {
//     return _val.cast<R>();
//   }

//   @override
//   void clear() {
//     return _val.clear();
//   }

//   @override
//   bool contains(Object? element) {
//     return _val.contains(element);
//   }

//   @override
//   T elementAt(int index) {
//     return _val.elementAt(index);
//   }

//   @override
//   bool every(bool Function(T element) test) {
//     return _val.every(test);
//   }

//   @override
//   Iterable<E> expand<E>(Iterable<E> Function(T element) toElements) {
//     return _val.expand<E>(toElements);
//   }

//   @override
//   void fillRange(int start, int end, [T? fillValue]) {
//     return _val.fillRange(start, end, fillValue);
//   }

//   @override
//   T firstWhere(bool Function(T element) test, {T Function()? orElse}) {
//     return _val.firstWhere(test, orElse: orElse);
//   }

//   @override
//   E fold<E>(E initialValue, E Function(E previousValue, T element) combine) {
//     return _val.fold(initialValue, combine);
//   }

//   @override
//   Iterable<T> followedBy(Iterable<T> other) {
//     return _val.followedBy(other);
//   }

//   @override
//   void forEach(void Function(T element) action) {
//     return _val.forEach(action);
//   }

//   @override
//   Iterable<T> getRange(int start, int end) {
//     return _val.getRange(start, end);
//   }

//   @override
//   int indexOf(T element, [int start = 0]) {
//     return _val.indexOf(element, start);
//   }

//   @override
//   int indexWhere(bool Function(T element) test, [int start = 0]) {
//     return _val.indexWhere(test, start);
//   }

//   @override
//   void insert(int index, T element) {
//     return _val.insert(index, element);
//   }

//   @override
//   void insertAll(int index, Iterable<T> iterable) {
//     return _val.insertAll(index, iterable);
//   }

//   @override
//   bool get isEmpty => _val.isEmpty;

//   @override
//   bool get isNotEmpty => _val.isNotEmpty;

//   @override
//   Iterator<T> get iterator => _val.iterator;

//   @override
//   String join([String separator = ""]) {
//     return _val.join(separator);
//   }

//   @override
//   int lastIndexOf(T element, [int? start]) {
//     return _val.lastIndexOf(element, start);
//   }

//   @override
//   int lastIndexWhere(bool Function(T element) test, [int? start]) {
//     return _val.lastIndexWhere(test, start);
//   }

//   @override
//   T lastWhere(bool Function(T element) test, {T Function()? orElse}) {
//     return _val.lastWhere(test, orElse: orElse);
//   }

//   @override
//   Iterable<E> map<E>(E Function(T e) toElement) {
//     return _val.map(toElement);
//   }

//   @override
//   T reduce(T Function(T value, T element) combine) {
//     return _val.reduce(combine);
//   }

//   @override
//   bool remove(Object? value) {
//     return _val.remove(value);
//   }

//   @override
//   T removeAt(int index) {
//     return _val.removeAt(index);
//   }

//   @override
//   T removeLast() {
//     return _val.removeLast();
//   }

//   @override
//   void removeRange(int start, int end) {
//     return _val.removeRange(start, end);
//   }

//   @override
//   void removeWhere(bool Function(T element) test) {
//     return _val.removeWhere(test);
//   }

//   @override
//   void replaceRange(int start, int end, Iterable<T> replacements) {
//     return _val.replaceRange(start, end, replacements);
//   }

//   @override
//   void retainWhere(bool Function(T element) test) {
//     return _val.retainWhere(test);
//   }

//   @override
//   Iterable<T> get reversed => _val.reversed;

//   @override
//   void setAll(int index, Iterable<T> iterable) {
//     return _val.setAll(index, iterable);
//   }

//   @override
//   void setRange(int start, int end, Iterable<T> iterable, [int skipCount = 0]) {
//     return _val.setRange(start, end, iterable, skipCount);
//   }

//   @override
//   void shuffle([Random? random]) {
//     return _val.shuffle(random);
//   }

//   @override
//   T get single => _val.single;

//   @override
//   T singleWhere(bool Function(T element) test, {T Function()? orElse}) {
//     return _val.singleWhere(test, orElse: orElse);
//   }

//   @override
//   Iterable<T> skip(int count) {
//     return _val.skip(count);
//   }

//   @override
//   Iterable<T> skipWhile(bool Function(T value) test) {
//     return _val.skipWhile(test);
//   }

//   @override
//   void sort([int Function(T a, T b)? compare]) {
//     return _val.sort(compare);
//   }

//   @override
//   List<T> sublist(int start, [int? end]) {
//     return _val.sublist(start, end);
//   }

//   @override
//   Iterable<T> take(int count) {
//     return _val.take(count);
//   }

//   @override
//   Iterable<T> takeWhile(bool Function(T value) test) {
//     return _val.takeWhile(test);
//   }

//   @override
//   List<T> toList({bool growable = true}) {
//     return _val.toList(growable: growable);
//   }

//   @override
//   Set<T> toSet() {
//     return _val.toSet();
//   }

//   @override
//   Iterable<T> where(bool Function(T element) test) {
//     return _val.where(test);
//   }

//   @override
//   Iterable<E> whereType<E>() {
//     return _val.whereType<E>();
//   }
// }

// class BaseMapClass<K extends JsonBind, T extends JsonBind> extends JsonBind implements Map<K, T> {
//   final Map<K, T> _val;
//   const BaseMapClass(this._val);
//   factory BaseMapClass.fromJson(dynamic data, K Function(dynamic, List<String>) keyFactory, T Function(dynamic, List<String>) valueFactory, List<String> path) {
//     if (data is! Map) {
//       throw DataParsingError(factory: "BaseMapClass.fromJson:", info: {'typeFound': data.runtimeType, 'expected': Map}, path: path, data: data);
//     }
//     return BaseMapClass(data.map((key, value) => MapEntry(keyFactory(key, [...path, '{BaseMapClass key: $key}']), valueFactory(value, [...path, '{BaseMapClass value: $key}']))));
//   }
//   static BaseMapClass<K, T> Function(dynamic data, List<String> path) parse<K extends BaseTypedClass<String>, T extends JsonBind>(
//     K Function(dynamic, List<String>) keyFactory,
//     T Function(dynamic, List<String>) valueFactory,
//   ) {
//     return (data, path) {
//       return BaseMapClass.fromJson(data, keyFactory, valueFactory, path);
//     };
//   }

//   @override
//   toJson() {
//     return _val.map((key, value) => MapEntry(key.toJson(), value.toJson()));
//   }

//   @override
//   T? operator [](Object? key) {
//     return _val[key];
//   }

//   @override
//   void operator []=(K key, T value) {
//     _val[key] = value;
//   }

//   @override
//   void addAll(Map<K, T> other) {
//     _val.addAll(other);
//   }

//   @override
//   void addEntries(Iterable<MapEntry<K, T>> newEntries) {
//     _val.addEntries(newEntries);
//   }

//   @override
//   Map<RK, RV> cast<RK, RV>() {
//     return _val.cast<RK, RV>();
//   }

//   @override
//   void clear() {
//     _val.clear();
//   }

//   @override
//   bool containsKey(Object? key) {
//     return _val.containsKey(key);
//   }

//   @override
//   bool containsValue(Object? value) {
//     return _val.containsValue(value);
//   }

//   @override
//   Iterable<MapEntry<K, T>> get entries => _val.entries;

//   @override
//   void forEach(void Function(K key, T value) action) {
//     _val.forEach(action);
//   }

//   @override
//   bool get isEmpty => _val.isEmpty;

//   @override
//   bool get isNotEmpty => _val.isNotEmpty;

//   @override
//   Iterable<K> get keys => _val.keys;

//   @override
//   int get length => _val.length;

//   @override
//   Map<K2, V2> map<K2, V2>(MapEntry<K2, V2> Function(K key, T value) convert) {
//     return _val.map(convert);
//   }

//   @override
//   T putIfAbsent(K key, T Function() ifAbsent) {
//     return _val.putIfAbsent(key, ifAbsent);
//   }

//   @override
//   T? remove(Object? key) {
//     return _val.remove(key);
//   }

//   @override
//   void removeWhere(bool Function(K key, T value) test) {
//     _val.removeWhere(test);
//   }

//   @override
//   T update(K key, T Function(T value) update, {T Function()? ifAbsent}) {
//     return _val.update(key, update, ifAbsent: ifAbsent);
//   }

//   @override
//   void updateAll(T Function(K key, T value) update) {
//     _val.updateAll(update);
//   }

//   @override
//   Iterable<T> get values => _val.values;
// }

// class BaseStructClass extends JsonBind {
//   final Map<String, JsonBind?> _val;
//   const BaseStructClass(this._val);
//   factory BaseStructClass.fromJson(
//     dynamic data,
//     Map<String, JsonBind Function(dynamic data, List<String> path)> factories,
//     Set<String> required,
//     JsonBind Function(String key, dynamic data, List<String> path)? passthroughFactory,
//     List<String> path,
//   ) {
//     if (data is! Map) {
//       throw DataParsingError(factory: "BaseStructClass.fromJson:", info: {'typeFound': data.runtimeType, 'expected': Map}, path: path, data: data);
//     }
//     if (required.intersection(data.keys.toSet()).length != required.length) {
//       throw DataParsingError(factory: "BaseStructClass.fromJson:", info: {'requiredKeys': required, 'data': data}, path: path, data: data);
//     }
//     final json = <String, JsonBind?>{};
//     for (final entry in data.entries) {
//       final factory = factories[entry.key];
//       if (factory != null) {
//         if (required.contains(entry.key)) {
//           json[entry.key] = factory(entry.value, [...path, '{BaseStructClass required: \${entry.key}}']);
//         } else {
//           if (entry.value == null) {
//             json[entry.key] = null;
//           } else {
//             json[entry.key] = factory(entry.value, [...path, '{BaseStructClass optional: \${entry.key}}']);
//           }
//         }
//       } else if (passthroughFactory != null) {
//         json[entry.key] = passthroughFactory(entry.key, entry.value, [...path, '{BaseStructClass passthrough: \${entry.key}}']);
//       }
//     }
//     return BaseStructClass(json);
//   }
//   static BaseStructClass Function(dynamic data, List<String> path) parse(
//     Map<String, JsonBind Function(dynamic data, List<String> path)> factories,
//     Set<String> required,
//     JsonBind Function(String key, dynamic data, List<String> path)? passthroughFactory,
//   ) {
//     return (data, path) {
//       return BaseStructClass.fromJson(data, factories, required, passthroughFactory, path);
//     };
//   }

//   // class() is implemented by extended class with hard coded properties.
//   // factory.fromJson is implemented by extended class
//   // static.parse is implemented by extended class
//   @override
//   toJson() {
//     return _val.map((key, value) => MapEntry(key, value?.toJson()));
//   }

//   JsonBind? operator [](String key) {
//     return _val[key];
//   }

//   void operator []=(String key, JsonBind val) {
//     _val[key] = val;
//   }

//   T _get<T extends JsonBind?>(String key) {
//     final val = _val[key];
//     if (val is! T) {
//       throw DataRuntimeError('BaseStructClass._get: $key is not $T, but \${val.runtimeType}, val: $val');
//     }
//     return val;
//   }

//   void _set<T extends JsonBind?>(String key, dynamic val) {
//     if (val is! T) {
//       throw DataRuntimeError('BaseStructClass._set: $key is not $T, but \${val.runtimeType}, val: $val');
//     }
//     _val[key] = val;
//   }
// }

// class BaseDiscriminatorClass<T extends BaseStructClass> extends JsonBind {
//   final T _val;
//   const BaseDiscriminatorClass(this._val);
//   factory BaseDiscriminatorClass.fromJson(dynamic data, String key, Map<String, T Function(dynamic data, List<String> path)> factories, List<String> path) {
//     if (data is! Map) {
//       throw DataParsingError(factory: "BaseDiscriminatorClass.fromJson:", info: {'typeFound': data.runtimeType, 'expected': Map}, path: path, data: data);
//     }
//     final type = data[key];
//     if (type is! String) {
//       throw DataParsingError(factory: "BaseDiscriminatorClass.fromJson:", info: {'typeFound': type.runtimeType, 'expected': String}, path: path, data: data);
//     }
//     final factory = factories[type];
//     if (factory == null) {
//       throw DataParsingError(factory: "BaseDiscriminatorClass.fromJson:", info: {'typeFound': type, 'expected': factories.keys}, path: path, data: data);
//     }
//     return BaseDiscriminatorClass(factory(data, [...path, '{BaseDiscriminatorClass $key: $type}']));
//   }
//   static BaseDiscriminatorClass<T> Function(dynamic data, List<String> path) parse<T extends BaseStructClass>(String key, Map<String, T Function(dynamic data, List<String> path)> factories) {
//     return (data, path) {
//       return BaseDiscriminatorClass.fromJson(data, key, factories, path);
//     };
//   }

//   T get val => _val;

//   @override
//   toJson() {
//     return val.toJson();
//   }
// }

// enum Method { post, get, patch, put, delete, head, options, trace }

// class RequestClass<Path extends JsonBind?, Headers extends JsonBind?, Query extends JsonBind?, Body extends JsonBind?> extends JsonBind {
//   final Path path;
//   final Query query;
//   final Headers headers;
//   final Body body;
//   RequestClass({required this.body, required this.headers, required this.path, required this.query});

//   @override
//   toJson() {
//     return {'path': path?.toJson(), 'headers': headers?.toJson(), 'query': query?.toJson(), 'body': body?.toJson()};
//   }
// }

// class ResponseClass<Headers extends JsonBind, Body extends JsonBind> extends JsonBind {
//   final Headers headers;
//   final Body body;
//   ResponseClass({required this.body, required this.headers});
//   factory ResponseClass.fromJson(
//     Map<String, dynamic> headers,
//     dynamic body,
//     Headers Function(dynamic headers, List<String> path) headersFactory,
//     Body Function(dynamic body, List<String> path) bodyFactory,
//     List<String> path,
//   ) {
//     return ResponseClass<Headers, Body>(body: bodyFactory(body, [...path, '{ResponseClass body}']), headers: headersFactory(headers, [...path, '{ResponseClass headers}']));
//   }
//   static ResponseClass<Headers, Body> Function(Map<String, dynamic> headers, dynamic body, List<String> path) parser<Headers extends JsonBind, Body extends JsonBind>(
//     Headers Function(dynamic headers, List<String> path) headersFactory,
//     Body Function(dynamic body, List<String> path) bodyFactory,
//   ) {
//     return (headers, body, path) {
//       return ResponseClass.fromJson(headers, body, headersFactory, bodyFactory, path);
//     };
//   }

//   @override
//   toJson() {
//     return {'headers': headers.toJson(), 'body': body.toJson()};
//   }
// }

// class BaseApiClass<Request extends RequestClass, Response extends ResponseClass> {
//   BaseApiClass(this.request, {required this.path, required this.method, required this.responseFactory});
//   final String path;
//   final Method method;
//   final Request request;
//   final Response Function(Map<String, dynamic> headers, dynamic body) responseFactory;
// }
// `;

// const exe = FUNCTIONS.SyncFunction.build({
//   input: z.object({
//     json: zOpenAPIObject,
//     options: optionsSchema,
//   }),
//   output: optionsSchema.omit({
//     createRoutesFor: true,
//     createSchemaFor: true,
//   }),
//   wrappers: (_params) => [
//     FUNCTIONS.WRAPPERS.SafeParse({ _params }),
//     function ({ context, input, func, build }) {
//       json = input.json;
//       options = input.options;
//       structs = {};
//       enums = new Set();
//       return func({ context, input, build });
//     },
//   ],
//   func() {
//     if (options.FactoryClassCode) options.code += FactoryClassCode;
//     for (const schema of getAllSchemas(json, options)) {
//       dependency(schema.name);
//     }
//     for (const route of getAllRoutes(json, options)) {
//       createRouteCode(route.method, route.path, route.schema);
//     }
//     return options;
//   },
// });
// /**
//  * Generate Typescript code
//  */
// export const genDartCode: GenCodeFn<typeof optionsSchema> = exe;

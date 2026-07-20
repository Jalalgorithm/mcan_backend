import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

const isCompiled = __filename.endsWith(".js");

const swaggerDefinition: swaggerJSDoc.OAS3Definition = {
  openapi: "3.0.3",
  info: {
    title: "MCAN Southwest Backend API",
    version: "1.0.0",
    description:
      "API documentation for the MCAN Southwest backend. Use the Authorize button with a bearer access token to test protected routes.",
  },
  servers: [
    { url: "/api", description: "Current server" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object", nullable: true },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: { type: "object", nullable: true },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const apisGlob = path
  .join(__dirname, isCompiled ? "../modules/**/*.routes.js" : "../modules/**/*.routes.ts")
  .split(path.sep)
  .join("/");

export const swaggerSpec = swaggerJSDoc({
  swaggerDefinition,
  apis: [apisGlob],
});

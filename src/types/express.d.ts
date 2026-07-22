import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: "member" | "admin" | "superadmin";
      };
      /**
       * Express 5's req.query is a getter that re-parses the raw URL on every access,
       * so it can't be mutated in place. validate() stores the coerced/defaulted query
       * here instead — read this, not req.query, after a route uses validate({ query }).
       */
      validatedQuery?: Record<string, unknown>;
    }
  }
}

import "express-session";

declare module "express-session" {
  interface SessionData {
    customer?: {
      id: string;
      email: string;
    };
    security?: {
      ipAddress?: string;
      userAgent?: string;
    };
  }
}

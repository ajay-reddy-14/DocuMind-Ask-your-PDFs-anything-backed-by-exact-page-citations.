import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validates req.body against a Zod schema.
 * On failure returns a 400 with field-level error messages.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({ success: false, error: 'Validation failed.', details: errors });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.params against a Zod schema.
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({ success: false, error: 'Invalid request parameters.', details: errors });
      return;
    }
    req.params = result.data as Record<string, string>;
    next();
  };
}

function formatZodErrors(error: ZodError): Record<string, string> {
  return error.issues.reduce(
    (acc, issue) => {
      const path = issue.path.join('.');
      acc[path || '_'] = issue.message;
      return acc;
    },
    {} as Record<string, string>
  );
}


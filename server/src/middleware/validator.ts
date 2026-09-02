import { validator } from "hono/validator";
import { Schema } from "effect";
import type { ValidationTargets } from "hono";

export function effectValidator<
  Target extends keyof ValidationTargets,
  S extends Schema.Decoder<any>
>(
  target: Target,
  schema: S
) {
  const decode = Schema.decodeUnknownSync(schema);
  return validator(target, (value, c) => {
    try {
      // SAFETY: Schema.decodeUnknownSync validates untrusted payload and guarantees it matches S["Type"]
      return decode(value) as S["Type"];
    } catch (error) {
      return c.json(
        {
          error: "Validation failed",
          details: error instanceof Error ? error.message : String(error)
        },
        400
      );
    }
  });
}

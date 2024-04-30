import { ValidationError } from 'class-validator';

export function flattenValidationErrors(errors: ValidationError[]) {
  return errors
    .map((error) => {
      const constraints = error.constraints;
      if (constraints) {
        return Object.values(constraints).join(', ');
      }
      return flattenValidationErrors(error.children);
    })
    .join(', ');
}

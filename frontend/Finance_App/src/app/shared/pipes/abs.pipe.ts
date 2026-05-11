import { Pipe, PipeTransform } from '@angular/core';

/** Returns the absolute value of a number. Useful for displaying expense amounts as positive. */
@Pipe({ name: 'abs', standalone: true, pure: true })
export class AbsPipe implements PipeTransform {
  transform(value: number): number {
    return Math.abs(value);
  }
}

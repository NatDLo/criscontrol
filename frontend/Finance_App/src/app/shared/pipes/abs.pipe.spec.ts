import { AbsPipe } from './abs.pipe';

describe('AbsPipe', () => {
  it('returns the absolute value', () => {
    const pipe = new AbsPipe();
    expect(pipe.transform(-12)).toBe(12);
    expect(pipe.transform(12)).toBe(12);
    expect(pipe.transform(0)).toBe(0);
  });
});

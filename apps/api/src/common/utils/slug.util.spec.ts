import { toSlug } from './slug.util.js';

describe('toSlug', () => {
  it('handles accented characters', () => {
    expect(toSlug('Estufas e Inducción')).toBe('estufas-e-induccion');
  });

  it('handles ñ and other Spanish characters', () => {
    expect(toSlug('Máquinas para Paninis')).toBe('maquinas-para-paninis');
  });

  it('collapses multiple spaces', () => {
    expect(toSlug('Café  Especialidad')).toBe('cafe-especialidad');
  });
});

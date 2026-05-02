import { Set } from '../set.entity';

describe('Set entity', () => {
  it('preserves an optional training note', () => {
    const set = new Set(1, 'user-1', 2, 1, 45.5, 5, 'Right knee felt tight at the bottom.');

    expect(set.note).toBe('Right knee felt tight at the bottom.');
    expect(set.toPersistence().note).toBe('Right knee felt tight at the bottom.');
  });

  it('updates weight, reps, and note together', () => {
    const set = new Set(1, 'user-1', 2, 1, 45, 5, null);

    const updated = set.update(47.5, 4, 'Brace felt better with slower descent.');

    expect(updated.weight).toBe(47.5);
    expect(updated.reps).toBe(4);
    expect(updated.note).toBe('Brace felt better with slower descent.');
  });

  it('can clear an existing note', () => {
    const set = new Set(1, 'user-1', 2, 1, 45, 5, 'Left shoulder felt pinchy.');

    const updated = set.update(45, 5, null);

    expect(updated.note).toBeNull();
  });
});

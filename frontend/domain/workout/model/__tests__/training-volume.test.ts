import {
  calculateExerciseVolume,
  calculateSetVolume,
  calculateWorkoutVolume,
} from '../training-volume';

describe('training volume', () => {
  it('calculates one set from weight and reps', () => {
    expect(calculateSetVolume({ weight: 100, reps: 5 })).toBe(500);
  });

  it('sums every set in an exercise and preserves decimal weights', () => {
    expect(
      calculateExerciseVolume({
        sets: [
          { weight: 42.5, reps: 8 },
          { weight: 45, reps: 6 },
        ],
      })
    ).toBe(610);
  });

  it('sums multiple exercises for the workout total', () => {
    expect(
      calculateWorkoutVolume([
        { sets: [{ weight: 100, reps: 5 }] },
        {
          sets: [
            { weight: 60, reps: 10 },
            { weight: 0, reps: 12 },
          ],
        },
      ])
    ).toBe(1100);
  });

  it('returns zero when there are no recorded sets', () => {
    expect(calculateExerciseVolume({ sets: [] })).toBe(0);
    expect(calculateWorkoutVolume([])).toBe(0);
  });
});

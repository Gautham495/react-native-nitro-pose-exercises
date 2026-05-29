import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const HIP_ABDUCTION_CONFIG: ExerciseConfig = {
  name: 'Hip Abduction Standing',
  type: 'rep',
  angles: [
    { name: 'legSpread', landmarkA: 25, landmarkB: 23, landmarkC: 24 },
    { name: 'standingLeg', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'down', angleName: 'legSpread', minAngle: 0, maxAngle: 15 },
    { phase: 'up', angleName: 'legSpread', minAngle: 30, maxAngle: 60 },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'leaningOver',
      message: "Keep your torso upright — don't lean",
      severity: 'warning',
      angleName: 'standingLeg',
      minAngle: 165,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};

import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const EXTENDED_SIDE_ANGLE_CONFIG: ExerciseConfig = {
  name: 'Extended Side Angle (Utthita Parsvakonasana)',
  type: 'hold',
  angles: [
    { name: 'frontKnee', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
    { name: 'backLeg', landmarkA: 24, landmarkB: 26, landmarkC: 28 },
    { name: 'topArm', landmarkA: 12, landmarkB: 14, landmarkC: 16 },
  ],
  phases: [
    { phase: 'hold', angleName: 'frontKnee', minAngle: 80, maxAngle: 110 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'backLegBent',
      message: 'Straighten your back leg',
      severity: 'warning',
      angleName: 'backLeg',
      minAngle: 160,
      maxAngle: 180,
    },
    {
      name: 'topArmBent',
      message: 'Extend your top arm fully',
      severity: 'info',
      angleName: 'topArm',
      minAngle: 160,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000,
};

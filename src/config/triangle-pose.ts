import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

export const TRIANGLE_POSE_CONFIG: ExerciseConfig = {
  name: 'Triangle Pose (Trikonasana)',
  type: 'hold',
  angles: [
    { name: 'frontLeg', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
    { name: 'backLeg', landmarkA: 24, landmarkB: 26, landmarkC: 28 },
    { name: 'torsoLateral', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
  ],
  phases: [
    { phase: 'hold', angleName: 'frontLeg', minAngle: 160, maxAngle: 180 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'frontKneeBending',
      message: 'Keep your front leg straight',
      severity: 'warning',
      angleName: 'frontLeg',
      minAngle: 160,
      maxAngle: 180,
    },
    {
      name: 'backKneeBending',
      message: 'Straighten your back leg',
      severity: 'warning',
      angleName: 'backLeg',
      minAngle: 160,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000,
};

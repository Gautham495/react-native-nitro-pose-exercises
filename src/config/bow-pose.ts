import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const BOW_POSE_CONFIG: ExerciseConfig = {
  name: 'Bow Pose (Dhanurasana)',
  type: 'hold',
  angles: [
    { name: 'kneeAngle', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
    { name: 'shoulderExtension', landmarkA: 23, landmarkB: 11, landmarkC: 15 },
  ],
  phases: [
    { phase: 'hold', angleName: 'kneeAngle', minAngle: 50, maxAngle: 100 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'kneesTooWide',
      message: 'Keep your knees hip-width apart',
      severity: 'warning',
      angleName: 'kneeAngle',
      minAngle: 50,
      maxAngle: 100,
    },
  ],
  holdDurationMs: 30000,
};

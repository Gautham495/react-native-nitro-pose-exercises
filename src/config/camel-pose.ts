import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const CAMEL_POSE_CONFIG: ExerciseConfig = {
  name: 'Camel Pose (Ustrasana)',
  type: 'hold',
  angles: [
    { name: 'hipExtension', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'kneeAngle', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'hold', angleName: 'hipExtension', minAngle: 120, maxAngle: 165 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'kneesTooWide',
      message: 'Keep knees hip-width apart',
      severity: 'warning',
      angleName: 'kneeAngle',
      minAngle: 80,
      maxAngle: 100,
    },
  ],
  holdDurationMs: 30000,
};

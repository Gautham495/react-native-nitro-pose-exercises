import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const GLUTE_BRIDGE_CONFIG: ExerciseConfig = {
  name: 'Glute Bridge',
  type: 'rep',
  angles: [
    { name: 'hipExtension', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'kneeAngle', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'down', angleName: 'hipExtension', minAngle: 80, maxAngle: 120 },
    { phase: 'up', angleName: 'hipExtension', minAngle: 155, maxAngle: 180 },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'hipsNotHigh',
      message: 'Squeeze your glutes — push hips higher',
      severity: 'warning',
      angleName: 'hipExtension',
      minAngle: 150,
      maxAngle: 180,
    },
    {
      name: 'kneesTooWide',
      message: 'Keep knees hip-width apart',
      severity: 'info',
      angleName: 'kneeAngle',
      minAngle: 75,
      maxAngle: 110,
    },
  ],
  holdDurationMs: 0,
};

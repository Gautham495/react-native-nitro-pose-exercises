import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

export const BRIDGE_POSE_CONFIG: ExerciseConfig = {
  name: 'Bridge Pose (Setu Bandhasana)',
  type: 'hold',
  angles: [
    { name: 'hipExtension', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'kneeAngle', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'hold', angleName: 'kneeAngle', minAngle: 80, maxAngle: 110 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'hipsLow',
      message: 'Push your hips up higher',
      severity: 'warning',
      angleName: 'hipExtension',
      minAngle: 140,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000,
};

import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

export const FISH_POSE_CONFIG: ExerciseConfig = {
  name: 'Fish Pose (Matsyasana)',
  type: 'hold',
  angles: [
    { name: 'chestOpen', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'legs', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'hold', angleName: 'chestOpen', minAngle: 130, maxAngle: 170 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'legsNotStraight',
      message: 'Keep your legs straight and together',
      severity: 'info',
      angleName: 'legs',
      minAngle: 165,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000,
};

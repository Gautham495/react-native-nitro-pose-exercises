import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

export const BOAT_POSE_CONFIG: ExerciseConfig = {
  name: 'Boat Pose (Navasana)',
  type: 'hold',
  angles: [
    { name: 'hipFlexion', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'kneeAngle', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'hold', angleName: 'hipFlexion', minAngle: 60, maxAngle: 110 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'backRounding',
      message: "Lengthen your spine — don't round your back",
      severity: 'warning',
      angleName: 'hipFlexion',
      minAngle: 60,
      maxAngle: 110,
    },
    {
      name: 'legsDropping',
      message: 'Keep your legs lifted',
      severity: 'warning',
      angleName: 'kneeAngle',
      minAngle: 150,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000,
};

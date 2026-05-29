import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

export const DEADLIFT_CONFIG: ExerciseConfig = {
  name: 'Deadlift',
  type: 'rep',
  angles: [
    { name: 'leftHip', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'rightHip', landmarkA: 12, landmarkB: 24, landmarkC: 26 },
    { name: 'leftKnee', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'up', angleName: 'leftHip', minAngle: 160, maxAngle: 180 },
    { phase: 'down', angleName: 'leftHip', minAngle: 60, maxAngle: 120 },
  ],
  repSequence: ['up', 'down', 'up'],
  formRules: [
    {
      name: 'roundedBack',
      message: "Keep your back straight — don't round your spine",
      severity: 'error',
      angleName: 'leftHip',
      minAngle: 50,
      maxAngle: 180,
    },
    {
      name: 'kneesTooForward',
      message: 'Push your hips back — knees stay behind toes',
      severity: 'warning',
      angleName: 'leftKnee',
      minAngle: 140,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};

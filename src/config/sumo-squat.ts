import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const SUMO_SQUAT_CONFIG: ExerciseConfig = {
  name: 'Sumo Squat',
  type: 'rep',
  angles: [
    { name: 'leftKnee', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
    { name: 'rightKnee', landmarkA: 24, landmarkB: 26, landmarkC: 28 },
    { name: 'hipAngle', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
  ],
  phases: [
    { phase: 'up', angleName: 'leftKnee', minAngle: 155, maxAngle: 180 },
    { phase: 'down', angleName: 'leftKnee', minAngle: 60, maxAngle: 110 },
  ],
  repSequence: ['up', 'down', 'up'],
  formRules: [
    {
      name: 'kneesNotTracking',
      message: 'Push knees out over your toes',
      severity: 'warning',
      angleName: 'leftKnee',
      minAngle: 50,
      maxAngle: 180,
    },
    {
      name: 'leaningForward',
      message: 'Keep your torso upright',
      severity: 'warning',
      angleName: 'hipAngle',
      minAngle: 80,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};

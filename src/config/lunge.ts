import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 23 = left hip, 25 = left knee, 27 = left ankle
// 24 = right hip, 26 = right knee, 28 = right ankle
// 11 = left shoulder, 12 = right shoulder

export const LUNGE_CONFIG: ExerciseConfig = {
  name: 'Lunge',
  type: 'rep',
  angles: [
    {
      name: 'frontKnee',
      landmarkA: 23, // left hip
      landmarkB: 25, // left knee (vertex)
      landmarkC: 27, // left ankle
    },
    {
      name: 'backKnee',
      landmarkA: 24, // right hip
      landmarkB: 26, // right knee (vertex)
      landmarkC: 28, // right ankle
    },
    {
      name: 'torsoAngle',
      landmarkA: 11, // left shoulder
      landmarkB: 23, // left hip (vertex)
      landmarkC: 25, // left knee
    },
  ],
  phases: [
    {
      phase: 'up',
      angleName: 'frontKnee',
      minAngle: 155,
      maxAngle: 180,
    },
    {
      phase: 'down',
      angleName: 'frontKnee',
      minAngle: 70,
      maxAngle: 110,
    },
  ],
  repSequence: ['up', 'down', 'up'],
  formRules: [
    {
      name: 'kneeOverToe',
      message: "Don't let your front knee go past your toes",
      severity: 'warning',
      angleName: 'frontKnee',
      minAngle: 75,
      maxAngle: 180,
    },
    {
      name: 'torsoLean',
      message: 'Keep your torso upright',
      severity: 'warning',
      angleName: 'torsoAngle',
      minAngle: 75,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};

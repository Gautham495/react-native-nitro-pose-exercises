import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 13 = left elbow, 15 = left wrist
// 12 = right shoulder, 14 = right elbow, 16 = right wrist
// 23 = left hip, 25 = left knee, 27 = left ankle

export const COBRA_POSE_CONFIG: ExerciseConfig = {
  name: 'Cobra Pose (Bhujangasana)',
  type: 'hold',
  angles: [
    {
      name: 'leftElbow',
      landmarkA: 11, // left shoulder
      landmarkB: 13, // left elbow (vertex)
      landmarkC: 15, // left wrist
    },
    {
      name: 'hipExtension',
      landmarkA: 11, // left shoulder
      landmarkB: 23, // left hip (vertex)
      landmarkC: 25, // left knee
    },
    {
      name: 'legStraight',
      landmarkA: 23, // left hip
      landmarkB: 25, // left knee (vertex)
      landmarkC: 27, // left ankle
    },
  ],
  phases: [
    {
      phase: 'hold',
      angleName: 'hipExtension',
      minAngle: 120,
      maxAngle: 170,
    },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'shouldersTensed',
      message: 'Relax your shoulders away from your ears',
      severity: 'info',
      angleName: 'leftElbow',
      minAngle: 140,
      maxAngle: 180,
    },
    {
      name: 'legsBending',
      message: 'Keep your legs straight and pressed into the floor',
      severity: 'warning',
      angleName: 'legStraight',
      minAngle: 160,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000, // 30 seconds
};

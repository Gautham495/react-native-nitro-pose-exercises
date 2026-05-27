import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 23 = left hip, 25 = left knee, 27 = left ankle
// 24 = right hip, 26 = right knee, 28 = right ankle
// 11 = left shoulder, 12 = right shoulder

export const TREE_POSE_CONFIG: ExerciseConfig = {
  name: 'Tree Pose (Vrksasana)',
  type: 'hold',
  angles: [
    {
      name: 'standingLeg',
      landmarkA: 23, // left hip
      landmarkB: 25, // left knee (vertex)
      landmarkC: 27, // left ankle
    },
    {
      name: 'raisedKnee',
      landmarkA: 24, // right hip
      landmarkB: 26, // right knee (vertex)
      landmarkC: 28, // right ankle
    },
    {
      name: 'torso',
      landmarkA: 11, // left shoulder
      landmarkB: 23, // left hip (vertex)
      landmarkC: 25, // left knee
    },
  ],
  phases: [
    {
      phase: 'hold',
      angleName: 'standingLeg',
      minAngle: 165,
      maxAngle: 180,
    },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'standingLegBent',
      message: 'Straighten your standing leg',
      severity: 'warning',
      angleName: 'standingLeg',
      minAngle: 165,
      maxAngle: 180,
    },
    {
      name: 'leaningTorso',
      message: 'Keep your torso straight and centered',
      severity: 'warning',
      angleName: 'torso',
      minAngle: 160,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000, // 30 seconds per side
};

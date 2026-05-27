import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 13 = left elbow, 15 = left wrist
// 23 = left hip, 27 = left ankle
// 12 = right shoulder, 24 = right hip, 28 = right ankle

export const PLANK_CONFIG: ExerciseConfig = {
  name: 'Plank',
  type: 'hold',
  angles: [
    {
      name: 'leftHip',
      landmarkA: 11, // left shoulder
      landmarkB: 23, // left hip (vertex)
      landmarkC: 27, // left ankle
    },
    {
      name: 'rightHip',
      landmarkA: 12, // right shoulder
      landmarkB: 24, // right hip (vertex)
      landmarkC: 28, // right ankle
    },
    {
      name: 'leftElbow',
      landmarkA: 11, // left shoulder
      landmarkB: 13, // left elbow (vertex)
      landmarkC: 15, // left wrist
    },
  ],
  phases: [
    {
      phase: 'hold',
      angleName: 'leftHip',
      minAngle: 155,
      maxAngle: 180,
    },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'hipSag',
      message: 'Hips are dropping — tighten your core',
      severity: 'warning',
      angleName: 'leftHip',
      minAngle: 155,
      maxAngle: 180,
    },
    {
      name: 'hipPike',
      message: "Lower your hips — you're piking up",
      severity: 'warning',
      angleName: 'leftHip',
      minAngle: 155,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 60000, // 60 seconds default
};

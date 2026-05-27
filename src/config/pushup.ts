import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 13 = left elbow, 15 = left wrist
// 12 = right shoulder, 14 = right elbow, 16 = right wrist
// 23 = left hip, 25 = left knee, 27 = left ankle
// 24 = right hip, 26 = right knee, 28 = right ankle

export const PUSHUP_CONFIG: ExerciseConfig = {
  name: 'Push-Up',
  type: 'rep',
  angles: [
    {
      name: 'leftElbow',
      landmarkA: 11, // left shoulder
      landmarkB: 13, // left elbow (vertex)
      landmarkC: 15, // left wrist
    },
    {
      name: 'rightElbow',
      landmarkA: 12, // right shoulder
      landmarkB: 14, // right elbow (vertex)
      landmarkC: 16, // right wrist
    },
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
  ],
  phases: [
    { phase: 'up', angleName: 'leftElbow', minAngle: 150, maxAngle: 180 },
    { phase: 'down', angleName: 'leftElbow', minAngle: 30, maxAngle: 90 },
  ],
  repSequence: ['up', 'down', 'up'],
  formRules: [
    {
      name: 'hipSag',
      message: 'Keep your hips up — your body should be a straight line',
      severity: 'warning',
      angleName: 'leftHip',
      minAngle: 160, // body should be mostly straight
      maxAngle: 180,
    },
    {
      name: 'hipPike',
      message: "Lower your hips — you're piking up",
      severity: 'warning',
      angleName: 'leftHip',
      minAngle: 160,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0, // not a hold exercise
};

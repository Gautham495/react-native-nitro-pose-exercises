import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 13 = left elbow, 15 = left wrist
// 12 = right shoulder, 14 = right elbow, 16 = right wrist
// 23 = left hip

export const SHOULDER_PRESS_CONFIG: ExerciseConfig = {
  name: 'Shoulder Press',
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
      name: 'leftShoulderAngle',
      landmarkA: 23, // left hip
      landmarkB: 11, // left shoulder (vertex)
      landmarkC: 13, // left elbow
    },
    {
      name: 'rightShoulderAngle',
      landmarkA: 24, // right hip
      landmarkB: 12, // right shoulder (vertex)
      landmarkC: 14, // right elbow
    },
  ],
  phases: [
    {
      phase: 'up',
      angleName: 'leftElbow',
      minAngle: 155,
      maxAngle: 180,
    },
    {
      phase: 'down',
      angleName: 'leftElbow',
      minAngle: 60,
      maxAngle: 100,
    },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'backArch',
      message: "Keep your core tight — don't arch your back",
      severity: 'warning',
      angleName: 'leftShoulderAngle',
      minAngle: 80,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};

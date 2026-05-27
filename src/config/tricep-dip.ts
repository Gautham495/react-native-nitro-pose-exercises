import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 13 = left elbow, 15 = left wrist
// 12 = right shoulder, 14 = right elbow, 16 = right wrist
// 23 = left hip

export const TRICEP_DIP_CONFIG: ExerciseConfig = {
  name: 'Tricep Dip',
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
      name: 'shoulderDrop',
      landmarkA: 23, // left hip
      landmarkB: 11, // left shoulder (vertex)
      landmarkC: 13, // left elbow
    },
  ],
  phases: [
    {
      phase: 'up',
      angleName: 'leftElbow',
      minAngle: 150,
      maxAngle: 180,
    },
    {
      phase: 'down',
      angleName: 'leftElbow',
      minAngle: 60,
      maxAngle: 100,
    },
  ],
  repSequence: ['up', 'down', 'up'],
  formRules: [
    {
      name: 'goingTooDeep',
      message:
        "Don't go too deep — stop at 90 degrees to protect your shoulders",
      severity: 'error',
      angleName: 'leftElbow',
      minAngle: 55,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};

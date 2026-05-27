import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 13 = left elbow, 15 = left wrist
// 12 = right shoulder, 14 = right elbow, 16 = right wrist

export const BICEP_CURL_CONFIG: ExerciseConfig = {
  name: 'Bicep Curl',
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
      name: 'leftShoulder',
      landmarkA: 23, // left hip
      landmarkB: 11, // left shoulder (vertex)
      landmarkC: 13, // left elbow
    },
  ],
  phases: [
    {
      phase: 'down',
      angleName: 'leftElbow',
      minAngle: 150,
      maxAngle: 180,
    },
    {
      phase: 'up',
      angleName: 'leftElbow',
      minAngle: 25,
      maxAngle: 70,
    },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'elbowFlare',
      message: 'Keep your elbows pinned to your sides',
      severity: 'warning',
      angleName: 'leftShoulder',
      minAngle: 0,
      maxAngle: 30,
    },
    {
      name: 'swinging',
      message: "Don't swing — control the movement",
      severity: 'error',
      angleName: 'leftShoulder',
      minAngle: 0,
      maxAngle: 45,
    },
  ],
  holdDurationMs: 0,
};

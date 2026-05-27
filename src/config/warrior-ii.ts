import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 13 = left elbow, 15 = left wrist
// 12 = right shoulder, 14 = right elbow, 16 = right wrist
// 23 = left hip, 25 = left knee, 27 = left ankle
// 24 = right hip, 26 = right knee, 28 = right ankle

export const WARRIOR_II_CONFIG: ExerciseConfig = {
  name: 'Warrior II (Virabhadrasana II)',
  type: 'hold',
  angles: [
    {
      name: 'frontKnee',
      landmarkA: 23, // left hip
      landmarkB: 25, // left knee (vertex)
      landmarkC: 27, // left ankle
    },
    {
      name: 'backLeg',
      landmarkA: 24, // right hip
      landmarkB: 26, // right knee (vertex)
      landmarkC: 28, // right ankle
    },
    {
      name: 'leftArm',
      landmarkA: 11, // left shoulder
      landmarkB: 13, // left elbow (vertex)
      landmarkC: 15, // left wrist
    },
    {
      name: 'rightArm',
      landmarkA: 12, // right shoulder
      landmarkB: 14, // right elbow (vertex)
      landmarkC: 16, // right wrist
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
      angleName: 'frontKnee',
      minAngle: 80,
      maxAngle: 110,
    },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'frontKneeTooStraight',
      message: 'Bend your front knee deeper — stack it over your ankle',
      severity: 'warning',
      angleName: 'frontKnee',
      minAngle: 80,
      maxAngle: 110,
    },
    {
      name: 'backLegBent',
      message: 'Straighten your back leg fully',
      severity: 'warning',
      angleName: 'backLeg',
      minAngle: 160,
      maxAngle: 180,
    },
    {
      name: 'leftArmDrooping',
      message: 'Extend your arms out fully — keep them level',
      severity: 'info',
      angleName: 'leftArm',
      minAngle: 160,
      maxAngle: 180,
    },
    {
      name: 'rightArmDrooping',
      message: 'Extend your back arm out fully',
      severity: 'info',
      angleName: 'rightArm',
      minAngle: 160,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000, // 30 seconds per side
};

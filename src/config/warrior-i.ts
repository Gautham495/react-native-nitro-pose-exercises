import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 13 = left elbow, 15 = left wrist
// 12 = right shoulder, 14 = right elbow, 16 = right wrist
// 23 = left hip, 25 = left knee, 27 = left ankle
// 24 = right hip, 26 = right knee, 28 = right ankle

export const WARRIOR_I_CONFIG: ExerciseConfig = {
  name: 'Warrior I (Virabhadrasana I)',
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
      message: 'Bend your front knee deeper — aim for 90 degrees',
      severity: 'warning',
      angleName: 'frontKnee',
      minAngle: 80,
      maxAngle: 110,
    },
    {
      name: 'backLegBent',
      message: 'Keep your back leg straight and strong',
      severity: 'warning',
      angleName: 'backLeg',
      minAngle: 155,
      maxAngle: 180,
    },
    {
      name: 'armsNotExtended',
      message: 'Reach your arms up fully — straighten your elbows',
      severity: 'info',
      angleName: 'leftArm',
      minAngle: 160,
      maxAngle: 180,
    },
    {
      name: 'torsoLeaning',
      message: 'Keep your torso upright over your hips',
      severity: 'warning',
      angleName: 'torso',
      minAngle: 80,
      maxAngle: 110,
    },
  ],
  holdDurationMs: 30000, // 30 seconds per side
};

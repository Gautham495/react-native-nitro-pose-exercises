import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 13 = left elbow, 15 = left wrist
// 12 = right shoulder, 14 = right elbow, 16 = right wrist
// 23 = left hip, 25 = left knee, 27 = left ankle
// 24 = right hip, 26 = right knee, 28 = right ankle

export const DOWNWARD_DOG_CONFIG: ExerciseConfig = {
  name: 'Downward Dog (Adho Mukha Svanasana)',
  type: 'hold',
  angles: [
    {
      name: 'hipAngle',
      landmarkA: 11, // left shoulder
      landmarkB: 23, // left hip (vertex)
      landmarkC: 27, // left ankle
    },
    {
      name: 'leftArm',
      landmarkA: 11, // left shoulder
      landmarkB: 13, // left elbow (vertex)
      landmarkC: 15, // left wrist
    },
    {
      name: 'leftLeg',
      landmarkA: 23, // left hip
      landmarkB: 25, // left knee (vertex)
      landmarkC: 27, // left ankle
    },
  ],
  phases: [
    {
      phase: 'hold',
      angleName: 'hipAngle',
      minAngle: 55,
      maxAngle: 100,
    },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'armsBent',
      message: 'Straighten your arms — push the floor away',
      severity: 'warning',
      angleName: 'leftArm',
      minAngle: 160,
      maxAngle: 180,
    },
    {
      name: 'legsBent',
      message: 'Straighten your legs — press your heels toward the ground',
      severity: 'info',
      angleName: 'leftLeg',
      minAngle: 155,
      maxAngle: 180,
    },
    {
      name: 'hipsTooLow',
      message: 'Push your hips up higher toward the ceiling',
      severity: 'warning',
      angleName: 'hipAngle',
      minAngle: 55,
      maxAngle: 100,
    },
  ],
  holdDurationMs: 30000, // 30 seconds
};

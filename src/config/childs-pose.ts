import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const CHILDS_POSE_CONFIG: ExerciseConfig = {
  name: "Child's Pose (Balasana)",
  type: 'hold',
  angles: [
    { name: 'hipFold', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'kneeAngle', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
    { name: 'arms', landmarkA: 11, landmarkB: 13, landmarkC: 15 },
  ],
  phases: [{ phase: 'hold', angleName: 'hipFold', minAngle: 30, maxAngle: 80 }],
  repSequence: [],
  formRules: [
    {
      name: 'notRelaxing',
      message: 'Relax into the pose — let your forehead rest',
      severity: 'info',
      angleName: 'hipFold',
      minAngle: 30,
      maxAngle: 80,
    },
  ],
  holdDurationMs: 60000,
};

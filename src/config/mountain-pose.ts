import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const MOUNTAIN_POSE_CONFIG: ExerciseConfig = {
  name: 'Mountain Pose (Tadasana)',
  type: 'hold',
  angles: [
    { name: 'leftKnee', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
    { name: 'hipAngle', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'shoulderAlignment', landmarkA: 23, landmarkB: 11, landmarkC: 13 },
  ],
  phases: [
    { phase: 'hold', angleName: 'leftKnee', minAngle: 170, maxAngle: 180 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'slouching',
      message: 'Stand tall — lengthen your spine',
      severity: 'info',
      angleName: 'hipAngle',
      minAngle: 170,
      maxAngle: 180,
    },
    {
      name: 'shouldersTense',
      message: 'Relax your shoulders down',
      severity: 'info',
      angleName: 'shoulderAlignment',
      minAngle: 5,
      maxAngle: 25,
    },
  ],
  holdDurationMs: 30000,
};

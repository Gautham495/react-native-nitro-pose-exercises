import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const WARRIOR_III_CONFIG: ExerciseConfig = {
  name: 'Warrior III (Virabhadrasana III)',
  type: 'hold',
  angles: [
    { name: 'standingLeg', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
    { name: 'hipHinge', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'raisedLeg', landmarkA: 12, landmarkB: 24, landmarkC: 28 },
    { name: 'arms', landmarkA: 11, landmarkB: 13, landmarkC: 15 },
  ],
  phases: [
    { phase: 'hold', angleName: 'hipHinge', minAngle: 70, maxAngle: 110 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'standingLegBent',
      message: 'Straighten your standing leg',
      severity: 'warning',
      angleName: 'standingLeg',
      minAngle: 165,
      maxAngle: 180,
    },
    {
      name: 'raisedLegLow',
      message: 'Lift your back leg parallel to the floor',
      severity: 'info',
      angleName: 'raisedLeg',
      minAngle: 155,
      maxAngle: 180,
    },
    {
      name: 'armsNotExtended',
      message: 'Reach your arms forward',
      severity: 'info',
      angleName: 'arms',
      minAngle: 160,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000,
};

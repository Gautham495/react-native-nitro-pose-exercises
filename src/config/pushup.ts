import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 13 = left elbow, 15 = left wrist
// 12 = right shoulder, 14 = right elbow, 16 = right wrist
// 23 = left hip, 25 = left knee, 27 = left ankle
// 24 = right hip, 26 = right knee, 28 = right ankle

export const PUSHUP_CONFIG: ExerciseConfig = {
  name: 'Push-Up',
  type: 'rep',
  postureFamily: 'none',
  visibilityThreshold: 0.3,
  cameraAngle: 'front',
  angles: [
    { name: 'leftElbow', landmarkA: 11, landmarkB: 13, landmarkC: 15 },
    { name: 'rightElbow', landmarkA: 12, landmarkB: 14, landmarkC: 16 },
  ],
  phases: [
    // Calibrated for 2D-projected angles in front-facing portrait filming.
    // Real anatomical 180° appears as ~140-150° due to perspective foreshortening.
    { phase: 'up', angleName: 'leftElbow', minAngle: 130, maxAngle: 180 },
    { phase: 'down', angleName: 'leftElbow', minAngle: 40, maxAngle: 80 },
  ],
  repSequence: ['up', 'down', 'up'],
  formRules: [
    // Trigger when descending but stalled above true-down threshold
    {
      name: 'shallowRep',
      message: 'Go lower',
      severity: 'info',
      angleName: 'leftElbow',
      minAngle: 80,
      maxAngle: 130, // "limbo zone" — too low to be up, too high to be down
      // Note: ideally this only fires when angle has stalled, not on the way down.
      // If your formRule engine doesn't support velocity/stall detection,
      // accept that it'll fire briefly during transitions too.
    },
  ],
  holdDurationMs: 0,
};

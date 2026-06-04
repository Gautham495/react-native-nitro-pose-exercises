import type { Landmark } from 'react-native-nitro-pose-exercises';

export type FramingIssue =
  | 'noPerson'
  | 'headClipped'
  | 'feetClipped'
  | 'tooFar'
  | 'offCenter'
  | 'wrongAngle'
  | 'standing'
  | null;

export interface FramingStatus {
  ready: boolean;
  issue: FramingIssue;
  message: string;
}

export function getFramingStatus(
  landmarks: Landmark[] | null | undefined,
  requiredView: 'side' | 'front'
): FramingStatus {
  if (!landmarks || landmarks.length < 33) {
    return { ready: false, issue: 'noPerson', message: 'Step into frame' };
  }

  const ls = landmarks[11];
  const rs = landmarks[12];
  const lw = landmarks[15];
  const rw = landmarks[16];

  if (!ls || !rs || ls.visibility < 0.2 || rs.visibility < 0.2) {
    return { ready: false, issue: 'noPerson', message: 'Step into frame' };
  }

  const shoulderDx = Math.abs(ls.x - rs.x);
  const midX = (ls.x + rs.x) / 2;

  // Off-center
  if (Math.abs(midX - 0.5) > 0.4) {
    return {
      ready: false,
      issue: 'offCenter',
      message: midX < 0.5 ? 'Move right' : 'Move left',
    };
  }

  // Camera angle
  if (requiredView === 'side' && shoulderDx > 0.25) {
    return { ready: false, issue: 'wrongAngle', message: 'Turn sideways' };
  }
  if (requiredView === 'front' && shoulderDx < 0.05) {
    return { ready: false, issue: 'wrongAngle', message: 'Face the camera' };
  }

  // Distance: shoulders must span at least 12% of frame for front-facing
  if (requiredView === 'front' && shoulderDx < 0.12) {
    return {
      ready: false,
      issue: 'tooFar',
      message: 'Move closer to the camera',
    };
  }

  // Plank-vs-standing: wrists should be below shoulders for floor exercises
  if (requiredView === 'front' && lw && rw) {
    const wristsVisible = lw.visibility > 0.2 && rw.visibility > 0.2;
    if (wristsVisible) {
      const wristY = (lw.y + rw.y) / 2;
      const shoulderY = (ls.y + rs.y) / 2;
      if (wristY < shoulderY) {
        return {
          ready: false,
          issue: 'standing',
          message: 'Get into push-up position',
        };
      }
    }
  }

  return { ready: true, issue: null, message: 'Ready' };
}

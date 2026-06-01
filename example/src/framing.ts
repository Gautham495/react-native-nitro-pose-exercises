import type { Landmark } from 'react-native-nitro-pose-exercises';

export type FramingIssue =
  | 'noPerson'
  | 'headClipped'
  | 'feetClipped'
  | 'tooFar'
  | 'offCenter'
  | 'wrongAngle'
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

  // At least one shoulder must be visible
  if (!ls || !rs || ls.visibility < 0.2 || rs.visibility < 0.2) {
    return { ready: false, issue: 'noPerson', message: 'Step into frame' };
  }

  // Off-center (loosened)
  const midX = (ls.x + rs.x) / 2;
  if (Math.abs(midX - 0.5) > 0.4) {
    return {
      ready: false,
      issue: 'offCenter',
      message: midX < 0.5 ? 'Move right' : 'Move left',
    };
  }

  // Camera angle (already lenient)
  const shoulderDx = Math.abs(ls.x - rs.x);
  if (requiredView === 'side' && shoulderDx > 0.25) {
    return { ready: false, issue: 'wrongAngle', message: 'Turn sideways' };
  }
  if (requiredView === 'front' && shoulderDx < 0.05) {
    return { ready: false, issue: 'wrongAngle', message: 'Face the camera' };
  }

  return { ready: true, issue: null, message: 'Ready' };
}

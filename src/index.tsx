import { NitroModules } from 'react-native-nitro-modules';

import type { NitroPoseExercises } from './NitroPoseExercises.nitro';

const nitroPoseExercises =
  NitroModules.createHybridObject<NitroPoseExercises>('NitroPoseExercises');

export { nitroPoseExercises };

export type {
  NitroPoseExercises,
  ExerciseConfig,
  ExerciseType,
  ExercisePhase,
  FormSeverity,
  SessionStatus,
  Landmark,
  AngleDefinition,
  PhaseThreshold,
  FormRule,
  RepData,
  AngleSnapshot,
  FormFeedback,
  HoldProgress,
  SessionResult,
} from './NitroPoseExercises.nitro';

// ─── Rep-Based Exercises ─────────────────────────────────────
export { PUSHUP_CONFIG } from './config/pushup';
export { SQUAT_CONFIG } from './config/squat';
export { BICEP_CURL_CONFIG } from './config/bicep-curl';
export { SHOULDER_PRESS_CONFIG } from './config/shoulder-press';
export { LUNGE_CONFIG } from './config/lunge';
export { SITUP_CONFIG } from './config/situp';
export { TRICEP_DIP_CONFIG } from './config/tricep-dip';

// ─── Hold-Based Exercises ────────────────────────────────────
export { PLANK_CONFIG } from './config/plank';
export { WALL_SIT_CONFIG } from './config/wall-sit';

// ─── Yoga Poses ──────────────────────────────────────────────
export { TREE_POSE_CONFIG } from './config/tree-pose';
export { WARRIOR_I_CONFIG } from './config/warrior-i';
export { WARRIOR_II_CONFIG } from './config/warrior-ii';
export { DOWNWARD_DOG_CONFIG } from './config/downward-dog';
export { CHAIR_POSE_CONFIG } from './config/chair-pose';
export { COBRA_POSE_CONFIG } from './config/cobra-pose';

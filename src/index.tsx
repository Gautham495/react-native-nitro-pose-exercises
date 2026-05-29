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

// ─── Rep-Based: Strength ─────────────────────────────────────
export { PUSHUP_CONFIG } from './config/pushup';
export { PULL_UP_CONFIG } from './config/pull-up';
export { SQUAT_CONFIG } from './config/squat';
export { SUMO_SQUAT_CONFIG } from './config/sumo-squat';
export { BICEP_CURL_CONFIG } from './config/bicep-curl';
export { SHOULDER_PRESS_CONFIG } from './config/shoulder-press';
export { LUNGE_CONFIG } from './config/lunge';
export { SIDE_LUNGE_CONFIG } from './config/side-lung';
export { SITUP_CONFIG } from './config/situp';
export { TRICEP_DIP_CONFIG } from './config/tricep-dip';
export { DEADLIFT_CONFIG } from './config/dead-lift';
export { LATERAL_RAISE_CONFIG } from './config/lateral-raise';
export { FRONT_RAISE_CONFIG } from './config/front-raise';
export { CALF_RAISE_CONFIG } from './config/calf-raise';
export { OVERARM_REACH_CONFIG } from './config/overarm-reach';

// ─── Rep-Based: Core ─────────────────────────────────────────
export { LEG_RAISE_CONFIG } from './config/leg-raise';
export { V_UP_CONFIG } from './config/v-up';
export { GLUTE_BRIDGE_CONFIG } from './config/glute-bridge';
export { COBRA_WINGS_CONFIG } from './config/cobra-wings';
export { KNEE_RAISE_CONFIG } from './config/knee-raise';
export { HIP_ABDUCTION_CONFIG } from './config/hip-abduction';

// ─── Hold-Based: Strength ────────────────────────────────────
export { PLANK_CONFIG } from './config/plank';
export { SIDE_PLANK_CONFIG } from './config/side-plank';
export { WALL_SIT_CONFIG } from './config/wall-sit';

// ─── Hold-Based: Yoga ────────────────────────────────────────
export { TREE_POSE_CONFIG } from './config/tree-pose';
export { WARRIOR_I_CONFIG } from './config/warrior-i';
export { WARRIOR_II_CONFIG } from './config/warrior-ii';
export { WARRIOR_III_CONFIG } from './config/warrior-iii';
export { REVERSE_WARRIOR_CONFIG } from './config/reverse-warrior';
export { DOWNWARD_DOG_CONFIG } from './config/downward-dog';
export { CHAIR_POSE_CONFIG } from './config/chair-pose';
export { COBRA_POSE_CONFIG } from './config/cobra-pose';
export { BRIDGE_POSE_CONFIG } from './config/bridge-pose';
export { BOAT_POSE_CONFIG } from './config/boat-pose';
export { EXTENDED_SIDE_ANGLE_CONFIG } from './config/extended-side-angle';
export { CAMEL_POSE_CONFIG } from './config/camel-pose';
export { CHILDS_POSE_CONFIG } from './config/childs-pose';
export { BOW_POSE_CONFIG } from './config/bow-pose';
export { FISH_POSE_CONFIG } from './config/fish-pose';
export { MOUNTAIN_POSE_CONFIG } from './config/mountain-pose';
export { TRIANGLE_POSE_CONFIG } from './config/triangle-pose';

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

export { PUSHUP_CONFIG } from './config/pushup';

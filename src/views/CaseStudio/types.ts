/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clue, Suspect, RoomLocationId, SuspectId } from '../../types/game';

export type LangGraphNodeId =
  | 'DOC_PARSE'
  | 'SCRIPT_ANALYZE'
  | 'CASE_PLAN'
  | 'CASE_GENERATE'
  | 'LOGIC_VALIDATE'
  | 'REVISION_NODE'
  | 'HUMAN_REVIEW'
  | 'PUBLISHED';

export interface LogicConflict {
  id: string;
  type: 'TIMELINE_OVERLAP' | 'LOCK_PARADOX' | 'CLUE_CHAIN_MISSING' | 'ALIBI_CONTRADICTION';
  severity: 'HIGH' | 'MEDIUM';
  title: string;
  description: string;
  entitiesInvolved: string[];
  suggestedFix: string;
  appliedFix?: string;
  isResolved: boolean;
}

export interface ValidationReport {
  isValid: boolean;
  score: number; // 0 - 100
  checksPassed: number;
  totalChecks: number;
  conflicts: LogicConflict[];
  auditTimestamp: string;
}

export interface StudioCaseData {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  difficulty: '新手' | '进阶' | '硬核硬推';
  murderWindow: {
    start: string;
    end: string;
  };
  victim: {
    name: string;
    identity: string;
    causeOfDeath: string;
    foundLocation: string;
  };
  trueCulpritId: SuspectId;
  coreTrick: string;
  suspects: Suspect[];
  clues: Clue[];
  timeline: Array<{
    time: string;
    actor: string;
    location: string;
    action: string;
    isVerified: boolean;
    note?: string;
  }>;
  validationReport?: ValidationReport;
}

export interface LangGraphStepInfo {
  nodeId: LangGraphNodeId;
  label: string;
  sublabel: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'REPAIRING' | 'FAILED';
  durationMs?: number;
  outputSummary?: string;
}

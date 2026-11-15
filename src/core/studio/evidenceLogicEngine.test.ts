/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSuspectEvidenceProfiles,
  buildClueCorrelationMatrix,
  buildRadarInferenceData,
  evaluateInferenceRigor,
} from './evidenceLogicEngine';
import { PRESET_STUDIO_CASES } from './presets';

test('calculateSuspectEvidenceProfiles correctly attributes highest inculpation score to true culprit', () => {
  const caseData = PRESET_STUDIO_CASES.midnight_gallery;
  const profiles = calculateSuspectEvidenceProfiles(caseData.clues, caseData.suspects, caseData.trueCulpritId);

  assert.equal(profiles.length, caseData.suspects.length);

  const culpritProfile = profiles.find((p) => p.isTrueCulprit);
  assert.ok(culpritProfile, 'True culprit profile must exist');
  assert.equal(culpritProfile!.suspectId, 'xu_ning');
  assert.ok(culpritProfile!.totalInculpationScore >= 80, 'Culprit score should be >= 80');
  assert.equal(culpritProfile!.convictionStatus, 'IRREFUTABLE');

  // Verify non-culprits have lower scores
  const innocents = profiles.filter((p) => !p.isTrueCulprit);
  for (const innocent of innocents) {
    assert.ok(innocent.totalInculpationScore < culpritProfile!.totalInculpationScore);
    assert.notEqual(innocent.convictionStatus, 'IRREFUTABLE');
  }
});

test('buildClueCorrelationMatrix generates non-empty correlation cells for all clue-suspect pairs', () => {
  const caseData = PRESET_STUDIO_CASES.midnight_gallery;
  const matrix = buildClueCorrelationMatrix(caseData.clues, caseData.suspects, caseData.trueCulpritId);

  const expectedLength = caseData.clues.length * caseData.suspects.length;
  assert.equal(matrix.length, expectedLength);

  // Check that crucial clues for culprit have high strength
  const keycardCulprit = matrix.find(
    (m) => m.clueId === 'clue_keycard' && m.suspectId === 'xu_ning'
  );
  assert.ok(keycardCulprit);
  assert.ok(keycardCulprit!.strength >= 80);
});

test('buildRadarInferenceData outputs 5 radar dimensions with valid values', () => {
  const caseData = PRESET_STUDIO_CASES.midnight_gallery;
  const radar = buildRadarInferenceData(caseData.suspects, caseData.clues, caseData.trueCulpritId);

  assert.equal(radar.length, 5);
  for (const row of radar) {
    assert.ok(row.subject);
    assert.equal(row.fullMark, 100);
    assert.ok(typeof row['许宁'] === 'number');
    assert.ok(typeof row['周衡'] === 'number');
  }
});

test('evaluateInferenceRigor returns high score for Midnight Gallery and identifies conflicts in Snow Manor', () => {
  const cleanCase = PRESET_STUDIO_CASES.midnight_gallery;
  const cleanRigor = evaluateInferenceRigor(cleanCase);
  assert.ok(cleanRigor.overallRigorScore >= 80);
  assert.equal(cleanRigor.verdict, 'RATIONALLY_SEALED');
  assert.ok(cleanRigor.checkpoints.length >= 4);

  // Test Snow Manor which has deliberate conflicts before repair
  const conflictedCase = {
    ...PRESET_STUDIO_CASES.snow_manor,
    validationReport: {
      isValid: false,
      score: 60,
      checksPassed: 3,
      totalChecks: 5,
      conflicts: [
        {
          id: 'conflict_spatiotemporal_1',
          type: 'TIMELINE_OVERLAP' as const,
          severity: 'HIGH' as const,
          title: '时空瞬移冲突',
          description: '同一时间在两地',
          entitiesInvolved: ['周衡'],
          suggestedFix: '平滑修正时间',
          isResolved: false,
        },
      ],
      auditTimestamp: '12:00',
    },
  };
  const conflictedRigor = evaluateInferenceRigor(conflictedCase);
  assert.equal(conflictedRigor.verdict, 'PARADOX_CRITICAL');
  assert.ok(conflictedRigor.overallRigorScore < cleanRigor.overallRigorScore);
});

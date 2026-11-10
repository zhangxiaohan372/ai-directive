import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialRoom,
  advanceGamePhase,
  inspectLocation,
  revealHint,
  submitVote,
  evaluateVerdict,
  addClueLink,
} from './engine';
import { executeMCPTool, MCP_TOOL_DEFINITIONS } from './mcp';
import { arbitrateSpoilerRisk, retrieveGroundedKnowledge } from './rag';
import { TRUE_DEDUCTION_CHAIN } from '../data/caseData';

test('Initial room initializes with host and 2 simulated bot players', () => {
  const room = createInitialRoom('room_test_123', '夏洛克', true);
  assert.equal(room.roomId, 'room_test_123');
  assert.equal(room.phase, 'BRIEFING');
  assert.equal(room.players.length, 3);
  assert.equal(room.players[0].name, '夏洛克');
  assert.equal(room.players[1].name, '侦探小林');
  assert.equal(room.players[2].name, '解密达人阿强');
  assert.equal(room.discoveredClueIds.length, 0);
});

test('Game phase advances sequentially through all investigation stages', () => {
  let room = createInitialRoom('room_phases', '测试员');
  assert.equal(room.phase, 'BRIEFING');

  room = advanceGamePhase(room);
  assert.equal(room.phase, 'INVESTIGATION');

  room = advanceGamePhase(room);
  assert.equal(room.phase, 'INTERROGATION');

  room = advanceGamePhase(room);
  assert.equal(room.phase, 'DISCUSSION');

  room = advanceGamePhase(room);
  assert.equal(room.phase, 'VOTING');

  room = advanceGamePhase(room);
  assert.equal(room.phase, 'TRUTH_REVEAL');
});

test('Location inspection unlocks clues and does not duplicate', () => {
  let room = createInitialRoom('room_search', '探长');
  const res1 = inspectLocation(room, 'restoration_room', 'player_host');
  room = res1.nextState;

  assert.ok(res1.newlyDiscoveredClues.length >= 2);
  assert.ok(room.discoveredClueIds.includes('clue_watch'));
  assert.ok(room.discoveredClueIds.includes('clue_cloth'));

  // Inspecting again yields no new clues
  const res2 = inspectLocation(room, 'restoration_room', 'player_host');
  assert.equal(res2.newlyDiscoveredClues.length, 0);
  assert.equal(res2.nextState.discoveredClueIds.length, room.discoveredClueIds.length);
});

test('Tiered hints progress accurately from Level 1 to 3', () => {
  let room = createInitialRoom('room_hints', '探长');
  const h1 = revealHint(room);
  assert.equal(h1.nextState.hintLevel, 1);
  assert.ok(h1.hint.includes('22:15'));

  const h2 = revealHint(h1.nextState);
  assert.equal(h2.nextState.hintLevel, 2);
  assert.ok(h2.hint.includes('香槟'));

  const h3 = revealHint(h2.nextState);
  assert.equal(h3.nextState.hintLevel, 3);
  assert.ok(h3.hint.includes('通风窗'));
});

test('Voting identifies correct culprit Xu Ning and calculates accuracy', () => {
  let room = createInitialRoom('room_vote', '探长', true);
  room.discoveredClueIds = ['clue_watch', 'clue_keycard', 'clue_thread', 'clue_glass', 'clue_journal'];

  // Host votes for Xu Ning
  room = submitVote(room, 'player_host', 'xu_ning', '22:15分怀表与22:12备用门禁卡记录指明真凶');

  const verdict = evaluateVerdict(room);
  assert.equal(verdict.isSolved, true);
  assert.equal(verdict.majoritySuspectId, 'xu_ning');
  assert.ok(verdict.clueUtilizationRate >= 80);
});

test('All 8 MCP tools execute properly and log history', () => {
  let room = createInitialRoom('room_mcp', '探长');

  assert.equal(MCP_TOOL_DEFINITIONS.length, 8);

  // 1. get_game_state
  const r1 = executeMCPTool('get_game_state', { roomId: room.roomId }, room);
  assert.equal(r1.result.phase, 'BRIEFING');
  room = r1.nextState;

  // 2. inspect_location
  const r2 = executeMCPTool('inspect_location', { roomId: room.roomId, locationId: 'curator_office' }, room);
  assert.ok(r2.result.newlyDiscoveredClues.includes('clue_keycard'));
  room = r2.nextState;

  // 3. get_player_inventory
  const r3 = executeMCPTool('get_player_inventory', { roomId: room.roomId, playerId: 'player_host' }, room);
  assert.equal(r3.result.clues.length, room.discoveredClueIds.length);
  room = r3.nextState;

  // 4. interrogate_npc
  const r4 = executeMCPTool('interrogate_npc', { roomId: room.roomId, npcId: 'lin_lan', question: '你的画到底是谁画的？' }, room);
  assert.ok(r4.result.aiResponse.message.length > 0);
  assert.ok(r4.result.aiResponse.confidence > 0.5);
  room = r4.nextState;

  // 5. reveal_hint
  const r5 = executeMCPTool('reveal_hint', { roomId: room.roomId, level: 1 }, room);
  assert.equal(r5.result.hintLevel, 1);
  room = r5.nextState;

  // 6. start_vote
  const r6 = executeMCPTool('start_vote', { roomId: room.roomId }, room);
  assert.equal(r6.nextState.phase, 'VOTING');
  room = r6.nextState;

  // 7. submit_vote
  const r7 = executeMCPTool('submit_vote', { roomId: room.roomId, playerId: 'player_host', suspectId: 'xu_ning' }, room);
  assert.equal(r7.result.votedFor, 'xu_ning');
  room = r7.nextState;

  // 8. advance_story
  const r8 = executeMCPTool('advance_story', { roomId: room.roomId }, room);
  assert.equal(r8.nextState.phase, 'TRUTH_REVEAL');
  room = r8.nextState;

  assert.ok(room.mcpCallHistory.length >= 7);
});

test('Anti-spoiler arbitrator strictly intercepts premature murder confessions', () => {
  const room = createInitialRoom('room_spoiler', '探长');
  room.phase = 'INTERROGATION';

  // Explicit confession should trigger blocker
  const checkLeaked = arbitrateSpoilerRisk('其实是我杀了陈默，我用青铜镇纸打死他的。', room, 'xu_ning');
  assert.equal(checkLeaked.isBlocked, true);
  assert.ok(checkLeaked.spoilerRisk >= 0.9);
  assert.ok(checkLeaked.sanitizedText?.includes('许宁'));

  // Normal evasive speech should pass
  const checkNormal = arbitrateSpoilerRisk('我昨晚一直在大厅整理画册，不知道为什么修复室反锁了。', room, 'xu_ning');
  assert.equal(checkNormal.isBlocked, false);
  assert.ok(checkNormal.spoilerRisk < 0.2);
});

test('RAG retrieval filters out top secret murder truth in early phases', () => {
  const room = createInitialRoom('room_rag', '探长');
  const docs = retrieveGroundedKnowledge(room, 'xu_ning');
  // Must NOT include the top secret truth
  docs.forEach((d) => {
    assert.equal(d.includes('许宁是凶手'), false);
    assert.equal(d.includes('用青铜镇纸砸死陈默'), false);
  });
});

test('Deterministic Logic Validator catches spatiotemporal and lock paradoxes in raw case', async () => {
  const { PRESET_STUDIO_CASES } = await import('../components/CaseStudio/presets');
  const { validateCaseConsistency, repairCaseConflicts } = await import(
    '../components/CaseStudio/logicValidator'
  );

  // 1. Midnight gallery is already 100% consistent
  const canonicalReport = validateCaseConsistency(PRESET_STUDIO_CASES['midnight_gallery']);
  assert.equal(canonicalReport.isValid, true);
  assert.equal(canonicalReport.score, 100);
  assert.equal(canonicalReport.conflicts.length, 0);

  // 2. Snow manor has intentional paradoxes
  const rawSnowReport = validateCaseConsistency(PRESET_STUDIO_CASES['snow_manor']);
  assert.equal(rawSnowReport.isValid, false);
  assert.ok(rawSnowReport.conflicts.length >= 2);
  assert.ok(rawSnowReport.score < 100);
  assert.ok(rawSnowReport.conflicts.some((c) => c.type === 'TIMELINE_OVERLAP'));
  assert.ok(rawSnowReport.conflicts.some((c) => c.type === 'LOCK_PARADOX'));

  // 3. Self-repair revision node cures the paradoxes
  const { repairedCase, appliedFixes } = repairCaseConflicts(
    PRESET_STUDIO_CASES['snow_manor'],
    rawSnowReport
  );
  assert.ok(appliedFixes.length >= 2);
  const repairedReport = validateCaseConsistency(repairedCase);
  assert.equal(repairedReport.isValid, true);
  assert.equal(repairedReport.score, 100);
  assert.equal(repairedReport.conflicts.length, 0);
});


/**
 * 探案房间、线索搜查与 MCP 工具交互 API
 */

import { request } from '../utils/request';
import type { RoomState } from '../types/game';

export interface CreateRoomParams {
  hostName?: string;
  includeBots?: boolean;
}

export interface JoinRoomParams {
  roomId: string;
  playerName?: string;
  isBot?: boolean;
}

export interface RoomActionParams {
  action:
    | 'INSPECT_LOCATION'
    | 'REVEAL_HINT'
    | 'ADVANCE_PHASE'
    | 'SUBMIT_VOTE'
    | 'ADD_CLUE_LINK'
    | 'UPDATE_NOTE'
    | 'SEND_CHAT'
    | string;
  payload?: any;
}

export interface InterrogateParams {
  npcId: string;
  question: string;
  playerId?: string;
}

/**
 * 创建多人探案房间
 */
export function createRoomApi(params?: CreateRoomParams): Promise<{ success: boolean; room: RoomState }> {
  return request.post('/rooms/create', params || {});
}

/**
 * 加入多人探案房间
 */
export function joinRoomApi(params: JoinRoomParams): Promise<{ success: boolean; room: RoomState; playerId: string }> {
  return request.post('/rooms/join', params);
}

/**
 * 查询指定房间实时案情状态
 */
export function getRoomStateApi(roomId: string): Promise<{ success: boolean; room: RoomState }> {
  return request.get(`/rooms/${encodeURIComponent(roomId)}`);
}

/**
 * 触发房间内探案动作（搜查地点、出示证物、提交指控等）
 */
export function dispatchRoomActionApi<T = any>(
  roomId: string,
  params: RoomActionParams
): Promise<{ success: boolean; room: RoomState; result: T }> {
  return request.post(`/rooms/${encodeURIComponent(roomId)}/action`, params);
}

/**
 * 调用服务端 MCP 工具协议
 */
export function executeMcpToolApi<T = any>(
  roomId: string,
  toolName: string,
  args: any
): Promise<{ success: boolean; room: RoomState; result: T }> {
  return request.post(`/rooms/${encodeURIComponent(roomId)}/mcp`, { toolName, args });
}

/**
 * 向嫌疑人 NPC 发起质询审问（服务端集成 RAG 与防剧透仲裁）
 */
export function interrogateNpcApi(
  roomId: string,
  params: InterrogateParams
): Promise<{ success: boolean; room: RoomState; aiOutput: any }> {
  return request.post(`/rooms/${encodeURIComponent(roomId)}/interrogate`, params);
}

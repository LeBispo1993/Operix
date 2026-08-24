import type {Role} from './auth.js';
const TECHNICAL:Role[]=['TECHNICIAN','MANAGER','DIRECTOR','ADMIN','SUPER_ADMIN'];
export function canDecideTicket(role:Role){return TECHNICAL.includes(role);}
export function canOperateWorkOrder(role:Role){return TECHNICAL.includes(role);}
export function requireFinishFields(value:{startedAt?:unknown;beforePhotoKey?:unknown;afterPhotoKey?:unknown;technicianSignatureKey?:unknown;serviceDescription?:unknown}){
  return Boolean(value.startedAt&&value.beforePhotoKey&&value.afterPhotoKey&&value.technicianSignatureKey&&value.serviceDescription);
}

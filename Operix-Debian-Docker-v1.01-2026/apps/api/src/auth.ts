import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

export const roles = ['REQUESTER','USER','TECHNICIAN','MANAGER','DIRECTOR','ADMIN','SUPER_ADMIN'] as const;
export type Role = typeof roles[number];
export type Session = { sub:string; tenantId:string; role:Role; sectorId:string|null; memberships:{tenantId:string;tenantName:string;role:Role;sectorId:string|null}[] };

const secret = () => {
  const value=process.env.JWT_SECRET ?? '';
  if(value.length<32) throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres');
  return new TextEncoder().encode(value);
};
export async function signAccess(session:Session){return new SignJWT(session).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('15m').sign(secret());}
export async function verifyAccess(token:string){const {payload}=await jwtVerify(token,secret()); return payload as unknown as Session;}
export function newRefresh(){const raw=randomBytes(48).toString('base64url');return {raw,hash:createHash('sha256').update(raw).digest('hex')};}
export function hashRefresh(raw:string){return createHash('sha256').update(raw).digest('hex');}
export function canReadAll(role:Role){return ['TECHNICIAN','MANAGER','DIRECTOR','ADMIN','SUPER_ADMIN'].includes(role);}


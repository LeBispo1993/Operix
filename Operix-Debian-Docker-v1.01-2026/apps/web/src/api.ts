import{
 apiRoleToUiRole,
 uiRoleToApiRole,
 type ApiRole
}from'./permissions';

function accessToken(){
 return sessionStorage.getItem('operix.accessToken')||'';
}

export function currentSession(){
 try{
  return JSON.parse(
   sessionStorage.getItem('operix.auth.user')||'{}'
  )as{
   name?:string;
   role?:string;
   company?:string;
   tenantId?:string;
   sectorId?:string|null;
  };
 }catch{
  return{};
 }
}

export function currentTenantId(){
 return currentSession().tenantId||'';
}

async function request<T>(
 url:string,
 options:RequestInit={}
):Promise<T>{
 const headers=new Headers(options.headers||{});

 headers.set(
  'Content-Type',
  'application/json'
 );

 const token=accessToken();

 if(token){
  headers.set(
   'Authorization',
   `Bearer ${token}`
  );
 }

 const tenant=currentTenantId();

 if(tenant){
  headers.set(
   'X-Tenant-Id',
   tenant
  );
 }

 const response=await fetch(url,{
  ...options,
  headers
 });

 let data:any=null;

 try{
  data=await response.json();
 }catch{}

 if(response.status===401){
  sessionStorage.removeItem('operix.accessToken');
  sessionStorage.removeItem('operix.refreshToken');
  sessionStorage.removeItem('operix.authenticated');
  sessionStorage.removeItem('operix.auth.user');

  window.dispatchEvent(
   new Event('operix-logout')
  );
 }

 if(!response.ok){
  throw new Error(
   data?.error||
   `Erro HTTP ${response.status}`
  );
 }

 return data as T;
}

export function apiGet<T>(url:string){
 return request<T>(url);
}

export function apiPost<T>(
 url:string,
 body:unknown
){
 return request<T>(url,{
  method:'POST',
  body:JSON.stringify(body)
 });
}

export function apiPut<T>(
 url:string,
 body:unknown
){
 return request<T>(url,{
  method:'PUT',
  body:JSON.stringify(body)
 });
}

export function apiDelete<T>(url:string){
 return request<T>(url,{
  method:'DELETE'
 });
}

export function apiRoleLabel(
 role:string
){
 return apiRoleToUiRole[
  role as ApiRole
 ]||role;
}

export function apiRoleValue(
 role:string
){
 return uiRoleToApiRole(role);
}

export function setActiveTenant(
 tenantId:string,
 tenantName:string,
 role:string,
 sectorId:string|null
){
 const current=currentSession();

 sessionStorage.setItem(
  'operix.auth.user',
  JSON.stringify({
   ...current,
   tenantId,
   company:tenantName,
   role:apiRoleLabel(role),
   sectorId
  })
 );

 window.dispatchEvent(
  new Event('operix-tenant-changed')
 );
}

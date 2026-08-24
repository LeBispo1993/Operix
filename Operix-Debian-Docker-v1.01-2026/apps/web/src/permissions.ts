import type{Role,Screen}from'./v2-types';

export type PermissionAction='view'|'create'|'edit'|'delete';
export type AccessRule=Record<PermissionAction,boolean>;
export type PermissionMap=Record<Role,Record<Screen,AccessRule>>;

export type ApiRole=
  |'REQUESTER'
  |'USER'
  |'TECHNICIAN'
  |'MANAGER'
  |'DIRECTOR'
  |'ADMIN'
  |'SUPER_ADMIN';

export const screenCatalog:{id:Screen;label:string}[]=[
 {id:'dashboard',label:'Visao geral'},
 {id:'tickets',label:'Chamados'},
 {id:'orders',label:'Ordens de servico'},
 {id:'maintenance',label:'Gestão de Manutenção'},
 {id:'it',label:'Gestão de TI'},
 {id:'fleet',label:'Gestão de frota'},
 {id:'reviews',label:'Avaliacoes'},
 {id:'safety',label:'Gestão de Segurança do Trabalho'},
 {id:'hr',label:'Gestão de RH'},
 {id:'warehouse',label:'Gestão de almoxarifado'},
 {id:'training',label:'Treinamentos e Informativos'},
 {id:'admin',label:'Administracao'}
];

export const defaultRoles:Role[]=[
 'Padrao',
 'Usuario',
 'Tecnico',
 'Gerente',
 'Diretor',
 'Administrador'
];

export const apiRoleToUiRole:Record<ApiRole,Role>={
 REQUESTER:'Padrao',
 USER:'Usuario',
 TECHNICIAN:'Tecnico',
 MANAGER:'Gerente',
 DIRECTOR:'Diretor',
 ADMIN:'Administrador',
 SUPER_ADMIN:'Administrador'
};

export const uiRoleToApiRole=(role:Role):ApiRole=>{
 const map:Record<string,ApiRole>={
  Padrao:'REQUESTER',
  Usuario:'USER',
  Tecnico:'TECHNICIAN',
  'Tecnico de Seguranca do Trabalho':'TECHNICIAN',
  Gerente:'MANAGER',
  Coordenador:'MANAGER',
  Diretor:'DIRECTOR',
  Administrador:'ADMIN'
 };

 return map[role]||'USER';
};

const all=(value:boolean):AccessRule=>({
 view:value,
 create:value,
 edit:value,
 delete:value
});

const roleRules=(
 visible:Screen[],
 manage:Screen[]=[]
):Record<Screen,AccessRule>=>
 Object.fromEntries(
  screenCatalog.map(({id})=>[
   id,
   manage.includes(id)
    ?all(true)
    :{
      view:visible.includes(id),
      create:false,
      edit:false,
      delete:false
     }
  ])
 )as Record<Screen,AccessRule>;

export function createDefaultPermissions():PermissionMap{
 return{
  Padrao:roleRules(
   ['dashboard','tickets','orders','training'],
   ['tickets']
  ),

  Usuario:roleRules(
   ['dashboard','tickets','orders','training']
  ),

  Tecnico:roleRules(
   [
    'dashboard',
    'tickets',
    'orders',
    'maintenance',
    'it',
    'fleet',
    'training'
   ],
   [
    'tickets',
    'orders',
    'maintenance',
    'it',
    'fleet'
   ]
  ),

  Gerente:roleRules(
   [
    'dashboard',
    'tickets',
    'orders',
    'maintenance',
    'it',
    'fleet',
    'reviews',
    'safety',
    'hr',
    'warehouse',
    'training'
   ],
   [
    'tickets',
    'orders',
    'maintenance',
    'it',
    'fleet',
    'reviews',
    'hr',
    'warehouse',
    'training'
   ]
  ),

  Diretor:roleRules(
   [
    'dashboard',
    'tickets',
    'orders',
    'maintenance',
    'it',
    'fleet',
    'reviews',
    'safety',
    'hr',
    'warehouse',
    'training'
   ]
  ),

  Administrador:roleRules(
   screenCatalog.map(x=>x.id),
   screenCatalog.map(x=>x.id)
  )
 };
}

export function emptyRolePermissions():Record<Screen,AccessRule>{
 return roleRules(['dashboard']);
}

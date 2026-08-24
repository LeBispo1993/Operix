import React,{useEffect,useState}from'react';
import{Check,ChevronLeft,ChevronRight,FolderTree,Image,PackagePlus,Pencil,Plus,Save,ShieldCheck,Trash2,Upload,UserPlus,X}from'lucide-react';
import type{Company,Role,Screen,Sector}from'./v2-types';
import{emptyRolePermissions,screenCatalog,type PermissionAction,type PermissionMap}from'./permissions';
import{ExportButtons,type ExportColumn,type ExportRow}from'./data-export';
import{
 apiGet,
 apiPost,
 apiPut,
 apiDelete,
 apiRoleLabel,
 apiRoleValue
}from'./api';


type Person={
 id:string;
 userId?:string;
 name:string;
 cpf:string;
 phone:string;
 email:string;
 extension:string;
 job:string;
 role:Role;
 company:Company;
 photo:string;
 sectorId?:string|null;
 sectorName?:string;
 active?:boolean;
};
type Collaborator=Person&{assignment:string};

type ApiUser={
 personId:string;
 userId:string;
 name:string;
 document:string;
 email:string;
 phone:string|null;
 extension:string|null;
 jobTitle:string|null;
 sectorId:string|null;
 sectorName:string|null;
 photoKey:string|null;
 role:string;
 mustChangePassword:boolean;
 active:boolean;
};

type ApiBranding={
 tenantId:string;
 code?:string;
 name?:string;
 logoData:string;
 backgroundData:string;
};

type ApiSector={
 id:string;
 name:string;
 costCenter:string|null;
 parentId:string|null;
 active:boolean;
};

type Equipment={id:number;name:string;patrimony:string;type:string;model:string;serial:string;sector:string;purchase:string;photo:string};

const companies:Company[]=['Grafmarques','INFINNI','M.Print'];
const seedPeople:Person[]=[];

function notify(message:string){let banner=document.getElementById('v2-toast');if(!banner){banner=document.createElement('div');banner.id='v2-toast';banner.className='toast-inline';document.body.appendChild(banner)}banner.textContent=message;banner.style.display='flex';setTimeout(()=>banner!.style.display='none',2500)}
function Avatar({person}:{person:Person}){return person.photo?<img className="person-photo" src={person.photo}/>:<span className="person-photo fallback">{person.name.split(' ').slice(0,2).map(part=>part[0]).join('')}</span>}
function CrudActions({onEdit,onDelete,protectedItem=false}:{onEdit?:()=>void;onDelete?:()=>void;protectedItem?:boolean}){return <div className="crud-actions">{onEdit&&<button type="button" title="Editar" aria-label="Editar" onClick={onEdit}><Pencil/></button>}{onDelete&&<button type="button" className="danger" title={protectedItem?'Registro protegido':'Excluir'} aria-label="Excluir" disabled={protectedItem} onClick={onDelete}>{protectedItem?<ShieldCheck/>:<Trash2/>}</button>}</div>}

function PageList({people,extra,onEdit,onDelete}:{people:(Person|Collaborator)[];extra?:boolean;onEdit:(person:Person|Collaborator)=>void;onDelete:(id:string)=>void}){
 const[page,setPage]=useState(1),perPage=20,total=Math.max(1,Math.ceil(people.length/perPage));
 useEffect(()=>setPage(1),[people.length,people[0]?.company]);
 const visible=people.slice((page-1)*perPage,page*perPage);
 return <><div className="people-scroll"><div className={'people-header '+(extra?'with-assignment':'')}><span>Colaborador</span><span>Funcao / perfil</span><span>Empresa</span>{extra&&<span>Setor ou maquina</span>}<span>Acoes</span></div>{visible.map(person=><div className={'people-row '+(extra?'with-assignment':'')} key={person.id}><div><Avatar person={person}/><b>{person.name}</b></div><div><b>{person.job}</b><small>{person.role}</small></div><span>{person.company}</span>{extra&&<span>{(person as Collaborator).assignment}</span>}<CrudActions protectedItem={false} onEdit={()=>onEdit(person)} onDelete={()=>onDelete(person.id)}/></div>)}{!visible.length&&<div className="empty-list">Nenhum registro encontrado.</div>}</div><div className="pagination"><button type="button" disabled={page===1} onClick={()=>setPage(current=>current-1)}><ChevronLeft/></button>{Array.from({length:total},(_,index)=>index+1).map(number=><button type="button" className={number===page?'active':''} onClick={()=>setPage(number)} key={number}>{number}</button>)}<button type="button" disabled={page===total} onClick={()=>setPage(current=>current+1)}><ChevronRight/></button><small>{people.length} registros · maximo de 20 por pagina</small></div></>;
}

function SectorTree({
 items,
 reload
}:{
 items:Sector[];
 reload:()=>Promise<void>;
}){
 const[name,setName]=useState('');
 const[parentId,setParentId]=useState('');
 const[editingId,setEditingId]=useState<string|null>(null);
 const[editingName,setEditingName]=useState('');

 const add=async()=>{
  if(!name.trim())return;

  try{
   await apiPost('/api/admin/sectors',{
    name:name.trim(),
    costCenter:null,
    parentId:parentId||null
   });

   setName('');
   setParentId('');
   await reload();
   notify('Setor cadastrado.');
  }catch(error){
   notify(
    error instanceof Error
     ?error.message
     :'Não foi possível cadastrar o setor.'
   );
  }
 };

 const remove=async(id:string)=>{
  try{
   await apiDelete(`/api/admin/sectors/${id}`);

   if(editingId===id){
    setEditingId(null);
   }

   await reload();
   notify('Setor desativado.');
  }catch(error){
   notify(
    error instanceof Error
     ?error.message
     :'Não foi possível excluir o setor.'
   );
  }
 };

 const saveEdit=async()=>{
  if(editingId===null||!editingName.trim())return;

  const current=items.find(
   item=>item.id===editingId
  );

  if(!current)return;

  try{
   await apiPut(
    `/api/admin/sectors/${editingId}`,
    {
     name:editingName.trim(),
     costCenter:current.costCenter||null,
     parentId:current.parentId||null
    }
   );

   setEditingId(null);
   setEditingName('');
   await reload();
   notify('Setor atualizado.');
  }catch(error){
   notify(
    error instanceof Error
     ?error.message
     :'Não foi possível atualizar o setor.'
   );
  }
 };

 const actions=(item:Sector)=><>{
  editingId===item.id
   ?<div className="tree-inline-edit">
      <input
       aria-label={`Editar setor ${item.name}`}
       value={editingName}
       onChange={event=>setEditingName(event.target.value)}
      />
      <button type="button" title="Salvar" onClick={saveEdit}>
       <Check/>
      </button>
      <button type="button" title="Cancelar" onClick={()=>setEditingId(null)}>
       <X/>
      </button>
     </div>
   :<CrudActions
      onEdit={()=>{
       setEditingId(item.id);
       setEditingName(item.name);
      }}
      onDelete={()=>void remove(item.id)}
     />
 }</>;

 const childrenOf=(rootId:string,depth=0):React.ReactNode=>
  items
   .filter(item=>item.parentId===rootId)
   .map(child=>
    <React.Fragment key={child.id}>
     <article
      className="sector-child-row"
      style={{paddingLeft:`${38+depth*22}px`}}
     >
      <span/>
      <b>{child.name}</b>
      {actions(child)}
     </article>
     {childrenOf(child.id,depth+1)}
    </React.Fragment>
   );

 const roots=items.filter(item=>item.parentId===null);

 return(
  <div className="sector-builder">

   <div className="registry-create sector-registry-create">
    <input
     value={name}
     onChange={event=>setName(event.target.value)}
     placeholder="Nome do novo setor"
    />

    <select
     value={parentId}
     onChange={event=>setParentId(event.target.value)}
    >
     <option value="">
      Setor Pai (grupo principal)
     </option>

     {items.map(item=>
      <option value={item.id} key={item.id}>
       Relacionado a: {item.name}
      </option>
     )}
    </select>

    <button type="button" className="primary" onClick={()=>void add()}>
     <Plus/>
     Cadastrar
    </button>
   </div>

   <div className="sector-tree-v3">
    {roots.map(root=>
     <section key={root.id}>
      <header>
       <FolderTree/>
       <b>{root.name}</b>
       <small>Setor Pai</small>
       {actions(root)}
      </header>

      <div>
       {childrenOf(root.id)}

       <button
        type="button"
        className="tree-add-child"
        onClick={()=>setParentId(root.id)}
       >
        <Plus/>
        Adicionar setor relacionado
       </button>
      </div>
     </section>
    )}

    {!roots.length&&
     <div className="empty-list">
      Nenhum setor cadastrado.
     </div>
    }
   </div>

  </div>
 );
}

function RegistryEditor({title,items,setItems}:{title:string;items:string[];setItems:(items:string[])=>void}){
 const[entry,setEntry]=useState(''),[editing,setEditing]=useState<number|null>(null),[draft,setDraft]=useState('');
 const add=()=>{if(!entry.trim())return;setItems([...items,entry.trim()]);setEntry('');notify('Registro cadastrado.')};
 const save=()=>{if(editing===null||!draft.trim())return;setItems(items.map((item,index)=>index===editing?draft.trim():item));setEditing(null);notify('Registro atualizado.')};
 return <><div className="registry-create"><input value={entry} onChange={event=>setEntry(event.target.value)} placeholder={`Novo registro em ${title}`}/><button type="button" className="primary" onClick={add}><Plus/>Adicionar</button></div><div className="registry-list">{items.map((item,index)=><div key={`${item}-${index}`}>{editing===index?<div className="registry-inline-edit"><input aria-label={`Editar ${item}`} value={draft} onChange={event=>setDraft(event.target.value)}/><button type="button" title="Salvar" onClick={save}><Check/></button><button type="button" title="Cancelar" onClick={()=>setEditing(null)}><X/></button></div>:<><span>{item}</span><CrudActions onEdit={()=>{setEditing(index);setDraft(item)}} onDelete={()=>{setItems(items.filter((_,itemIndex)=>itemIndex!==index));notify('Registro excluido.')}}/></>}</div>)}{!items.length&&<div className="empty-list">Nenhum registro cadastrado.</div>}</div></>;
}

export default function AdminV3({company,companyLogo,onSaveCompanyLogo,systemName,setSystemName,roles,setRoles,permissions,setPermissions}:{company:Company;companyLogo:string;onSaveCompanyLogo:(company:Company,logo:string)=>void;systemName:string;setSystemName:(value:string)=>void;roles:Role[];setRoles:React.Dispatch<React.SetStateAction<Role[]>>;permissions:PermissionMap;setPermissions:React.Dispatch<React.SetStateAction<PermissionMap>>}){
 const[tab,setTab]=useState('Usuarios');
 const[userEditor,setUserEditor]=useState<Person|null|undefined>(undefined),[collaboratorEditor,setCollaboratorEditor]=useState<Collaborator|null|undefined>(undefined);
 const[users,setUsers]=useState<Person[]>(seedPeople),
[collaborators,setCollaborators]=useState<Collaborator[]>([]);
 const[sectors,setSectors]=useState<Sector[]>([]);
 const[selectedRole,setSelectedRole]=useState<Role>('Padrao'),[newRole,setNewRole]=useState(''),[editingRole,setEditingRole]=useState<Role|null>(null),[roleDraft,setRoleDraft]=useState('');
 const[globalMessage,setGlobalMessage]=useState(''),[colors,setColors]=useState({primary:'#0d9c89',text:'#17233c',background:'#f5f7fb'}),[photoPreview,setPhotoPreview]=useState(''),[equipmentPhoto,setEquipmentPhoto]=useState(''),[logoPreview,setLogoPreview]=useState(companyLogo),[backgroundPreview,setBackgroundPreview]=useState(''),[systemMediaPreview,setSystemMediaPreview]=useState(localStorage.getItem('operix.system.media')||'');
 const[equipment,setEquipment]=useState<Equipment[]>([]),[equipmentEditor,setEquipmentEditor]=useState<Equipment|null>(null);
 const[registries,setRegistries]=useState<Record<string,string[]>>({'Empresas':['Grafmarques','INFINNI','M.Print'],'Prioridades':[],'Servicos':[],'Tipos de equipamento':[]});

 const loadAdminData=async()=>{
  try{
   const[userRows,sectorRows]=await Promise.all([
    apiGet<ApiUser[]>('/api/admin/users'),
    apiGet<ApiSector[]>('/api/admin/sectors')
   ]);

   setUsers(
    userRows.map(row=>({
     id:row.personId,
     userId:row.userId,
     name:row.name,
     cpf:row.document,
     phone:row.phone||'',
     email:row.email,
     extension:row.extension||'',
     job:row.jobTitle||'',
     role:apiRoleLabel(row.role),
     company,
     photo:row.photoKey||'',
     sectorId:row.sectorId,
     sectorName:row.sectorName||'',
     active:row.active
    }))
   );

   setSectors(
    sectorRows
     .filter(row=>row.active)
     .map(row=>({
      id:row.id,
      name:row.name,
      parentId:row.parentId,
      costCenter:row.costCenter,
      active:row.active
     }))
   );

  }catch(error){
   console.error(error);
   notify(
    error instanceof Error
     ?error.message
     :'Erro ao carregar dados administrativos.'
   );
  }
 };

 useEffect(()=>{
  void loadAdminData();
 },[company]);

 const tabs=['Usuarios','Empresas','Colaboradores','Setores','Tipos de usuario','Prioridades','Servicos','Tipos de equipamento','Equipamentos','Aparencia','Mensagem global'];
 const companyUsers=users.filter(person=>person.company===company),companyCollaborators=collaborators.filter(person=>person.company===company),eligible=companyUsers.filter(user=>!companyCollaborators.some(collaborator=>collaborator.id===user.id));
 const chooseFile=(file:File|undefined,setter:(value:string)=>void)=>{if(file)setter(URL.createObjectURL(file))};
 const readPersistentImage=(file:File|undefined,setter:(value:string)=>void)=>{if(!file)return;const reader=new FileReader();reader.onload=()=>setter(String(reader.result));reader.readAsDataURL(file)};
 useEffect(()=>{
 let cancelled=false;

 void apiGet<ApiBranding>('/api/admin/branding')
  .then(data=>{
   if(cancelled)return;
   setLogoPreview(data.logoData||'');
   setBackgroundPreview(data.backgroundData||'');
  })
  .catch(error=>console.error(error));

 return()=>{cancelled=true};
},[company]);
 
 const openTab=(next:string)=>{setTab(next);setUserEditor(undefined);setCollaboratorEditor(undefined);setEditingRole(null)};
 const addRole=()=>{const name=newRole.trim();if(!name||roles.includes(name))return;setRoles(current=>[...current,name]);setPermissions(current=>({...current,[name]:emptyRolePermissions()}));setSelectedRole(name);setNewRole('');notify('Novo tipo de usuario criado.')};
 const deleteRole=(name:Role)=>{if(name==='Administrador')return;setRoles(current=>current.filter(role=>role!==name));setPermissions(current=>{const next={...current};delete next[name];return next});setUsers(current=>current.map(user=>user.role===name?{...user,role:'Padrao'}:user));setCollaborators(current=>current.map(person=>person.role===name?{...person,role:'Padrao'}:person));setSelectedRole('Administrador');notify('Tipo de usuario excluido e usuarios movidos para Padrao.')};
 const saveRoleName=()=>{if(!editingRole)return;const name=roleDraft.trim();if(!name||roles.includes(name)){notify('Informe um nome novo e unico.');return}setRoles(current=>current.map(role=>role===editingRole?name:role));setPermissions(current=>{const next={...current,[name]:current[editingRole]};delete next[editingRole];return next});setUsers(current=>current.map(user=>user.role===editingRole?{...user,role:name}:user));setCollaborators(current=>current.map(person=>person.role===editingRole?{...person,role:name}:person));setSelectedRole(name);setEditingRole(null);notify('Tipo de usuario atualizado.')};
 const toggleAccess=(screen:Screen,action:PermissionAction)=>{if(selectedRole==='Administrador')return;setPermissions(current=>({...current,[selectedRole]:{...current[selectedRole],[screen]:{...current[selectedRole][screen],[action]:!current[selectedRole][screen][action]}}}))};
 const registryItems=registries[tab]||[],setRegistryItems=(items:string[])=>setRegistries(current=>({...current,[tab]:items}));
 const adminExportData:{title:string;columns:ExportColumn[];rows:ExportRow[]}|null=tab==='Usuarios'?{title:`Usuários - ${company}`,columns:[{key:'nome',label:'Nome'},{key:'funcao',label:'Função'},{key:'perfil',label:'Perfil'},{key:'email',label:'E-mail'},{key:'ramal',label:'Ramal'}],rows:companyUsers.map(item=>({nome:item.name,funcao:item.job,perfil:item.role,email:item.email,ramal:item.extension}))}:tab==='Colaboradores'?{title:`Colaboradores - ${company}`,columns:[{key:'nome',label:'Nome'},{key:'funcao',label:'Função'},{key:'vinculo',label:'Setor ou máquina'},{key:'telefone',label:'Telefone'}],rows:companyCollaborators.map(item=>({nome:item.name,funcao:item.job,vinculo:item.assignment,telefone:item.phone}))}:tab==='Setores'?{title:`Setores - ${company}`,columns:[{key:'setor',label:'Setor'},{key:'pai',label:'Setor pai'}],rows:sectors.map(item=>({setor:item.name,pai:sectors.find(parent=>parent.id===item.parentId)?.name||'Grupo principal'}))}:tab==='Tipos de usuario'?{title:`Tipos de usuário - ${company}`,columns:[{key:'perfil',label:'Perfil'},{key:'modulos',label:'Módulos permitidos'}],rows:roles.map(role=>({perfil:role,modulos:screenCatalog.filter(module=>permissions[role]?.[module.id]?.view).map(module=>module.label).join(', ')}))}:tab==='Equipamentos'?{title:`Equipamentos - ${company}`,columns:[{key:'patrimonio',label:'Patrimônio'},{key:'nome',label:'Equipamento'},{key:'tipo',label:'Tipo'},{key:'modelo',label:'Modelo'},{key:'setor',label:'Setor'}],rows:equipment.map(item=>({patrimonio:item.patrimony,nome:item.name,tipo:item.type,modelo:item.model,setor:item.sector}))}:registryItems.length?{title:`${tab} - ${company}`,columns:[{key:'registro',label:tab}],rows:registryItems.map(item=>({registro:item}))}:null;

 return <section className="content page-enter"><div className="page-title"><div><span>ADMINISTRAÇÃO - {company}</span><h1>Cadastros e configurações</h1><p>Dados isolados da empresa ativa e controle completo de acesso.</p></div>{adminExportData&&<ExportButtons {...adminExportData}/>}</div><div className="admin-shell"><div className="admin-tree"><b><FolderTree/>Cadastros</b>{tabs.map(item=><button type="button" className={tab===item?'active':''} onClick={()=>openTab(item)} key={item}>{item}</button>)}</div><article className="panel admin-content">
 {tab==='Usuarios'?<>{userEditor===undefined?<><div className="content-head"><div><h2>Usuarios da empresa ativa</h2><p>Nome, funcao, perfil, empresa e foto</p></div><button type="button" className="primary" onClick={()=>{setPhotoPreview('');setUserEditor(null)}}><UserPlus/>Cadastrar novo usuario</button></div><PageList people={companyUsers} onEdit={person=>{setPhotoPreview(person.photo);setUserEditor(person as Person)}} onDelete={async id=>{
 const person=users.find(item=>item.id===id);

 if(!person?.userId)return;

 try{
  await apiDelete(
   `/api/admin/users/${person.userId}`
  );

  await loadAdminData();
  notify('Usuário desativado.');

 }catch(error){
  notify(
   error instanceof Error
    ?error.message
    :'Não foi possível desativar o usuário.'
  );
 }
}}/></>:<form key={userEditor?.id||'new-user'} className="modal-form two-column-form" onSubmit={async event=>{
 event.preventDefault();

 const data=new FormData(event.currentTarget);

 const password=String(
  data.get('password')||''
 );

 const body={
  name:String(data.get('name')),
  document:String(data.get('cpf')),
  phone:String(data.get('phone')),
  email:String(data.get('email')),
  extension:String(data.get('extension')),
  jobTitle:String(data.get('job')),
  sectorId:String(data.get('sectorId')||'')||null,
  role:apiRoleValue(
   String(data.get('role'))
  ),
  active:true,
  ...(password?{password}: {})
 };

 try{
  if(userEditor?.userId){

   await apiPut(
    `/api/admin/users/${userEditor.userId}`,
    body
   );

   notify('Usuário atualizado.');

  }else{

   if(password.length<8){
    notify(
     'A senha inicial deve possuir pelo menos 8 caracteres.'
    );
    return;
   }

   await apiPost(
    '/api/admin/users',
    body
   );

   notify(
    'Usuário cadastrado com sucesso.'
   );
  }

  setPhotoPreview('');
  setUserEditor(undefined);

  await loadAdminData();

 }catch(error){
  notify(
   error instanceof Error
    ?error.message
    :'Não foi possível salvar o usuário.'
  );
 }
}}><h2>{userEditor?'Editar usuario':'Novo usuario'}</h2><label>Nome completo<input name="name" defaultValue={userEditor?.name} required/></label><label>CPF<input name="cpf" defaultValue={userEditor?.cpf} required/></label><label>Telefone<input name="phone" defaultValue={userEditor?.phone} required/></label><label>E-mail<input name="email" type="email" defaultValue={userEditor?.email} required/></label><label>Empresa<input value={company} disabled/></label><label>Funcao<input name="job" defaultValue={userEditor?.job} required/></label><label>
Setor
<select
 name="sectorId"
 defaultValue={userEditor?.sectorId||''}
>
 <option value="">
  Sem setor definido
 </option>
 {sectors.map(sector=>(
  <option
   value={sector.id}
   key={sector.id}
  >
   {sector.name}
  </option>
 ))}
</select>
</label><label>Tipo de usuario<select name="role" defaultValue={userEditor?.role||roles[0]}>{roles.map(role=><option key={role}>{role}</option>)}</select></label><label>Ramal<input name="extension" defaultValue={userEditor?.extension} required/></label><label>Senha inicial<input name="password" type="password" required={!userEditor} minLength={8} autoComplete="new-password" placeholder={userEditor?'Preencha somente para redefinir':'Mínimo de 8 caracteres'}/></label><div className="form-alert full">No primeiro acesso, o usuário deverá criar uma nova senha.</div><label className="upload-card">Foto do usuario<input type="file" accept="image/*" onChange={event=>chooseFile(event.target.files?.[0],setPhotoPreview)}/>{photoPreview?<img src={photoPreview}/>:<span><Upload/>Selecionar foto</span>}</label><div className="form-actions full"><button type="button" onClick={()=>{setPhotoPreview('');setUserEditor(undefined)}}>Voltar</button><button className="primary"><Save/>{userEditor?'Salvar alteracoes':'Salvar usuario'}</button></div></form>}</>:
 tab==='Colaboradores'?<>{collaboratorEditor===undefined?<><div className="content-head"><div><h2>Colaboradores habilitados</h2><p>Somente usuarios ja cadastrados podem ser vinculados</p></div><button type="button" className="primary" onClick={()=>setCollaboratorEditor(null)}><Plus/>Registrar colaborador</button></div><PageList people={companyCollaborators} extra onEdit={person=>setCollaboratorEditor(person as Collaborator)} onDelete={id=>{setCollaborators(current=>current.filter(person=>person.id!==id));notify('Vinculo de colaborador excluido.')}}/></>:<form key={collaboratorEditor?.id||'new-collaborator'} className="modal-form" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget),id=String(data.get('user')),selectedUser=users.find(person=>person.id===id);if(selectedUser){const record={...selectedUser,assignment:String(data.get('assignment'))};setCollaborators(current=>collaboratorEditor?current.map(person=>person.id===collaboratorEditor.id?record:person):[...current,record]);}setCollaboratorEditor(undefined);notify(collaboratorEditor?'Colaborador atualizado.':'Usuario vinculado como colaborador.')}}><h2>{collaboratorEditor?'Editar colaborador':'Novo colaborador'}</h2><p>Selecione um usuario existente da empresa {company}.</p><label>Usuario cadastrado<select name="user" required defaultValue={collaboratorEditor?.id||''}><option value="" disabled>Selecione um usuario</option>{[...(collaboratorEditor?[collaboratorEditor]:[]),...eligible].filter((person,index,array)=>array.findIndex(item=>item.id===person.id)===index).map(person=><option value={person.id} key={person.id}>{person.name} - {person.job}</option>)}</select></label><label>Setor ou maquina direcionada<input name="assignment" defaultValue={collaboratorEditor?.assignment} required placeholder="Ex.: Producao ou CNC 03"/></label><label>Login inicial<input name="username" required={!collaboratorEditor} defaultValue={collaboratorEditor?.email?.split('@')[0]||''} autoComplete="off"/></label><label>Senha inicial<input name="password" type="password" required={!collaboratorEditor} minLength={6} autoComplete="new-password" placeholder={collaboratorEditor?'Preencha somente para redefinir':'Mínimo de 8 caracteres'}/></label><div className="form-alert">No primeiro acesso, o colaborador será obrigado a criar uma nova senha.</div><div className="form-actions"><button type="button" onClick={()=>setCollaboratorEditor(undefined)}>Voltar</button><button className="primary"><Save/>{collaboratorEditor?'Salvar alteracoes':'Vincular colaborador'}</button></div></form>}</>:
 tab==='Setores'?<><h2>Setores Pai e setores relacionados</h2><p>Cadastre qualquer setor como grupo Pai e adicione quantos setores relacionados forem necessarios.</p><SectorTree items={sectors} reload={loadAdminData}/></>:
 tab==='Tipos de usuario'?<><div className="content-head"><div><h2>Tipos de usuario e permissoes</h2><p>Defina o acesso de cada grupo a cada modulo e acao.</p></div></div><div className="role-manager"><section className="role-directory"><div className="registry-create role-create"><input value={newRole} onChange={event=>setNewRole(event.target.value)} placeholder="Novo tipo de usuario"/><button type="button" className="primary" onClick={addRole}><Plus/>Adicionar</button></div>{editingRole&&<div className="role-inline-editor"><label>Editar tipo selecionado<input value={roleDraft} onChange={event=>setRoleDraft(event.target.value)}/></label><button type="button" title="Salvar" onClick={saveRoleName}><Check/></button><button type="button" title="Cancelar" onClick={()=>setEditingRole(null)}><X/></button></div>}<div className="role-list">{roles.map(role=><div className={'role-entry '+(selectedRole===role?'active':'')} key={role}><button type="button" className="role-select" onClick={()=>setSelectedRole(role)}><span>{role}</span></button><CrudActions protectedItem={role==='Administrador'} onEdit={role==='Administrador'?undefined:()=>{setSelectedRole(role);setEditingRole(role);setRoleDraft(role)}} onDelete={()=>deleteRole(role)}/></div>)}</div></section><section className="permission-panel"><div className="permission-title"><div><span>PERFIL SELECIONADO</span><h3>{selectedRole}</h3></div>{selectedRole==='Administrador'&&<small><ShieldCheck/>Acesso total protegido e nao alteravel</small>}</div><div className="access-table"><div className="access-head"><b>Modulo do sistema</b><b>Visualizar</b><b>Criar</b><b>Editar</b><b>Excluir</b></div>{screenCatalog.map(module=><div className="access-row" key={module.id}><b>{module.label}</b>{(['view','create','edit','delete']as PermissionAction[]).map(action=><label key={action}><input type="checkbox" disabled={selectedRole==='Administrador'} checked={!!permissions[selectedRole]?.[module.id]?.[action]} onChange={()=>toggleAccess(module.id,action)}/><span><Check/></span></label>)}</div>)}</div></section></div></>:
 tab==='Equipamentos'?<><div className="content-head"><div><h2>{equipmentEditor?'Editar equipamento':'Cadastro completo de equipamento'}</h2><p>Patrimonio, localizacao, identificacao e imagem</p></div>{equipmentEditor&&<button type="button" onClick={()=>{setEquipmentEditor(null);setEquipmentPhoto('')}}><Plus/>Novo equipamento</button>}</div><form key={equipmentEditor?.id||'new-equipment'} className="modal-form equipment-form" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget),patrimony=equipmentEditor?.patrimony||'PAT-'+String(equipment.length+1).padStart(4,'0'),record:Equipment={id:equipmentEditor?.id||Date.now(),name:String(data.get('name')),patrimony,type:String(data.get('type')),model:String(data.get('model')),serial:String(data.get('serial')),sector:String(data.get('sector')),purchase:String(data.get('purchase')),photo:equipmentPhoto||equipmentEditor?.photo||''};setEquipment(current=>equipmentEditor?current.map(item=>item.id===record.id?record:item):[...current,record]);setEquipmentEditor(null);setEquipmentPhoto('');event.currentTarget.reset();notify(equipmentEditor?'Equipamento atualizado.':`Equipamento salvo com patrimonio ${patrimony}.`)}}><label>Nome do equipamento<input name="name" defaultValue={equipmentEditor?.name} required/></label><label>Tipo<select name="type" defaultValue={equipmentEditor?.type||registries['Tipos de equipamento'][0]}>{registries['Tipos de equipamento'].map(item=><option key={item}>{item}</option>)}</select></label><label>Data de compra<input name="purchase" type="date" defaultValue={equipmentEditor?.purchase} required/></label><label>Numero de serie<input name="serial" defaultValue={equipmentEditor?.serial} required/></label><label>Modelo<input name="model" defaultValue={equipmentEditor?.model} required/></label><label>Setor<select name="sector" defaultValue={equipmentEditor?.sector||sectors[0]?.name}>{sectors.map(item=><option key={item.id}>{item.name}</option>)}</select></label><label className="equipment-photo-upload">Foto do equipamento<input type="file" accept="image/*" onChange={event=>chooseFile(event.target.files?.[0],setEquipmentPhoto)}/>{equipmentPhoto?<img src={equipmentPhoto}/>:<span><Image/>Adicionar foto</span>}</label><button className="primary"><Save/>{equipmentEditor?'Salvar alteracoes':'Gerar patrimonio e salvar'}</button></form><div className="equipment-list">{equipment.map(item=><article key={item.id}>{item.photo?<img src={item.photo}/>:<span><Image/></span>}<div><b>{item.name}</b><small>{item.type} · {item.model}</small><small>{item.sector} · Serie {item.serial}</small></div><strong>{item.patrimony}</strong><CrudActions onEdit={()=>{setEquipmentEditor(item);setEquipmentPhoto(item.photo)}} onDelete={()=>{setEquipment(current=>current.filter(equipmentItem=>equipmentItem.id!==item.id));if(equipmentEditor?.id===item.id)setEquipmentEditor(null);notify('Equipamento excluido.')}}/></article>)}</div></>:
 tab==='Empresas'?<><h2>Empresas e identidade visual</h2><form className="modal-form company-config-form" onSubmit={async event=>{
 event.preventDefault();

 try{
  await apiPut('/api/admin/branding',{
   logoData:logoPreview||null,
   backgroundData:backgroundPreview||null
  });

  onSaveCompanyLogo(company,logoPreview);

  window.dispatchEvent(
   new Event('operix-branding-changed')
  );

  notify('Identidade visual salva globalmente.');
 }catch(error){
  notify(
   error instanceof Error
    ?error.message
    :'Não foi possível salvar a identidade visual.'
  );
 }
}}><label>Empresa ativa<input value={company} disabled/></label><label className="company-brand-upload">Logo da empresa<input type="file" accept="image/*" onChange={event=>readPersistentImage(event.target.files?.[0],setLogoPreview)}/>{logoPreview&&<span><img src={logoPreview} alt={`Previa da logo ${company}`}/><small>Previa da logo que aparecera no cabecalho</small><button type="button" className="remove-company-logo" onClick={()=>{setLogoPreview('');notify('Logo removida da prévia. Clique em Salvar identidade visual para confirmar.')}}><Trash2/>Remover logo</button></span>}</label><label className="company-brand-upload">Imagem de fundo da empresa<input type="file" accept="image/*" onChange={event=>readPersistentImage(event.target.files?.[0],setBackgroundPreview)}/>{backgroundPreview&&<span className="background-preview"><img src={backgroundPreview} alt={`Previa do fundo ${company}`}/><small>Imagem selecionada para a empresa</small></span>}</label><button className="primary"><Save/>Salvar identidade visual</button></form><h3>Empresas cadastradas</h3><RegistryEditor title="Empresas" items={registries.Empresas} setItems={items=>setRegistries(current=>({...current,Empresas:items}))}/></>:
 tab==='Aparencia'?<><h2>Aparência do sistema</h2><div className="color-settings"><label>Cor principal<input type="color" value={colors.primary} onChange={event=>setColors({...colors,primary:event.target.value})}/></label><label>Cor dos textos<input type="color" value={colors.text} onChange={event=>setColors({...colors,text:event.target.value})}/></label><label>Cor de fundo<input type="color" value={colors.background} onChange={event=>setColors({...colors,background:event.target.value})}/></label><label>Nome do sistema<input value={systemName} onChange={event=>setSystemName(event.target.value)}/></label><label className="system-media-upload">Logo ou vídeo do sistema<input type="file" accept="image/*,video/mp4,video/webm" onChange={event=>readPersistentImage(event.target.files?.[0],setSystemMediaPreview)}/>{systemMediaPreview&&(systemMediaPreview.startsWith('data:video')?<video src={systemMediaPreview} autoPlay loop muted playsInline/>:<img src={systemMediaPreview} alt="Prévia da logo do sistema"/>)}</label><button type="button" className="primary" onClick={()=>{localStorage.setItem('operix.system.media',systemMediaPreview);localStorage.setItem('operix.system.name',systemName);window.dispatchEvent(new Event('operix-system-media'));notify('Aparência salva.')}}><Save/>Salvar aparência</button></div></>:
 tab==='Mensagem global'?<><h2>Mensagem global do sistema</h2><label className="message-field">Mensagem<textarea value={globalMessage} onChange={event=>setGlobalMessage(event.target.value)}/></label><button type="button" className="primary" onClick={()=>notify('Mensagem global publicada para todos os usuarios.')}><Save/>Publicar para todos</button></>:
 <><div className="content-head"><div><h2>{tab}</h2><p>Cadastre, edite ou exclua os registros desta categoria.</p></div><PackagePlus/></div><RegistryEditor title={tab} items={registryItems} setItems={setRegistryItems}/></>}
 </article></div></section>;
}

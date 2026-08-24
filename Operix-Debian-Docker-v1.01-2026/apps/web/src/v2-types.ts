export type Company='Grafmarques'|'INFINNI'|'M.Print';
export type Role=string;
export type Screen='dashboard'|'tickets'|'orders'|'maintenance'|'it'|'fleet'|'reviews'|'safety'|'hr'|'warehouse'|'training'|'admin';
export type OrderStatus='Aberta'|'Em andamento'|'Aguardando avaliacao'|'Finalizada'|'Cancelada';
export type Ticket={id:string;company:Company;team:'MANUTENCAO'|'T.I.';sector:string;request:string;requester:string;extension:string;status:'Novo'|'Negado'|'Aprovado';createdAt:string;signature:string;decidedAt?:string;decisionReason?:string;orderId?:string};
export type Material={kind:'ALMOXARIFADO'|'COMPRA';description:string;quantity:number};
export type ChecklistResult='SIM'|'NAO'|'NAO_SE_APLICA';
export type ChecklistAnswer={result:ChecklistResult;justification?:string};
export type Order={id:string;company:Company;ticketId:string;sector:string;request:string;requester:string;status:OrderStatus;openedAt:string;approvedAt?:string;closedAt?:string;priority:string;serviceType:string;startedAt:string;lead:string;technician:string;workDone:string;beforePhoto:string;afterPhoto:string;technicianSignature:string;requesterSignature?:string;checklist:string;checkAnswers:Record<string,boolean|ChecklistAnswer>;materials:Material[];rating?:string;ratingReason?:string};
export type Sector={
  id:string;
  name:string;
  parentId:string|null;
  costCenter?:string|null;
  active?:boolean;
};

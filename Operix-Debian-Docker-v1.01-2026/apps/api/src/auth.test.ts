import test from 'node:test';import assert from 'node:assert/strict';import {canReadAll} from './auth.js';
import {canDecideTicket,requireFinishFields} from './workflow.js';
test('solicitantes nao leem a fila inteira',()=>assert.equal(canReadAll('REQUESTER'),false));
test('tecnicos leem a fila da empresa vinculada',()=>assert.equal(canReadAll('TECHNICIAN'),true));
test('solicitante nao aprova chamado',()=>assert.equal(canDecideTicket('REQUESTER'),false));
test('tecnico aprova chamado',()=>assert.equal(canDecideTicket('TECHNICIAN'),true));
test('OS nao finaliza sem fotos e assinatura',()=>assert.equal(requireFinishFields({startedAt:new Date(),serviceDescription:'Reparo',beforePhotoKey:'a',afterPhotoKey:'b'}),false));

# Operix
OPERIX é uma plataforma web integrada para gestão empresarial, centralizando chamados, ordens de serviço, manutenção, TI, frota, EPIs, segurança do trabalho, almoxarifado, RH e treinamentos. Multiempresa, com controle de usuários e permissões, oferece organização, rastreabilidade e eficiência operacional.

OPERIX — Sistema Integrado de Gestão Empresarial

O OPERIX é uma plataforma web integrada para centralizar e simplificar processos operacionais e administrativos de empresas. O sistema reúne em um único ambiente a gestão de chamados, ordens de serviço, manutenção, TI, frota, segurança do trabalho, EPIs, almoxarifado, RH, treinamentos e solicitações internas.

Desenvolvido com arquitetura multiempresa, o OPERIX possui controle de usuários, perfis, permissões e setores, permitindo que cada colaborador tenha acesso apenas aos módulos e funcionalidades correspondentes às suas atribuições.

A plataforma foi projetada para oferecer rastreabilidade, organização, padronização de processos e acompanhamento das operações, substituindo controles descentralizados por uma solução única, moderna e escalável.

Principais recursos: gestão multiempresa, chamados e ordens de serviço, manutenção preventiva/corretiva/preditiva, gestão de TI e ativos, frota, EPIs e segurança do trabalho, almoxarifado e estoque, RH, treinamentos, controle de acesso por perfil, dashboards, histórico e rastreabilidade das operações.

Stack: React + TypeScript • Node.js • PostgreSQL • Nginx • Docker

OPERIX — Gestão integrada para transformar solicitações em operações controladas.

# Operix v1.01-2026

Plataforma operacional multiempresa para Grafmarques, INFINNI e M.Print. Reúne chamados do solicitante, aprovação setorial, ordens de serviço, manutenção, TI, gestão de frota, avaliações obrigatórias, Segurança do Trabalho, almoxarifado, inventário de EPIs, cadastros, relatórios e controle de acesso.

## Fluxo operacional da versão

- A aba Chamados mostra somente as solicitações do usuário autenticado e seu andamento.
- Chamados de Manutenção e TI são aprovados ou negados dentro da gestão responsável, com data, hora e justificativa da negativa.
- Toda ordem lista solicitante, data do chamado, aprovação, encerramento e avaliação.
- Uma ordem tecnicamente concluída aguarda avaliação obrigatória e justificativa do solicitante. Enquanto houver avaliação pendente, a API e a interface bloqueiam um novo chamado.
- Checklists usam respostas Sim, Não ou Não se aplica. Toda resposta Não exige justificativa.
- Entregas do almoxarifado registram resposta, quantidade, responsável, data, comprovante e assinaturas do responsável e do recebedor.

## Tecnologias

- React, TypeScript e Vite no frontend.
- Node.js, Express e TypeScript na API.
- PostgreSQL 16.
- Nginx e Docker Compose em produção.

## Desenvolvimento e teste no Windows

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm dev
```

Para testar somente a build pronta, execute `Iniciar-Operix.ps1` e acesse `http://localhost:4173`.

## Ambiente completo com Docker

```bash
cp .env.example .env
# Edite senhas e APP_ORIGIN.
docker compose config
docker compose up --build -d
docker compose ps
```

A aplicação ficará em `WEB_PORT`, normalmente `http://localhost:8080`. A porta do PostgreSQL não é publicada.

## Gerar os pacotes de entrega

Depois de `pnpm build`, execute no Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\Gerar-Pacotes.ps1
```

Arquivos gerados em `release/`:

- `Operix-Teste-Windows11-v1.01-2026.zip`: demonstração local simples no Windows 11.
- `Operix-Windows-Server-v1.01-2026.zip`: implantação completa em Windows Server com Docker/Compose compatível.
- `Operix-Debian-Docker-v1.01-2026.zip`: implantação completa no Debian com Docker Engine e Compose v2.

## Documentação

- [Windows Server](docs/WINDOWS_SERVER.md)
- [Debian com Docker](docs/DOCKER_DEBIAN.md)
- [GitHub](docs/GITHUB.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Estado técnico](docs/STATUS_ATUAL.md)

## Segurança antes da produção

Troque credenciais iniciais, use HTTPS, restrinja o firewall, configure backup externo e teste a restauração. Não versione `.env`, backups ou anexos reais. A demonstração local usa dados do navegador; a implantação definitiva deve usar API/PostgreSQL e armazenamento protegido para anexos.

## Verificação de qualidade

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test
docker compose config
```

Registre cada versão em um Pull Request e uma release do GitHub.

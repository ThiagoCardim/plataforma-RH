# Relatório dos testes PostgreSQL locais

Resultado: **76 testes aprovados**, em 13/11/2026.

Servidor real: `PostgreSQL 17.6 (Debian 17.6-2.pgdg12+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14+deb12u1) 12.2.0, 64-bit`.

Execução: `python tests/postgres/run.py`. Imagem PostgreSQL fixada por digest; container descartável com `--network none`, sem porta publicada ou URL de banco remoto. A fixture contém somente identidades, organizações e catálogos inventados. Fundação e Auth locais simulam o contrato já versionado; não copiam registros do projeto ativo.

A relação individual dos 76 casos e os hashes SHA-256 do SQL executado estão em [TESTES.json](TESTES.json). O executor para no primeiro erro e só grava relatório PASS após concluir os testes. Os hashes foram conferidos novamente antes da entrega.

Foram exercitados os cinco lotes 00–04 e os dois scripts de recuperação, sem substituir os corpos das funções por mocks. Os cenários incluem sobreposição e reingresso, contratos programados sem acesso antecipado, prazo previsto versus fim real, três tipos contratuais, movimentação e cadeia histórica, liderança/supervisão, associação de conta, RLS/organização, privado/exportação, revisão excepcional, autoaprovação por usuário e por pessoa após trocar de conta, idempotência/versão NULL, auditoria, rollback e exceções finitas.

Na concorrência foram usadas duas sessões independentes, com uma transação segurando o lock. Um observador verificou a primeira em espera temporizada e a segunda bloqueada em lock em pg_stat_activity. Ao liberar a primeira, a submissão repetida retornou o mesmo resultado e a tentativa de vínculo independente sobreposto falhou. Não se tratou apenas de executar duas chamadas em sequência.

Os casos de recuperação confirmaram que R1 fecha RPCs e leitura novas, preserva dados e mantém o acesso do vínculo encerrado bloqueado. R2, separado, restaura explicitamente o comportamento legado; seu risco de readmissão está documentado. Também foi testada a recusa de grants herdados imprevistos em tabelas e funções, com rollback do lote exato.

A tabela e o trigger sentinela da outra aplicação fictícia permaneceram idênticos. Isso valida a fixture, não certifica todos os aplicativos do banco hospedado. Não foram testados PostgREST real, renovação de sessão, volume de produção ou configuração do Supabase remoto.

Nenhuma alteração no Supabase compartilhado foi realizada. Código da interface, clientes Supabase, proxy, ações Auth, dependências e migrations permanecem iguais a 6adeaa6.

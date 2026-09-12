insert into public.acoes (codigo, nome) values
  ('portfolio.read','Consultar portfólio'),
  ('initiative.create','Criar iniciativa'),
  ('initiative.update','Atualizar iniciativa'),
  ('initiative.archive','Arquivar iniciativa'),
  ('assessment.create','Criar avaliação'),
  ('dependency.manage','Gerenciar dependências'),
  ('risk.manage','Gerenciar riscos/impedimentos'),
  ('capacity.manage','Gerenciar capacidade'),
  ('financial.manage','Gerenciar financeiro'),
  ('decision.create','Registrar decisão'),
  ('forum.manage','Gerenciar fórum'),
  ('snapshot.generate','Gerar snapshot'),
  ('parameter.manage','Gerenciar parâmetros'),
  ('masterdata.manage','Gerenciar cadastros mestres'),
  ('useraccess.manage','Gerenciar acessos')
on conflict (codigo) do nothing;

insert into public.perfis (codigo, nome, origem_regra) values
  ('GERENTE_EXECUTIVO_FE','Gerente Executivo FE','A_VALIDAR_FEG'),
  ('GERENTE_FEG','Gerente FEG','A_VALIDAR_FEG'),
  ('GERENTE_DOMINIO','Gerente de Domínio','A_VALIDAR_FEG'),
  ('ANALISTA_GOV_PORTFOLIO','Analista de Governança e Portfólio','A_VALIDAR_FEG'),
  ('LIDER_COMUNIDADE','Líder de Comunidade','A_VALIDAR_FEG'),
  ('PRODUCT_OWNER','Product Owner','A_VALIDAR_FEG'),
  ('CONSULTA','Consulta','A_VALIDAR_FEG')
on conflict (codigo) do nothing;

-- Não há seed de perfil_acoes: permissões finais dependem de validação da FEG.

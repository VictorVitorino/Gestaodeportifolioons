insert into public.gerencias (sigla, nome)
values
  ('FEG', 'FEG'),
  ('FEL', 'FEL'),
  ('FEN', 'FEN'),
  ('FER', 'FER')
on conflict (sigla) do nothing;

-- Os nomes completos não são inferidos aqui para evitar criar informação não confirmada.

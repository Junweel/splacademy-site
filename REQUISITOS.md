# SPLA · Site v0 · Requisitos

*Criado em 04/11/2026, à noite (horário de Brasília, UTC-3).*

**Origem.** O histórico do chat não pôde ser aberto direto. Os requisitos abaixo foram **recuperados da memória do Grok Bot**, que guarda o que o Joël passou no chat, e dos documentos do projeto no box. As frases entre aspas são trechos dessa memória. Status: ✅ feito no v0 · 🟡 parcial · ⏳ adiado, com o motivo.

## A. O que o Joël pediu para o site (29/10/2026)
| # | Requisito (memória) | Status v0 |
|---|---|---|
| A1 | "Built for the school's target audience so visitors feel comfortable exploring and asking questions" | ✅ Linguagem de parceiro, FAQ, "Pergunte à Sophia" em todas as páginas e diagnóstico rápido no Contato |
| A2 | "Technological and visually striking (animated transcriptions, mouse-hover reactions, the latest web techniques)" | ✅ Transcrição animada na home. Sophia acompanha o cursor com os olhos, pisca e mexe a boca enquanto a legenda é digitada. Piso reage ao mouse. View Transitions, scroll-driven animations, container queries |
| A3 | "Must not look AI-made" | 🟡 Personagens aprovados no estilo Modernismo Geométrico, layout editorial, texto revisado contra clichês. **O Joël precisa validar** |
| A4 | Conteúdo: metodologia e base científica | ✅ /metodologia |
| A5 | Conteúdo: diversão e gamificação | ✅ /como-e-estudar |
| A6 | Conteúdo: história de São Paulo e identidade da marca | ✅ /sao-paulo |
| A7 | Escola multi-idiomas: inglês primeiro, estrutura pronta para vários idiomas desde o início | ✅ Build com i18n (pt-BR + /en placeholder, hreflang). Texto diz "inglês agora, outros idiomas em seguida" |
| A8 | "The site is the school's structure: an institutional base, also usable as a classroom. The app is the student's" | 🟡 Base institucional pronta. **Sala de aula no site ⏳** (precisa de login/back-end, fica para fase 2) |
| A9 | "Mobile-first, smartphones above all" | ✅ CSS mobile-first, testado em 390 px |

## B. Decisões do Joël que valem para o site
| # | Decisão (memória) | Status |
|---|---|---|
| B1 | Piso paulista fica, "used discreetly, not massive" (no app parecia placa de trânsito) | ✅ Só tom sobre tom (opção C), faixas finas e baixa opacidade |
| B2 | Fundos claros e limpos, "no strong colour fills"; mesma identidade dos protótipos | ✅ |
| B3 | Crédito respeitoso à Mirthes Bernardes | ✅ Rodapé + seção na página São Paulo |
| B4 | Joël não aparece na página Sobre por enquanto | ✅ |
| B5 | CNPJ: SIIN ANALYTICS SISTEMAS INFORMATICOS LTDA · 54.575.722/0001-01 | ✅ Rodapé |
| B6 | Tirar "Cambridge" da bio da Sophia | ✅ |
| B7 | Certificado: sem aviso chamativo de "não oficial", mas nunca dizer que é oficial | ✅ "nível equivalente (CEFR)" |
| B8 | Títulos aprovados: "SPLA · Inglês para SAP, ERP, Cloud e o mundo corporativo" e trilha "Inglês para SAP, ERP e Cloud" | ✅ |
| B9 | Nunca posicionar a SPLA como "só SAP": 4 setores (Serviços/Corporativo, Industrial/Operações, Comércio/Varejo, Saúde/Educação) | ✅ /trilhas |
| B10 | Compromisso: "você vai sair falando"; CEFR como escala (zero a C1); garantia de evolução (fez as atividades e não sentiu progresso, o plano é refeito sem custo) | ✅ |
| B11 | Tom esperançoso e confiante, sem autodepreciação ("não temos MEC/CEFR", "nenhum aluno pagante") | ✅ |
| B12 | Parcerias com universidades só como plano | ✅ Uma linha em Sobre ("estamos conversando"). Sem nomes |
| B13 | Inspiração: Semana de Arte Moderna de 1922 + Piso Paulista | ✅ /sao-paulo |
| B14 | Balão grande branco (português) + balão pequeno vermelho (idioma aprendido) | ✅ Transcrição animada da home |
| B15 | Vocabulário da gamificação aprovado (2ª rodada, 04/11): Daily · On Track · Forecast/Weekly Close · Sprint · Deliverables · Quick Win × Stretch · Change Request · Back on Track · Liga de Squads · Capital. **Fora:** Track Record, Roadmap da Paulista/Milestones, Sign-off, Matchup | ✅ Seguida a decisão mais recente (ver perguntas) |
| B16 | Proibido: "XP", "Ofensiva/Streak", ranking individual, punição por ausência | ✅ |
| B17 | Texto humano, que não soe IA; checklist de qualidade e reteste | ✅ Testes headless em 390/1440 px; checklist no relatório |

## C. Regras do brief desta noite (do agente principal)
| # | Regra | Status |
|---|---|---|
| C1 | Páginas: Home, Metodologia, Trilhas/Setores, Como é estudar, Para empresas, São Paulo & identidade, Sobre, Contato/FAQ | ✅ (+ Privacidade e 404) |
| C2 | i18n pt-BR + /en placeholder | ✅ |
| C3 | Acessibilidade: contraste, alt, prefers-reduced-motion, foco visível, alvos ≥44 px | ✅ |
| C4 | Performance: imagens otimizadas, sem frameworks pesados | ✅ HTML/CSS/JS puro, webp, fonte própria |
| C5 | SEO: meta, Open Graph, sitemap.xml, robots.txt | ✅ (prévia com noindex) |
| C6 | "Pergunte à Sophia" roteirizado, sem chave de API | ✅ |
| C7 | Nada de CEFR/Cambridge/ETS/MEC credenciado, nota garantida, endosso de pesquisadores, promessa financeira, depoimentos/logos/números inventados, **preços** | ✅ Ver checklist no relatório |
| C8 | "48 pesquisadores" sem nomes, "mais de 80 métodos de ensino com evidência publicada" | ✅ |
| C9 | Contato: contact@splacademy.com.br · WhatsApp +55 11 9 8178-3554 | ✅ |
| C10 | Prévia só em github.io; nada de DNS, domínio próprio, Registro.br, Search Console ou Analytics | ✅ |

## D. Adiado (⏳)
- Sala de aula / área do aluno e área do RH no site (precisam de back-end e login).
- Versão em inglês completa e outros idiomas.
- Formulário com envio (hoje: e-mail e WhatsApp, sem servidor).
- Domínio splacademy.com.br, Search Console e Analytics (aguardam aprovação do Joël).
- Lista de referências científicas com autores (aguarda decisão; o brief pede sem nomes).
- Licença do padrão com a família da Mirthes Bernardes (conversas em andamento). O uso no site segue discreto e com crédito.

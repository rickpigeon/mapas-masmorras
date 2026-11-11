/**
 * Mapas-masmorras: what the GM needs to know about each dungeon of "Jornada Heroica: A Libertação de Valkaria"
 * (Jambô, 2025). Short paraphrases with the printed page; the book has the full rules.
 * light: default light preset (constants.LIGHTS); remember: the fog keeps what was seen (Tauron does not).
 */
export const DUNGEONS = {
  1: {
    god: "Allihanna", page: 53, light: "clara", remember: true,
    ambiente: "Floresta tropical: os túneis são trilhas e as câmaras, clareiras. Fora da trilha a mata age como Controlar Plantas CD 16 e devolve o grupo ao mesmo ponto. Frutos (Sobrevivência CD 16): pomelo roxo +1d4 PV, copo de néctar +1 PM, goiabinha bichada perde 1d6 PV (p. 53).",
    agrado: "Não matar habitantes nem destruir grandes porções da mata (efeitos de área) (p. 53).",
    encontros: "1d6 por hora; 1 = encontro (p. 54).",
    tabela: { dado: "1d6", linhas: ["1: capivara (AdA 211)", "2: centauro combatente (T20 290)", "3: 3 gali-galis (AdA 247)", "4: 2 lobos (T20 290)", "5: urso panda (AdA 223)", "6: um ente que só quer conversar (AdA 106)"] },
    areas: {
      "1": ["o lago", 54, "Elefantes em debandada: teste estendido individual CD 16 (3 sucessos) de Acrobacia, Adestramento ou Atletismo; cada falha 1d6+2; falha total: PV máx −1 por nível até descansar."],
      "2": ["serval assassino", 54, "O serval (p. 57) embosca o último da fila com Bote Felino e foge se não derrubar."],
      "3": ["covil do urso protetor", 54, "Urso (ND 1) luta até cair; o túnel de saída é estreito (Grande passa com dificuldade)."],
      "3a": ["câmara do urso", 54, "Caverna sob a clareira 3."],
      "4": ["o santuário de Allihanna", 56, "Com o urso vivo, recupera 2d8+2 PV e 1d4 PM (uma vez por personagem)."],
      "5": ["o druida defensor", 56, "Guardião Fallandi (ND 2) com leão e urso; Diplomacia CD 18 leva a um duelo não letal."]
    }
  },
  2: {
    god: "Ragnar", page: 58, light: "escura", remember: true,
    ambiente: "Escuridão total (só visão no escuro); carregar luz atrai monstros. Correr ou investir: Acrobacia CD 15. −5 em Constituição, Cura, Fortitude e Ofício (cozinheiro) (p. 58).",
    agrado: "Lutar todas as batalhas até o fim (sem fugir, render-se ou oferecer rendição) e sacrificar a prisioneira final e os resgatados (p. 58).",
    encontros: "1d6 a cada câmara nova; 1 (1–2 com luz) = encontro; armadilhas ativadas também rolam. Patrulha com prisioneiro: 1 em 1d10 (p. 59).",
    tabela: { dado: "1d6", linhas: ["1: 2 orcs combatentes (AdA 33)", "2: orc veterano (AdA 33)", "3: 4 bandidos goblins (p. 63)", "4: 2 meio-orcs capangas (AdA 31)", "5: bugbear sentinela (AdA 79)", "6: hobgoblin patife (p. 64)"] },
    areas: {
      "1": ["o covil dos ogros", 59, "Escada (Acrobacia CD 17); Chiisaku disfarçado de prisioneiro e 4 ogros carrascos; cortina de sangue (Fortitude CD 17)."],
      "2": ["os orcs de Graordek", 59, "Graordek (ND 1) e 6 orcs ladinos: metade escondida, metade com arcos."],
      "3": ["armadilhas", 61, "Tabela 1d8 de armadilhas; sem luz ou visão no escuro, −5 para encontrar."],
      "4": ["Rornagar, o Conquistador esquecido", 61, "Guardião Rornagar (ND 2) e 4 goblins; a prisioneira Helendira pede a morte (Agrado)."]
    }
  },
  3: {
    god: "Glórienn", page: 65, light: "clara", remember: true,
    ambiente: "Arte que se refaz. Mesas com comida (2d8+2 PV) e bebida (2d4+2 PM), uma vez por dia; não elfos ficam fracos ou frustrados, goblinoides perdem PV. Toda falha em Vontade custa 2d8 PV e 2d4 PM (p. 65).",
    agrado: "Não roubar nem danificar arte, não pilhar os inimigos e não matar nenhum elfo (p. 65).",
    encontros: "1d6 a cada corredor ou câmara; 1 = encontro (p. 67).",
    tabela: { dado: "1d6", linhas: ["1: arqueiro de Glórienn e 1d4 caçadores (p. 69)", "2: 1d6+1 caçadores de Glórienn (p. 69)", "3: 2 menestréis elfos (p. 70)", "4: menestrel cantando para 2 arqueiros", "5: 1 arqueiro de Glórienn", "6: menestrel e 1d6 caçadores descansando"] },
    areas: {
      "1": ["o fosso", 67, "Portas trancadas (Ladinagem CD 25); o chão fica 30 m abaixo (Reflexos CD 20; queda 10d6). Baús com estátua (névoa tóxica) e joias."],
      "2": ["defensores de Glórienn", 67, "Arqueiro e 4 caçadores atrás de paliçada (+5 Def)."],
      "3": ["sarau do sofrimento", 68, "Vontade CD 22 a cada hora (elfos −5): pasmo, −2d8 PV e −2d4 PM. Saída: Atuação estendida CD 25."],
      "4": ["Sharin, a maga guardiã", 68, "Invisível e com Imagem Espelhada; poupada com o Agrado cumprido, entrega tesouro extra."]
    }
  },
  4: {
    god: "Lena", page: 71, light: "clara", remember: true,
    ambiente: "Energia positiva: luz cura o dobro; trevas e necromancia custam +1 PM e saem mínimas. Criaturas com Imunidade Vital e Vulnerabilidade a Cura; param de lutar com metade dos PV (p. 71).",
    agrado: "Não matar nem causar dano a nenhuma criatura (usar cura para ferir também viola) (p. 71).",
    encontros: "1d6 a cada meia hora; 1 = encontro; criaturas de tamanho aumentado (p. 72).",
    tabela: { dado: "1d6", linhas: ["1: 2d6 lobos (Grandes)", "2: 2 sapos atrozes (Enormes)", "3: 2d4 capivaras (Grandes)", "4: 2 ursos pardos (Enormes)", "5: 1d4 tropas de tentacutes (Grandes)", "6: carrasco de Lena (Enorme)"] },
    areas: {
      "1": ["rios de seiva", 72, "Atletismo estendido CD 19 (3 sucessos); no fim de cada rodada 1d4: no 1, raiz causa 2d6 (Reflexos CD 19 metade)."],
      "2": ["o covil dos dilaceradores", 72, "4 filhotes de razza'kham, imunes a dano pela regra da masmorra."],
      "3": ["câmara sem saída", 72, "Enigma cronometrado: 3 min + 30 s × soma da Int do grupo; cada minuto extra custa 3 PM. Semente → água sagrada → flor → ovo → fadinha abre a porta."],
      "4": ["o dragonete", 74, "Guardião Tandan (ND 6), rei da arena: Fonte Restaurativa, Linhas Místicas e 3 portais."]
    }
  },
  5: {
    god: "Hyninn", page: 76, light: "penumbra", remember: true,
    ambiente: "+2 em Furtividade; poucos monstros e muitas armadilhas. No início de cada cena, 1d4: no 1, uma perícia troca por outra (em segredo). Há 1d4+2 duplos fingindo ser companheiros (p. 76).",
    agrado: "Cada um passa em pelo menos um teste real (CD 20+) de Acrobacia, Enganação, Furtividade, Jogatina ou Ladinagem (p. 76).",
    encontros: "Tabela 1d6, +2 com o grupo parado (p. 77).",
    tabela: { dado: "1d6", linhas: ["1–2: armadilha", "3: 1d4 gárgulas (AdA 125)", "4: mímico (AdA 203)", "5: gárgula assassina (AdA 125)", "6: 1d3 tigres-de-Hyninn (AdA 206)"] },
    areas: {
      "1": ["armadilhas", 77, "Tabela 1d10: câmara alagada, teleporte (o bolo), pedra rolante e outras; os pontos marcados são versões refinadas."],
      "2": ["a gárgula suspeita", 80, "A estátua é falsa; quem ataca é a mobília (armário, baú que engole itens, corrente)."],
      "3": ["jogo arriscado", 80, "Caça-níquel: T$ 10 por puxada, 5d4 (cada 4 é um sucesso); cada puxada rola encontro."],
      "4": ["o primeiro tigre", 80, "Armadilhas surgem quando alguém se move (1d20 < quadrados andados); vencer o tigre não basta: é preciso matar um duplo."]
    }
  },
  6: {
    god: "Marah", page: 83, light: "clara", remember: true,
    ambiente: "Chuva de pétalas de disjunção: itens mágicos expostos ficam mundanos por 24 h. −2 em Intimidação, Vontade e ataques; +2 nas outras perícias de Carisma. Habitantes com Aura de Paz e Drenar Motivação (p. 83).",
    agrado: "Nenhuma forma de violência (p. 83).",
    encontros: "1d6 a cada sala vazia e a cada descanso; 1–2 = encontro, sempre amistoso (p. 84).",
    tabela: { dado: "1d6", linhas: ["1: 2 sacerdotes (GdN 68)", "2: gnoll xamã de Marah (AdA 119)", "3: 2 sílfides bardos (p. 88)", "4: xamã de Sarana (AdA 268)", "5: mestre mercante (GdN 67)", "6: instrumento divino de Marah (AdA 133)"] },
    areas: {
      "1": ["a festa das fadas", 84, "Vontade estendida CD 21 (3 sucessos): falha total vira sílfide; sucesso dá +1 PM permanente. Passam-se 2d12 horas."],
      "2": ["o lago das elfas", 86, "Três dríades (duas invisíveis), Marca da Obediência; amistosos ganham +1d6."],
      "3": ["guerreiros celestiais", 86, "Estátuas ilusórias (Vontade CD 24); atacá-las viola o Agrado."],
      "4": ["o salão dos amores possíveis", 86, "Teste estendido CD 22 em ordem: Reflexos → Fortitude → Vontade."],
      "5": ["a tentação da paz", 87, "Guardiã Prislanya aparece como Valkaria acorrentada; recusar o Desejo vence o desafio."]
    }
  },
  7: {
    god: "Tenebra", page: 89, light: "escura", remember: true,
    ambiente: "Escuridão sobrenatural: luz natural não funciona e luz mágica dá só claridade de tocha. Correr ou investir: Acrobacia CD 24 (p. 89).",
    agrado: "Nenhuma iluminação mágica e nenhum dano de luz (p. 89).",
    encontros: "1d6 por hora; 1 (1–2 com luz mágica) = encontro (p. 90).",
    tabela: { dado: "1d6", linhas: ["1: armeiro de Tenebra devoto (AdA 253)", "2: aparição (T20 298)", "3: trog rei dos túneis (AdA 38)", "4: 3 esqueletos (T20 297)", "5: gigante esqueleto (AdA 230)", "6: garra-zumbi gigante (AdA 234)"] },
    areas: {
      "1": ["câmaras da morte", 90, "Encontro automático; vivos fazem Fortitude CD 22 por rodada ou sofrem 1d6+4 de trevas; quem morre vira aparição."],
      "2": ["a maldição da banshee", 90, "Hayasha pede socorro (Intuição ou Percepção CD 24, sem pedir o teste); tesouro escondido."],
      "3": ["o mago fantasma", 92, "Verrkash (ND 6): Drenar Vida tira 5 PV máximos por 1 dia."],
      "4": ["o campeão das trevas", 92, "Guardião Ravarimm, anão vampiro (ND 8), RD 10/luz."]
    }
  },
  8: {
    god: "Azgher", page: 94, light: "clara", remember: true,
    ambiente: "Luz intensa: quem tem visão no escuro ou na penumbra fica ofuscado; escuridão mágica não funciona; a areia dá +2 em Furtividade (p. 94).",
    agrado: "Deixar na masmorra todo o ouro que carregam e não levar o ouro de lá (p. 94).",
    encontros: "1d6 por hora; 1 = encontro (p. 95).",
    tabela: { dado: "1d6", linhas: ["1: ber-baram (AdA 95)", "2: esfinge (p. 99)", "3: pamgra (AdA 98)", "4: celestial corrompido (p. 98)", "5: múmia (AdA 236)", "6: areia movediça (AdA 358)"] },
    areas: {
      "1": ["a praga dos besouros", 95, "Enxames de Azgher (p. 99) disfarçados de joias, despertam a 9 m."],
      "2": ["o jardim das estátuas", 95, "Estátuas de ouro (Ofício ou Percepção CD 23), touro de tocaia e o Górgon que transforma em ouro."],
      "3": ["o guardião do sol", 95, "Al-khab (ND 10) só luta com o grupo pronto e se rende com metade dos PV; oásis com água benta."]
    }
  },
  9: {
    god: "Tauron", page: 100, light: "penumbra", remember: false,
    ambiente: "Labirinto difícil de mapear: a cada 30 min, Sobrevivência CD 25 (minotauros +5). Falha: o grupo vaga sem chegar a lugar algum. Sucesso: chega a um local à escolha do mestre (p. 100). A névoa não guarda o caminho (o mestre pode mudar).",
    agrado: "Nenhuma arma ou habilidade que cause dano à distância (p. 100).",
    encontros: "1d6 a cada 30 min; 1 = encontro (p. 101).",
    tabela: { dado: "1d6", linhas: ["1: decúria e centurião (AdA 169, 173)", "2: 1d4+2 soldados da fortuna e sargento (GdN 78)", "3: 1d6 capangas, 2 capangas minotauros e chefe de quadrilha (AdA 43-45)", "4: 2d6 hobgoblins soldados (T20 300)", "5: minotauro chefe da manada e 1d4 da manada (AdA 352)", "6: centurião de elite e 1d4+3 legionários (AdA 170, 173)"] },
    areas: {
      "1": ["desafios da força", 101, "Cada câmara prende uma fera de arena (1d8): deinonicos, leões, mantícoras, elefante, serpes, cocatriz-real, golem de bronze, quimera."],
      "2": ["no coração da serpente", 101, "Porta Ladinagem CD 29 (falha 1d4 de fogo); sala em chamas 1d6 por rodada; Aspecto da Divina Serpente (ND 9)."],
      "3": ["arena do Guardião", 104, "Potentius (ND 9) diante das cem esposas; tem medo de altura."]
    }
  },
  10: {
    god: "Tanna-Toh", page: 106, light: "clara", remember: true,
    ambiente: "Biblioteca mágica: achar um livro CD 30 (3d10 min); estudar o livro certo dá +2 numa perícia; mapas desta masmorra (Investigação CD 30) e das próximas (CD 20 + ND) (p. 106).",
    agrado: "Não roubar nem danificar livros e não atacar nem perturbar os habitantes, exceto o Guardião e o que ele conjura (p. 106).",
    encontros: "Sem tabela: a cada 30 min o crânio de cristal faz uma pergunta (perícia 1d6, CD 20 + 1d10); erro ou silêncio conjura um monstro (p. 106).",
    tabela: null,
    areas: {
      "1": ["o bardo insano", 107, "Liranny (ND 7): a música exige Vontade CD 30 a cada rodada. Aqui o crânio não aparece."],
      "2": ["o poder das histórias", 108, "Thwor (ND 10) começa com 200 PV e existe por 2d10 rodadas."],
      "3": ["o Guardião do conhecimento", 110, "Sathane: 600 crânios nas prateleiras e 4 púlpitos."]
    }
  },
  11: {
    god: "Lin-Wu", page: 112, light: "clara", remember: true,
    ambiente: "Silêncio permanente: nada de magias (exceto Magia Discreta) nem habilidades de fala. Suportes de armas em quase toda sala (p. 112).",
    agrado: "Quem testar Enganação, Furtividade ou Ladinagem perde os PD; só armas da masmorra ou ataques desarmados (p. 112).",
    encontros: "1d6 a cada câmara explorada; 1 = encontro, tabela 1d8 (p. 113).",
    tabela: { dado: "1d8", linhas: ["1–2: 1d12+2 mashins monges (AdA 160)", "3: 1d4 tengus bandoleiros (AdA 164)", "4–5: 1d4 monges do Sonho (p. 116)", "6: 1d4 mashins samurais (AdA 160)", "7: samurai visitante (p. 118)", "8: dragão celestial jovem (AdA 165)"] },
    areas: {
      "1": ["câmaras de treinamento", 113, "Três testes CD 31 (Acrobacia, Atletismo, Guerra, Intuição ou Luta); cada falha 10d6."],
      "2": ["jardins de meditação", 113, "Os habitantes não atacam; começar uma luta faz surgir um elemental."],
      "3": ["questão de honra", 116, "Samurai algemado: libertá-lo (Ladinagem e Misticismo CD 31) ou matá-lo para libertar a alma."],
      "4": ["o guardião", 116, "Yon-Ude em duas fases: monge (ND 10) e dragão guerreiro (ND 11)."]
    }
  },
  12: {
    god: "Wynna", page: 119, light: "clara", remember: true,
    ambiente: "Arco-íris como luz do sol; arcanos somam o maior círculo aos PM; armas encantadas ganham um encanto extra; detectar magia é inútil; Dissipar Magia −5 (p. 119).",
    agrado: "Cada um deixa junto ao portal um item mágico de pelo menos T$ 18.000 (p. 119).",
    encontros: "1d6 a cada 30 min; 1 = encontro (p. 122).",
    tabela: { dado: "1d6", linhas: ["1: qareen tecelão de desejos (p. 126)", "2: 2 golens de espelhos (AdA 128)", "3: nagah mística e nagah encantadora (AdA 331)", "4: 3 dracomantes (AdA 149)", "5: corgann, rarvnaak, ber-baram e pamgra", "6: bruxa goblin (AdA 79)"] },
    areas: {
      "1": ["os relicários", 122, "Item mágico numa bolha: abre com os 6 tipos de dano (ou Dissipar Magia CD 30)."],
      "2": ["pequenos feiticeiros", 123, "Katharmeks em guerrilha; Diplomacia estendida CD 25 para levá-los à cidade."],
      "3": ["a oficina da animadora de móveis", 123, "Ranad e o desafio de montar um parceiro mobília."],
      "4": ["o guardião das trevas", 124, "Darkazimm (ND 12), dabbus que desvia magias."]
    }
  },
  13: {
    god: "Oceano", page: 128, light: "submersa", remember: true,
    ambiente: "Tudo submerso: prender o fôlego; visão normal de 9 m; invisibilidade só dá camuflagem leve; magia de fogo exige Misticismo CD 20 + nível (p. 128).",
    agrado: "Libertar cativos da tribo rival: 1 PD por libertar um lado, 3 PD pelos dois (p. 128).",
    encontros: "Só em áreas neutras; 1d6 por hora; 1 = encontro (p. 128).",
    tabela: { dado: "1d6", linhas: ["1: 2 elfos-do-mar caçadores e 2 selakostigres", "2: elfo-do-mar bárbaro e 2 caçadores", "3: sereia feiticeira e água-viva gigante", "4: 2 sereias feiticeiras", "5: nereida (AdA 320)", "6: mega-selako (AdA 323)"] },
    areas: {
      "1": ["aldeia dos elfos-do-mar", 129, "1d6 caçadores e/ou bárbaros por câmara; sentinelas nos pontos E."],
      "1a": ["sereias cativas", 129, "Convencê-las a fugir: Diplomacia ou Enganação estendida CD 25."],
      "2": ["aldeia das sereias", 129, "Alarme nos pontos A e Vidência."],
      "2a": ["elfos cativos", 129, "As portas só abrem e fecham com magia."],
      "3": ["covil do Guardião", 131, "Coriphena (ND 13), com o redemoinho no centro."],
      "3a": ["entrada do covil", 131, "Escondida por Miragem."],
      "E": ["sentinela élfica", 129, "Ponto de sentinela dos elfos-do-mar."],
      "A": ["alarme das sereias", 129, "Magia de Alarme das sereias."]
    }
  },
  14: {
    god: "Thyatis", page: 134, light: "penumbra", remember: true,
    ambiente: "Paredes de lava (nadar: Atletismo CD 35); teto de fumaça a 4 m (8d6 de fogo por rodada); ataques que superam a Defesa por 5 empurram contra a lava; fogo sobe um passo e frio desce. Quem morre volta em 1d6+3 rodadas, amaldiçoado (p. 134).",
    agrado: "Não libertar as gizzehi e não ferir o ovo de fênix (p. 134).",
    encontros: "1d6 por hora; 1 = encontro (p. 135).",
    tabela: { dado: "1d6", linhas: ["1: pirohidra (p. 139)", "2: 4 ber-barams (AdA 95)", "3: dragão feral (AdA 72)", "4: serpentaar (AdA 96)", "5: 2 dragões adultos (T20 311)", "6: golem de ferro superior (AdA 130)"] },
    areas: {
      "1": ["covis de dragões", 135, "Um dragão adulto por covil, hostil; ataca de dentro da fumaça."],
      "2": ["câmaras da profecia", 135, "Vontade CD 30 ao entrar (falha: desprevenido na masmorra); visões; 4d4 dados de auxílio."],
      "3": ["o lago dos gênios", 136, "Duas gizzehi de bronze oferecem desejos; libertá-las viola o Agrado."],
      "4": ["pássaro de fogo", 136, "Reyjane (ND 14) renasce 3 vezes; perdoá-la deixa o ovo de fênix."]
    }
  },
  15: {
    god: "Sszzaas", page: 140, light: "penumbra", remember: true,
    ambiente: "Tapete de cobras: quem termina o turno no chão perde 1d12 PV por veneno (o dobro caído); terreno difícil (p. 140).",
    agrado: "Ninguém pode ajudar um companheiro (ação ajudar ou qualquer habilidade benéfica em outro) (p. 140).",
    encontros: "1d6 por hora; 1 = encontro (p. 140).",
    tabela: { dado: "1d6", linhas: ["1: 1d4+1 serpes anciãs (AdA 310)", "2: nagah retalhador e 4 defensores (AdA 332)", "3: 2 hidras (T20 306)", "4: górgona matriarca (AdA 330)", "5: 2 elementais do veneno grandes (AdA 328)", "6: Lagash (T20 306)"] },
    areas: {
      "1": ["câmaras do veneno", 141, "Névoa: 1d12 PV por turno (a cada 2 turnos ignora imunidade); travessia: Sobrevivência estendida CD 30."],
      "2": ["altar profano", 141, "A 'elfa' acorrentada é Kuroryuh (ND 13), dragão de sombras, com nagahs adoradoras."],
      "3": ["o guardião traidor", 143, "Copia o personagem mais perigoso; todo dano nele vai para esse personagem."]
    }
  },
  16: {
    god: "Keenn", page: 145, light: "clara", remember: true,
    ambiente: "Arsenal: qualquer arma ou armadura mundana com Investigação (CD 15/20/25 + modificadores); os itens vêm encantados até sair da masmorra (p. 145).",
    agrado: "Nenhuma cura mágica; vencer a Área 3 perdoa as violações (p. 145).",
    encontros: "1d6 por hora; 1 = encontro (p. 146).",
    tabela: { dado: "1d6", linhas: ["1–4: 1d4+2 candidatos do Torneio (p. 150)", "5: servos dos santuários", "6: Harkash (p. 150)"] },
    areas: {
      "1": ["santuários de descanso", 146, "Banquete como Círculo da Restauração; servos são parceiros médicos mestres."],
      "2": ["covil de Harkash", 147, "Harkash (ND 16) volta em minutos se o covil for achado; duas demonesas aliáveis."],
      "3": ["guerra sem fim", 147, "Três ondas a cada 4 rodadas num raio de 9 m da pedra; vencer perdoa o Agrado."],
      "4": ["batalha decisiva", 148, "Turukuto Desu (ND 18) e as gemas do machado."]
    }
  },
  17: {
    god: "Megalokk", page: 152, light: "escura", remember: true,
    ambiente: "Escuridão total, lodo até os joelhos, paredes que se regeneram. Náusea (Fortitude CD 30, depois 25, depois 20) e fúria no início de cada cena (Vontade CD 37) (p. 152).",
    agrado: "Nenhuma perícia baseada em Inteligência; nada de Furtividade, preparar ações ou sustentar efeitos (p. 152).",
    encontros: "1d6 por hora; 1 = encontro; os 3 primeiros viram carcaças devoradas por Vorakking (p. 153).",
    tabela: { dado: "1d6", linhas: ["1: grande tachygloss (AdA 308)", "2: razza'kham (AdA 309)", "3: 3 oxxdons imensos (AdA 309)", "4: centauro xamã de Megalokk e 3 dragões ferais", "5: mantícora primal (AdA 298)", "6: 2 reis-tiranos (AdA 251)"] },
    areas: {
      "1": ["covil do rei", 153, "O rei-tirano primordial volta em 1d6+4 rodadas; a druida Drinna está ferida."],
      "2": ["totem da selvageria", 153, "Sangue do xamã: Sobrevivência ou Vontade estendida CD 30 (5 sucessos)."],
      "3": ["duelo territorial", 154, "Dragão feral venerável contra hokgolur."],
      "4": ["o devorador", 156, "Vorakking (ND 16), com as habilidades das carcaças."]
    }
  },
  18: {
    god: "Nimb", page: 158, light: "penumbra", remember: true,
    ambiente: "Objetos não seguem as regras (Percepção ou Ofício CD 35). Toda criatura de encontro ganha Ataque Ilógico e duas Qualidades Caóticas (p. 158-159).",
    agrado: "Não há regras: no fim, cada um escolhe par ou ímpar e rola um dado (p. 158).",
    encontros: "1d6 a cada 30 min; 1–2 = encontro; 1d20 escolhe a tabela de qualquer masmorra (18 = a de Nimb) (p. 158).",
    tabela: { dado: "1d5", linhas: ["1: um hynne dormindo", "2: Goblin do Cantinho (GdN 65)", "3: 1d4 dragões bicéfalos (AdA 72)", "3,5: um queijo", "4: Nialandarena de Wynna (GdN 39)", "5: vagalhão kobold (AdA 189)", "6: Rhandomm (AdA 113)", "7: Tarso, Dragão-rei dos Mortos (AdA 241)"] },
    areas: {
      "1": ["câmaras da loucura", 159, "Efeito 1d6 quando todos entram, uma vez por sala."],
      "2": ["jogo perigoso", 162, "Jogatina contra o crupiê fantasma (+25), partidas de 10 min; vitória 1d6, derrota 1d8."],
      "3": ["a guardiã", 162, "Hit (ND 2) nunca falha um d20; no viveiro de malafex, sucesso e falha se invertem."]
    }
  },
  19: {
    god: "Khalmyr", page: 164, light: "clara", remember: true,
    ambiente: "Paredes de cristal: +10 em Investigação e Percepção, −20 em Furtividade; Conhecimento ou Guerra CD 25 revela o mapa inteiro (use Revelar tudo). Objetos largados atravessam o chão (p. 164).",
    agrado: "Código de honra (sem flanquear, atacar caídos ou desprevenidos, mentir, roubar, veneno, Ataque Furtivo, encantamento, ilusão ou necromancia) e passar nos 5 testes (p. 164).",
    encontros: "Não há encontros aleatórios (p. 165).",
    tabela: null,
    areas: {
      "1": ["teste da bondade", 165, "10 clérigos sangrando a −10 PV."],
      "2": ["teste da percepção do mal", 165, "Anões malignos e paladinos misturados; ferir um paladino fere o grupo."],
      "3": ["teste da punição", 168, "10 gigantes esqueletos com RD 50/luz."],
      "4": ["teste de vontade", 168, "Prisioneiros fazem ofertas; libertar alguém viola o Agrado."],
      "5": ["teste da coragem", 168, "4 dragões ferais com Aura Aterradora CD 45."],
      "6": ["guardiões do mal", 168, "Thomar e Karlya; cada teste concluído tira 10 de RD e 5 de resistência deles."]
    }
  },
  20: {
    god: "Valkaria", page: 171, light: "clara", remember: true,
    ambiente: "O beijo do avatar remove ferimentos e maldições e traz de volta os mortos (p. 171).",
    agrado: "Não há (p. 172).",
    encontros: "1d6 a cada 30 min; 1–2 = réplica de Guardião (1d20) ou versão mais forte de um inimigo vencido (p. 172).",
    tabela: { dado: "1d20", linhas: ["1: Fallandi", "2: Rornagar", "3: Sharin", "4: Tandan", "5: Tigre Primordial", "6: Prislanya", "7: Ravarimm", "8: Al-khab", "9: Potentius", "10: Sathane", "11: Yon-Ude", "12: Darkazimm", "13: Coriphena", "14: Reyjane", "15: Guardião traidor", "16: Turukuto", "17: Vorakking", "18: Hit", "19: Thomar", "20: Amálgama (duas formas)"] },
    areas: {
      "1": ["cofres do tesouro", 172, "7 barreiras em ordem (4d12 cada; Reflexos CD 45); cada busca leva meia hora."],
      "2": ["rio de lágrimas", 172, "O contato tira Inteligência, Sabedoria e Carisma por rodada; quem voa ou se teletransporta é arrastado."],
      "3": ["desafio final", 174, "Avatar de Valkaria (ND S)."]
    }
  }
};

/** The guardian's area (the exit portal works only after the guardian falls, p. 50). */
export const GUARDIAN_AREA = { 1: "5", 2: "4", 3: "4", 4: "4", 5: "4", 6: "5", 7: "4", 8: "3", 9: "3", 10: "3", 11: "4", 12: "4", 13: "3", 14: "4", 15: "3", 16: "4", 17: "4", 18: "3", 19: "6", 20: "3" };

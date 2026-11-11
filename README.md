# Mapas-masmorras

Módulo para Foundry VTT **v13** que transforma os 20 mapas de masmorra de *Jornada Heroica: A Libertação de Valkaria*
(Tormenta20) numa grade jogável:

- névoa de guerra e iluminação simples em volta do grupo;
- uma versão para os jogadores, sem as marcações do mestre, e a visão completa do mestre;
- o grupo anda pelo mapa como numa viagem, e o mestre trava ou libera o movimento;
- armadilhas, encontros, eventos, notas e as áreas de cada masmorra, com as regras do livro;
- um encontro vira uma cena de batalha com paredes, portas e tokens.

As páginas citadas são as impressas do livro (Jambô, 2025). O módulo traz só resumos curtos das regras. Para jogar, é
preciso ter o livro.

## Instalação

1. Instale o módulo (pasta `mapas-masmorras` em `Data/modules`) e ative-o no mundo.
2. **Imagens dos mapas:** copie os arquivos `masmorra-01.webp` … `masmorra-20.webp` para a pasta **`Data/mapas-masmorras`**
   do seu Foundry.
   - As imagens são a cartografia do livro, de José Cerqueira e da Jambô. Por isso **não vêm dentro do módulo**: assim ele
     pode ir para um repositório público sem levar a arte junto.
   - Elas ficam numa pasta separada, `mapas-masmorras-imagens`, ao lado da pasta do módulo.
   - Outro lugar serve: mude "Pasta das imagens dos mapas" nas configurações do módulo, ou ponha um caminho por masmorra no
     painel do mestre.

## Como abrir

- **Todos:** botão **Mapas-masmorras** (ícone de masmorra) nos controles de token.
- **Atalho:** em *Configurar controles* há "Abrir o mapa da masmorra", sem tecla definida.
- **Mestre:**
  - escolhe qualquer masmorra no seletor;
  - **Mostrar a todos** torna aquela a masmorra atual e abre o mapa na tela de todos os jogadores;
  - os jogadores sempre veem a masmorra atual.

## O que cada um vê

| | Jogadores | Mestre |
|---|---|---|
| Mapa | Sem os números das áreas, o "Porta Secreta" de Ragnar e os E/A de Oceano (apagados com chão clonado) | Mapa do livro |
| Névoa | Preto onde ninguém viu; escurecido onde já viram; claro em volta do grupo | Só escurece, para o mestre ver tudo |
| Marcadores | Só os revelados, e só onde já exploraram | Todos (os escondidos ficam tracejados) |
| Painel | — | Regras, luz, ações, encontros e marcadores |

**Ver como jogador** (o ícone de olho) mostra ao mestre exatamente o que os jogadores veem.

## Movimento (viagem)

- **Jogadores:** com o movimento **livre**, clicam numa casa que já conhecem e o grupo vai pelo caminho mais curto.
  - O caminho segue as 8 direções, sem cortar quinas, e atravessa portas.
  - Ao passar o mouse aparecem o caminho e a distância (cada casa = 1,5 m).
  - O cliente do mestre confere tudo antes de mover, então **é preciso um mestre conectado**.
- **Trava:** o mapa começa **travado**. O botão Travado/Livre libera e trava, para segurar jogadores afobados.
- **Passos por movimento** (painel): limita quanto o grupo anda por clique. 0 = sem limite.
- **Mestre:** a ferramenta **Mover** move o grupo para qualquer lugar, mesmo travado.

## Névoa e luz

- **Luz:** cada masmorra tem uma luz padrão do livro:
  - Ragnar, Tenebra e Megalokk: escura, com tocha (4 quadrados);
  - Oceano: submersa (6 quadrados = 9 m);
  - Tauron, Hyninn, Thyatis, Sszzaas e Nimb: penumbra (8);
  - as outras: clara (12).
- **Visão:** o grupo vê em linha reta até esse alcance. Paredes, portas e paredes finas bloqueiam a visão.
- **Memória:** a névoa guarda o que já foi visto. Em **Tauron** ela não guarda, porque o labirinto é difícil de mapear
  (p. 100); o mestre pode ligar.
- **Ajustes no painel:** luz, alcance, memória, **Revelar tudo** (por exemplo, as paredes de cristal de Khalmyr,
  p. 164) e **Esconder tudo**.
- **Pincel de névoa:** a ferramenta **Névoa** revela ou esconde casas arrastando. Se você começa numa casa explorada,
  esconde; numa não explorada, revela.

## Marcadores

- **Já vêm no mapa:**
  - a **Chegada** (o portal em espiral);
  - as **áreas numeradas** do livro, com nome, página e um resumo;
  - o **Portal de saída**, ao lado da área do Guardião (p. 50);
  - as marcas especiais: porta secreta de Ragnar, sentinelas e alarmes de Oceano.
- **Criar ou editar:** a ferramenta **Marcadores** (clique numa casa) cria e edita armadilhas, encontros, eventos,
  tesouros, portas, notas e especiais.
- **Textos:** cada marcador tem notas do mestre e um texto para os jogadores, que aparece quando o marcador é revelado.
- **Gatilho:** define o que acontece quando o grupo pisa na casa:
  - **parar** o grupo e avisar o mestre (sussurro no chat);
  - ou **parar e travar** o movimento.

  O marcador pode se revelar ao disparar.
- **Atores:** arraste atores da barra lateral para a janela do marcador para dizer quem está ali.
- **Encontro aleatório** (painel): rola a tabela da masmorra, e **Marcar no grupo** cria o marcador.
  - Nimb usa o 1d20 para escolher a tabela de outra masmorra (p. 158).
  - Khalmyr não tem encontros (p. 165).

## Campo de batalha

Há três jeitos de abrir o campo de batalha:

- no marcador, **Campo de batalha…**;
- com a ferramenta **Campo de batalha**, arrastando um retângulo no mapa;
- pela área guardada no marcador.

Ao confirmar, o módulo:

1. Recorta a área da imagem dos jogadores (sem marcações do mestre), amplia para 100 px por quadrado e envia para
   `Data/worlds/<mundo>/mapas-masmorras/`.
2. Cria uma **cena v13** com:
   - grade quadrada de 1,5 m;
   - **paredes e portas** geradas a partir do mapa;
   - visão dos tokens e névoa de exploração;
   - escuridão conforme a luz.
3. Coloca os **tokens do grupo** perto de onde o grupo está (com tocha, se quiser) e os **inimigos** do marcador perto
   dele (escondidos, se quiser).
4. Opcionalmente cria o **combate**, ativa a cena para todos e fecha o mapa da masmorra na tela dos jogadores.

Depois da luta, **Mostrar a todos** reabre o mapa da masmorra.

## Edição do mapa

- **Como o mapa foi lido:** a grade, o chão, as paredes finas (labirinto de Tauron) e as portas saíram da imagem.
  Em todos os 20 mapas, todas as áreas são alcançáveis a partir da chegada.
- **Corrigir o chão:** a ferramenta **Chão** mostra o que é chão (verde), as paredes finas (vermelho) e as portas
  (amarelo), e marca ou desmarca casas arrastando. **Desfazer chão** volta ao original.
- **Paredes finas e portas** não são editáveis no módulo. Se uma estiver errada, corrija na cena de batalha.

## Observações

- **Onde o estado fica:** o estado de cada masmorra fica numa configuração do mundo (`estado-1` … `estado-20`), que
  chega a todos os clientes. O mapa nunca mostra marcadores escondidos aos jogadores, mas um jogador que abra o console
  do navegador conseguiria lê-los.
- **Versão:** feito para a v13. A v14 mudou o fundo das cenas para os Levels, então o campo de batalha não foi testado lá.
- **Testes:** foi testado num ambiente simulado do Foundry, não num Foundry de verdade. Erros aparecem como
  notificação vermelha.

## API

```js
const api = game.modules.get("mapas-masmorras").api;
api.open(5);        // abre o mapa (mestre: masmorra 5; jogadores: a atual)
api.show(5);        // mestre: torna a 5 a atual e abre para todos
api.state(5);       // cópia do estado da masmorra 5
api.move(5, 10, 20); // move o grupo para a coluna 10, linha 20
```

## Licença

MIT (código). Tormenta20, *A Libertação de Valkaria* e os mapas são da Jambô Editora.

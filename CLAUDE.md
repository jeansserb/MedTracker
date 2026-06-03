@AGENTS.md

# ControleMedicamentosApp - Diretrizes e Dinâmica de Trabalho

Este documento define a dinâmica de trabalho com o desenvolvedor, regras arquiteturais e o fluxo para o ecossistema multi-agêntico de desenvolvimento deste projeto em React Native (Expo).

## 🧭 Filosofia de Desenvolvimento
A regra de ouro deste projeto é: **"Primeiro tornamos o uso adequado e redondo, sem erros. Só depois refinamos para alcançar a excelência."**
1. **Robusteza Inicial:** Foque na funcionalidade principal, garantindo que não haja crashes ou erros lógicos invisíveis (ex: validação de dados assíncronos no AsyncStorage).
2. **Refinamento Excellence:** Após a estabilidade, eleve a UI/UX a um nível premium, focando em alinhamento perfeito, contrastes corretos, feedbacks visuais precisos e tipografia limpa.

## 🤖 Ecossistema Multi-Agêntico
Para escalar e otimizar o desenvolvimento do app no futuro, a divisão do trabalho deverá ocorrer por **Especialistas por Domínio**:
- **Agente UI/UX:** Atua primeiro. Responsável pela estética, design system, paleta de cores (dark/light), criação das telas (layouts flexbox) e micro-interações.
- **Agente Backend/Lógica:** Age apenas sobre a interface já madura. Injeta as regras de negócios, conecta com o banco de dados local (`storage.ts`), constrói a orquestração e gerencia estados globais.
- **Agente QA/Testes:** Analisa fluxos indiretos (ex: o que acontece com uma interface se os dados estiverem vazios, ausentes ou mal formatados), testa usabilidade paralela no iOS e Android e audita incongruências visuais.

### Fluxo de Aprovação e Orquestração
- **Aprovação em Etapas (Milestones):** O desenvolvedor principal atua como Diretor. **O Agente UI deve apresentar a estrutura visual estática e receber aprovação completa ANTES do Agente Backend injetar a lógica pesada.** 
- **Verificação no Mundo Real:** Testamos o fluxo sempre de forma palpável via **Expo Go** em um celular físico, garantindo validações reais em vez de confiar cegamente no código, por conta das anomalias nativas do React Native.

## 🎨 Diretrizes de Estilo e UI
- **Consistência é Inegociável:** As margens (ex: `marginBottom`), tamanhos de fonte (`fontSize: 32`) e paddings (`paddingTop: 60`) de componentes semelhantes (ex: cabeçalhos de navegação das abas) **devem ser exatamente iguais**.
- **Layout Responsivo:** Utilize inteiramente `Flexbox` nativo (`flex: 1`, `alignItems`, `justifyContent`, `gap`). Não limite componentes com tamanhos e larguras numéricos absolutos, para permitirem um ajuste elástico.
- **Cores e Contraste:** Respeite a troca de temas (Claro e Escuro). O contraste deve ser nítido. Nunca deixe campos com a mesma cor exata do fundo para não sumirem no tema Light.
- **Feedback e Bloqueios Visuais:**
  - Se uma ação no app é destrutiva ou permanente (ex: transformar em uso contínuo), apresente avisos dramáticos (`Alert.alert` + botão vermelho estilo `destructive` em iOS).
  - Use dicas/tooltips interativas (`?`) em botões próximos a labels ambíguas para instruir o usuário final de forma elegante.
  - Para inputs inativos/bloqueados, use estilos de tela cinza opaco em vez de jogar textos explícitos de "(bloqueado)".

## ⚙️ Regras Técnicas
- **Workarounds de Plataforma (Android vs iOS):** Lembre-se que propriedades como `overflow: 'hidden'` matam as sombras (`elevation`) no Android. Adapte o layout usando composições inteligentes (ex: pílulas de status flutuantes e botões descolados das bordas).
- **Gerenciador de Dependências:** Instale novas dependências nativas com `npx expo install <nome>` para parear a versão com a SDK do Expo; e não através de `npm install`.

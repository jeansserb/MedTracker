# MedTracker 💊

Um aplicativo moderno, intuitivo e robusto para gerenciar a rotina de medicamentos. Construído com **React Native (Expo)**, o MedTracker foi desenvolvido com foco absoluto em usabilidade, performance offline e acessibilidade (suporte nativo a Tema Claro/Escuro).

<div align="center">
  <!-- Adicione suas screenshots reais aqui futuramente -->
  <img src="https://via.placeholder.com/250x500.png?text=Agenda+Diária" width="200" />
  <img src="https://via.placeholder.com/250x500.png?text=Desempenho" width="200" />
  <img src="https://via.placeholder.com/250x500.png?text=Dark+Mode" width="200" />
</div>

## ✨ Funcionalidades Principais

- 📅 **Agenda Inteligente**: Algoritmo avançado de Janela Deslizante (Sliding Window) que calcula retroativamente e futuramente as doses exatas baseadas na frequência e duração do tratamento.
- 🎨 **UI/UX Premium**: Design polido, animações responsivas e cores semânticas que se adaptam perfeitamente ao tema do sistema do usuário (Dark Mode).
- 📊 **Dashboard de Desempenho (Adesão)**: Calendário interativo que plota um "Mapa de Calor" de adesão ao tratamento (100% de sucesso = Verde, Atrasos/Pulos = Vermelho/Cinza).
- 💾 **Offline-First**: Armazenamento de dados local persistente e ultrarrápido garantido pelo `AsyncStorage`. Sem necessidade de internet para registrar ou checar horários!
- 🔄 **Controle Completo**: Interrompa tratamentos, retome, dispense doses específicas, corrija erros desfazendo marcações e gerencie o histórico.

## 🛠️ Stack Tecnológica

- **Framework:** React Native / Expo
- **Navegação:** Expo Router (File-based Routing)
- **Linguagem:** TypeScript
- **Estilização:** StyleSheet nativo + Design System Local (`constants/theme`)
- **Armazenamento:** `@react-native-async-storage/async-storage`
- **UI Components:** `react-native-calendars`, `@expo/vector-icons`, `@react-native-picker/picker`, `@react-native-community/datetimepicker`

## 🧠 Arquitetura do Motor Lógico (`storage.ts`)

O grande desafio do aplicativo foi criar um banco de dados local "sem servidor" que não lotasse a memória do celular com milhares de notificações futuras vazias. A solução foi projetar o `storage.ts` como a única fonte da verdade (Single Source of Truth).

O algoritmo calcula as doses em tempo real usando a lógica de **Janela Deslizante**. Ao invés de salvar "50 doses" no momento do cadastro, o app guarda apenas as "regras do jogo" (Data de Início, Frequência, Duração) e um "Livro Razão" (Ledger) contendo as ações explícitas do usuário (Tomei, Pulei). 
Quando você abre o aplicativo, ele junta essas duas pontas e projeta a grade horária milimetricamente correta.

## 🚀 Como Executar o Projeto

1. Clone este repositório:
```bash
git clone https://github.com/jeansserb/MedTracker.git
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npx expo start
```

4. Pressione `a` para abrir no Emulador Android, `i` para abrir no Simulador iOS, ou escaneie o código QR com o app **Expo Go** no seu celular físico.

## 📱 Publicação nas Lojas

Este aplicativo está pronto para ser compilado via **EAS (Expo Application Services)**.

- **Para Android:** Gere o arquivo instalável (`.apk`) gratuitamente rodando `eas build -p android --profile preview`.
- **Para iOS:** O deploy para iOS exige uma conta ativa de Desenvolvedor da Apple e a configuração dos certificados através do `eas build -p ios`.

## 👨‍💻 Desenvolvedor

Criado por [Jean Serb](https://github.com/jeansserb) com foco em solucionar um problema real de adesão medicamentosa.

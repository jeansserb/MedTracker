# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Diretrizes para Agentes (Automelhoria e Prevenção de Erros)

- **Checagem Criteriosa de Imports**: Ao finalizar a edição de um arquivo, valide rigorosamente se todos os hooks (como `useEffect`, `useState`) e funções externas utilizadas foram importados no topo do arquivo.
- **Validação de Escopo e Refatoração**: Ao extrair códigos para novas funções ou mover blocos de código, garanta que TODAS as dependências e variáveis locais requeridas (como datas, objetos de configuração) existam no novo escopo ou sejam passadas por parâmetros.
- **Uso de TypeScript (TypeScript Checking)**: Em refatorações extensas, sinta-se à vontade para utilizar o terminal e rodar `npx tsc --noEmit` de maneira invisível no background para garantir que as assinaturas das funções e os imports estejam corretos antes de reportar a conclusão para o usuário.
- **Self-Healing Activo**: Se houver qualquer indício de erro de compilação ou de import, utilize suas ferramentas ativamente para consertar antes de prosseguir.

# 📝 Lista de Tarefas Simples

Uma aplicação interativa de lista de tarefas (*To-Do List*) desenvolvida especialmente para quem está dando os primeiros passos no aprendizado de programação para a web.

---

## 📌 Visão Geral

Este projeto demonstra como construir uma interface web reativa e intuitiva utilizando **HTML**, **CSS** e **JavaScript** (com React e TypeScript). O código foi escrito com nomes de variáveis e funções em português, bem explicados e fáceis de entender.

---

## ✨ Funcionalidades

- **Adicionar Tarefa (CRIAR):** Digite o nome da tarefa e clique em **Adicionar** (ou pressione a tecla `Enter`).
- **Visualizar Lista (VISUALIZAR):** Exibe as tarefas com indicação explícita de status (Pendente ou Concluída).
- **Editar Tarefa (ATUALIZAR):** Clique no botão **Editar** para abrir o campo de edição com os botões **Salvar** e **Cancelar**. O salvamento valida campos vazios e preserva o status e o texto riscado das tarefas concluídas.
- **Marcar como Concluída / Pendente (ATUALIZAR):** Alterne o status de qualquer tarefa clicando no ícone de círculo ou no botão de status.
- **Texto Riscado para Tarefas Concluídas:** Apenas as tarefas marcadas como concluídas recebem o efeito visual de texto tachado (`line-through`) e cor suavizada.
- **Remover Tarefa (EXCLUIR):** Exclua tarefas individualmente clicando no botão **Remover**.
- **Contadores em Tempo Real:** Acompanhe a quantidade total de tarefas cadastradas, quantas estão pendentes e quantas já foram concluídas.

---

## 🛠️ Tecnologias Utilizadas

- **React 19:** Biblioteca para construção da interface de usuário baseada em componentes e gerenciamento de estado.
- **TypeScript:** Superset do JavaScript que adiciona tipagem estática, ajudando a evitar erros comuns de digitação e tipos.
- **Tailwind CSS 4:** Framework CSS utilitário para estilização rápida, responsiva e limpa.
- **Lucide React:** Conjunto de ícones leves e elegantes.
- **Vite:** Ferramenta moderna e ultra rápida para desenvolvimento e compilação no navegador.

---

## 📁 Estrutura do Projeto

```text
├── index.html          # Ponto de entrada HTML da página no navegador
├── package.json        # Dependências e scripts do projeto
├── README.md           # Documentação do projeto (este arquivo)
├── src/
│   ├── App.tsx         # Componente principal: lógica, estados e interface da lista
│   ├── index.css       # Estilos globais e importação do Tailwind CSS
│   └── main.tsx        # Arquivo de inicialização que conecta o React ao index.html
├── tsconfig.json       # Configurações do compilador TypeScript
└── vite.config.ts      # Configurações do empacotador Vite
```

### Papel dos Principais Arquivos:

1. **`index.html`**: Fornece o documento base, as meta tags informativas e a `<div id="root"></div>` onde a aplicação React é montada.
2. **`src/App.tsx`**: Contém toda a lógica e visual da aplicação:
   - `useState` para guardar os dados digitados e a lista de tarefas.
   - `adicionarTarefa()`: valida o texto e insere a nova tarefa na lista.
   - `alternarStatusTarefa()`: alterna o status entre pendente e concluída.
   - `removerTarefa()`: remove o item selecionado filtrando pelo `id`.
   - Renderização da lista com estilização condicional (`line-through` apenas para concluídas).
3. **`src/main.tsx`**: Liga o componente `App` ao HTML através de `createRoot`.
4. **`src/index.css`**: Configura as fontes e diretivas do Tailwind CSS.

---

## 🚀 Como Executar o Projeto Localmente

Caso queira executar este projeto no seu próprio computador:

### Pré-requisitos
- Ter o [Node.js](https://nodejs.org/) instalado (versão 18 ou superior).

### Passo a Passo

1. **Clone ou baixe o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd <NOME_DA_PASTA>
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Abra no seu navegador:**
   Acesse o endereço exibido no terminal, geralmente:  
   `http://localhost:3000` (ou `http://localhost:5173`)

---

## 🧠 Conceitos Importantes para Iniciantes

Se você está aprendendo programação, repare em como esses conceitos foram aplicados no arquivo `src/App.tsx`:

### 1. Estado (`useState`)
Em aplicações interativas, a tela precisa reagir quando dados mudam. O `useState` armazena informações que, ao serem atualizadas, fazem o React redesenhar os componentes automaticamente.
```tsx
const [listaDeTarefas, setListaDeTarefas] = useState<Tarefa[]>([]);
```

### 2. Validação com `.trim()`
O método `.trim()` remove espaços em branco antes e depois do texto digitado. Com isso, evitamos que o usuário adicione tarefas como `"   "`:
```tsx
const textoLimpo = textoDaNovaTarefa.trim();
if (textoLimpo === '') {
  // Mostra aviso e não adiciona
}
```

### 3. Imergindo na Manipulação de Listas:
- **`map()`**: Usado tanto para exibir cada tarefa na tela quanto para encontrar e alterar uma tarefa específica ao clicar em concluir.
- **`filter()`**: Cria uma nova lista contendo apenas os itens que atendem a uma condição — perfeito para remover uma tarefa pelo seu `id`!
- **Operador Ternário (`condição ? se_verdadeiro : se_falso`)**: Usado para aplicar o estilo riscado (`line-through`) somente quando a tarefa está concluída:
  ```tsx
  tarefa.concluida ? 'line-through text-slate-400' : 'no-underline text-slate-800'
  ```

---

## 💡 Próximos Passos Sugeridos para Praticar

- [x] **Edição de tarefas:** Permitir alterar o texto de uma tarefa já cadastrada com validação e cancelamento.
- [ ] **Persistência local:** Salvar a lista no `localStorage` do navegador para não perder as tarefas ao recarregar a página.
- [ ] **Filtros de visualização:** Botões para ver "Todas", "Apenas Pendentes" ou "Apenas Concluídas".
- [ ] **Limpar tudo:** Um botão para apagar todas as tarefas concluídas de uma só vez.

---

Feito para fins de estudo e prática de desenvolvimento web. Bons estudos! 🚀

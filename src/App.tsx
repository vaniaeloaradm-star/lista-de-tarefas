import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ListTodo,
  AlertCircle,
  Pencil,
  Check,
  X,
} from 'lucide-react';

// Estrutura que define o formato de cada tarefa
interface Tarefa {
  id: number;
  texto: string;
  concluida: boolean;
}

export default function App() {
  // Estado para guardar o texto que o usuário está digitando no campo de nova tarefa
  const [textoDaNovaTarefa, setTextoDaNovaTarefa] = useState<string>('');

  // Estado para armazenar a lista com todas as tarefas cadastradas
  const [listaDeTarefas, setListaDeTarefas] = useState<Tarefa[]>([
    {
      id: 1,
      texto: 'Aprender a estrutura básica do HTML',
      concluida: false,
    },
    {
      id: 2,
      texto: 'Compreender como funcionam as variáveis e funções no JavaScript',
      concluida: true,
    },
  ]);

  // Estado para exibir aviso caso tente adicionar tarefa em branco
  const [mensagemDeErro, setMensagemDeErro] = useState<string>('');

  // Estados para controlar a edição de uma tarefa (CRUD: Atualizar)
  // Guarda o id da tarefa que está sendo editada no momento (ou null se nenhuma)
  const [idEmEdicao, setIdEmEdicao] = useState<number | null>(null);
  // Guarda o texto digitado durante a edição
  const [textoEmEdicao, setTextoEmEdicao] = useState<string>('');
  // Guarda o aviso de erro caso tente salvar a edição com texto em branco
  const [mensagemDeErroEdicao, setMensagemDeErroEdicao] = useState<string>('');

  // ==========================================
  // 1. CRIAR (Create): Adicionar nova tarefa
  // ==========================================
  function adicionarTarefa(evento?: React.FormEvent) {
    if (evento) {
      evento.preventDefault(); // Evita o recarregamento padrão da página
    }

    // A função .trim() remove os espaços em branco no início e no fim
    const textoLimpo = textoDaNovaTarefa.trim();

    // Validação: se estiver vazio ou com apenas espaços, não adiciona
    if (textoLimpo === '') {
      setMensagemDeErro('Por favor, digite o nome de uma tarefa antes de adicionar!');
      return;
    }

    // Cria o novo objeto da tarefa
    const novaTarefa: Tarefa = {
      id: Date.now(), // Gera um identificador único usando o timestamp atual
      texto: textoLimpo,
      concluida: false, // Toda nova tarefa começa como pendente
    };

    // Atualiza a lista adicionando a nova tarefa no final
    setListaDeTarefas([...listaDeTarefas, novaTarefa]);

    // Limpa o campo de texto e remove qualquer aviso de erro
    setTextoDaNovaTarefa('');
    setMensagemDeErro('');
  }

  // ==========================================
  // 2. ATUALIZAR (Update): Alternar status da tarefa
  // ==========================================
  function alternarStatusTarefa(idParaAlterar: number) {
    const listaAtualizada = listaDeTarefas.map((tarefa) => {
      if (tarefa.id === idParaAlterar) {
        // Inverte o valor de concluida (de false para true, ou de true para false)
        return {
          ...tarefa,
          concluida: !tarefa.concluida,
        };
      }
      return tarefa;
    });

    setListaDeTarefas(listaAtualizada);
  }

  // ==========================================
  // 3. ATUALIZAR (Update): Edição do texto da tarefa
  // ==========================================
  // Abre o modo de edição para uma tarefa específica
  function iniciarEdicao(tarefa: Tarefa) {
    setIdEmEdicao(tarefa.id);
    setTextoEmEdicao(tarefa.texto);
    setMensagemDeErroEdicao('');
  }

  // Cancela a edição, descartando alterações e mantendo o texto original
  function cancelarEdicao() {
    setIdEmEdicao(null);
    setTextoEmEdicao('');
    setMensagemDeErroEdicao('');
  }

  // Salva o novo texto da tarefa após validação
  function salvarEdicao(idParaAtualizar: number) {
    const textoLimpo = textoEmEdicao.trim();

    // Validação: se estiver vazio ou com apenas espaços, mostra aviso e mantém texto original
    if (textoLimpo === '') {
      setMensagemDeErroEdicao('O texto da tarefa não pode ficar vazio!');
      return;
    }

    // Atualiza o texto na lista, preservando exatamente o status de concluída
    const listaAtualizada = listaDeTarefas.map((tarefa) => {
      if (tarefa.id === idParaAtualizar) {
        return {
          ...tarefa,
          texto: textoLimpo, // Atualiza apenas o texto
        };
      }
      return tarefa;
    });

    setListaDeTarefas(listaAtualizada);

    // Fecha o formulário de edição
    setIdEmEdicao(null);
    setTextoEmEdicao('');
    setMensagemDeErroEdicao('');
  }

  // ==========================================
  // 4. EXCLUIR (Delete): Remover uma tarefa da lista
  // ==========================================
  function removerTarefa(idParaRemover: number) {
    // Se a tarefa estiver sendo editada no momento, fecha a edição
    if (idEmEdicao === idParaRemover) {
      cancelarEdicao();
    }

    // O método .filter cria uma nova lista contendo apenas as tarefas que têm id diferente
    const listaAtualizada = listaDeTarefas.filter(
      (tarefa) => tarefa.id !== idParaRemover
    );

    setListaDeTarefas(listaAtualizada);
  }

  // Cálculos para o resumo de tarefas
  const totalDeTarefas = listaDeTarefas.length;
  const tarefasConcluidas = listaDeTarefas.filter((t) => t.concluida).length;
  const tarefasPendentes = totalDeTarefas - tarefasConcluidas;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center py-10 px-4">
      {/* Cabeçalho da aplicação */}
      <header className="w-full max-w-xl text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-700 rounded-2xl mb-3 shadow-sm">
          <ListTodo className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Minha Lista de Tarefas
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Adicione, visualize, edite, conclua e remova tarefas com facilidade.
        </p>
      </header>

      {/* Cartão Principal */}
      <main className="w-full max-w-xl bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        {/* Formulário para digitar e adicionar nova tarefa (CRIAR) */}
        <section className="p-6 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={adicionarTarefa} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="campo-tarefa" className="sr-only">
                Digite a sua tarefa
              </label>
              <input
                id="campo-tarefa"
                type="text"
                placeholder="Ex.: Praticar lógica de programação..."
                value={textoDaNovaTarefa}
                onChange={(evento) => {
                  setTextoDaNovaTarefa(evento.target.value);
                  if (mensagemDeErro) setMensagemDeErro('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-sm transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar</span>
            </button>
          </form>

          {/* Mensagem de validação (aparece quando o campo está vazio) */}
          {mensagemDeErro && (
            <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{mensagemDeErro}</span>
            </div>
          )}
        </section>

        {/* Resumo com contadores */}
        <section className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-600 font-medium">
          <span>Total: <strong>{totalDeTarefas}</strong></span>
          <span>Pendentes: <strong>{tarefasPendentes}</strong></span>
          <span>Concluídas: <strong>{tarefasConcluidas}</strong></span>
        </section>

        {/* Lista de tarefas cadastradas (VISUALIZAR) */}
        <section className="p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Tarefas Cadastradas
          </h2>

          {listaDeTarefas.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-slate-300 rounded-xl bg-slate-50">
              <p className="text-slate-500 font-medium">
                Nenhuma tarefa cadastrada no momento.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Digite algo no campo acima e clique em &quot;Adicionar&quot;.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {listaDeTarefas.map((tarefa) => {
                const estaSendoEditada = idEmEdicao === tarefa.id;

                return (
                  <li
                    key={tarefa.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col gap-3 shadow-xs hover:border-slate-300 transition"
                  >
                    {/* Se estiver no modo de edição para esta tarefa */}
                    {estaSendoEditada ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={textoEmEdicao}
                            onChange={(e) => {
                              setTextoEmEdicao(e.target.value);
                              if (mensagemDeErroEdicao) setMensagemDeErroEdicao('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') salvarEdicao(tarefa.id);
                              if (e.key === 'Escape') cancelarEdicao();
                            }}
                            autoFocus
                            className="flex-1 px-3 py-2 rounded-lg border border-blue-400 bg-blue-50/20 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Edite o nome da tarefa..."
                          />

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => salvarEdicao(tarefa.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition cursor-pointer"
                              title="Salvar alterações"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Salvar</span>
                            </button>

                            <button
                              type="button"
                              onClick={cancelarEdicao}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                              title="Cancelar edição"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>

                        {/* Aviso de validação da edição */}
                        {mensagemDeErroEdicao && (
                          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-md">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{mensagemDeErroEdicao}</span>
                          </div>
                        )}

                        <span className="text-xs text-slate-400 italic">
                          Dica: pressione Enter para salvar ou Esc para cancelar.
                        </span>
                      </div>
                    ) : (
                      /* Modo de visualização normal */
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Opção para marcar como concluída e texto da tarefa */}
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => alternarStatusTarefa(tarefa.id)}
                            className="mt-0.5 sm:mt-0 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                            title={
                              tarefa.concluida
                                ? 'Marcar como pendente'
                                : 'Marcar como concluída'
                            }
                            aria-label={`Marcar tarefa "${tarefa.texto}" como ${
                              tarefa.concluida ? 'pendente' : 'concluída'
                            }`}
                          >
                            {tarefa.concluida ? (
                              <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          <div className="flex flex-col flex-1 min-w-0">
                            {/* Apenas tarefas concluídas aparecem com o texto riscado */}
                            <span
                              className={`text-sm sm:text-base break-words transition-all duration-200 ${
                                tarefa.concluida
                                  ? 'line-through text-slate-400'
                                  : 'no-underline text-slate-800 font-normal'
                              }`}
                            >
                              {tarefa.texto}
                            </span>

                            {/* Informa expressamente se está Pendente ou Concluída */}
                            <span className="text-xs text-slate-500 mt-1">
                              Status:{' '}
                              <span className="font-semibold text-slate-700">
                                {tarefa.concluida ? 'Concluída' : 'Pendente'}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Ações da tarefa: Botão Editar, Botão de Status e Botão Remover */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {/* Botão Editar (abre o formulário de edição) */}
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(tarefa)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Editar texto da tarefa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          {/* Botão para alternar status */}
                          <button
                            type="button"
                            onClick={() => alternarStatusTarefa(tarefa.id)}
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          >
                            {tarefa.concluida ? 'Marcar como pendente' : 'Marcar como concluída'}
                          </button>

                          {/* Botão Remover */}
                          <button
                            type="button"
                            onClick={() => removerTarefa(tarefa.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                            title="Remover tarefa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remover</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {/* Rodapé didático com dicas de programação */}
      <footer className="w-full max-w-xl text-center mt-6 text-xs text-slate-500">
        <p>
          💡 <strong>CRUD completo implementado:</strong> Criar (Adicionar), Visualizar (Lista), Atualizar (Editar texto / Alternar status) e Excluir (Remover).
        </p>
      </footer>
    </div>
  );
}

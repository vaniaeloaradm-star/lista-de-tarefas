import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, AlertCircle } from 'lucide-react';

// Estrutura que define o formato de cada tarefa
interface Tarefa {
  id: number;
  texto: string;
  concluida: boolean;
}

export default function App() {
  // Estado para guardar o texto que o usuário está digitando no campo
  const [textoDaNovaTarefa, setTextoDaNovaTarefa] = useState<string>('');

  // Estado para armazenar a lista com todas as tarefas cadastradas
  // Começamos com duas tarefas de exemplo para você ver como funciona logo ao abrir
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

  // Estado para exibir uma mensagem de aviso caso tente adicionar tarefa em branco
  const [mensagemDeErro, setMensagemDeErro] = useState<string>('');

  // Função para adicionar uma nova tarefa à lista
  function adicionarTarefa(evento?: React.FormEvent) {
    if (evento) {
      evento.preventDefault(); // Evita que a página recarregue ao enviar o formulário
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

    // Limpa o campo de texto e remove qualquer mensagem de erro
    setTextoDaNovaTarefa('');
    setMensagemDeErro('');
  }

  // Função para alternar o status da tarefa entre concluída e pendente
  function alternarStatusTarefa(idParaAlterar: number) {
    const listaAtualizada = listaDeTarefas.map((tarefa) => {
      if (tarefa.id === idParaAlterar) {
        // Inverte o valor de concluida (se for false vira true, se for true vira false)
        return {
          ...tarefa,
          concluida: !tarefa.concluida,
        };
      }
      return tarefa;
    });

    setListaDeTarefas(listaAtualizada);
  }

  // Função para remover uma tarefa da lista pelo seu id
  function removerTarefa(idParaRemover: number) {
    // O método .filter cria uma nova lista contendo apenas as tarefas que têm id diferente do que queremos apagar
    const listaAtualizada = listaDeTarefas.filter(
      (tarefa) => tarefa.id !== idParaRemover
    );

    setListaDeTarefas(listaAtualizada);
  }

  // Cálculos simples para o resumo de tarefas
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
          Primeira versão: adicione, marque como concluída e remova tarefas facilmente.
        </p>
      </header>

      {/* Cartão Principal */}
      <main className="w-full max-w-xl bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        {/* Formulário para digitar e adicionar tarefa */}
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

        {/* Lista de tarefas cadastradas */}
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
              {listaDeTarefas.map((tarefa) => (
                <li
                  key={tarefa.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition"
                >
                  {/* Opção para marcar como concluída e texto da tarefa */}
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => alternarStatusTarefa(tarefa.id)}
                      className="mt-0.5 sm:mt-0 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                      title={tarefa.concluida ? 'Marcar como pendente' : 'Marcar como concluída'}
                      aria-label={`Marcar tarefa "${tarefa.texto}" como ${tarefa.concluida ? 'pendente' : 'concluída'}`}
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

                  {/* Ações da tarefa: botão de alternar status e botão Remover */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => alternarStatusTarefa(tarefa.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      {tarefa.concluida ? 'Marcar como pendente' : 'Marcar como concluída'}
                    </button>

                    <button
                      type="button"
                      onClick={() => removerTarefa(tarefa.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                      title="Remover tarefa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Rodapé didático com dicas de programação */}
      <footer className="w-full max-w-xl text-center mt-6 text-xs text-slate-500">
        <p>
          💡 Dica de estudo: você pode abrir o código para ver como o estado (
          <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono">useState</code>) e as funções (
          <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono">adicionarTarefa</code>,{' '}
          <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono">removerTarefa</code>) gerenciam os dados.
        </p>
      </footer>
    </div>
  );
}

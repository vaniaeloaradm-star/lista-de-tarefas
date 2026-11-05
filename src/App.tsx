import React, { useState, useEffect } from 'react';
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
  Calendar,
  Clock,
  AlertTriangle,
} from 'lucide-react';

// Estrutura que define o formato de cada tarefa
interface Tarefa {
  id: number;
  texto: string;
  concluida: boolean;
  dataVencimento?: string; // Formato padrão "AAAA-MM-DD" ou vazio
}

// Chave utilizada para persistência no localStorage
const CHAVE_STORAGE = 'lista_fan_tarefas';

// Tipos de situação de vencimento para calcular alertas e cores
type TipoVencimento = 'atrasada' | 'hoje' | 'amanha' | 'a_vencer' | 'sem_data';

interface SituacaoVencimento {
  tipo: TipoVencimento;
  rotulo: string;
}

// Função auxiliar para calcular se uma data vence no dia, está atrasada, vence amanhã ou ainda não está para vencer
// Baseada sempre na data local do aparelho do usuário
function calcularSituacaoVencimento(dataIso?: string): SituacaoVencimento {
  if (!dataIso) {
    return { tipo: 'sem_data', rotulo: '' };
  }

  // Obtém a data local atual (hoje) no formato AAAA-MM-DD
  const agora = new Date();
  const anoHoje = agora.getFullYear();
  const mesHoje = String(agora.getMonth() + 1).padStart(2, '0');
  const diaHoje = String(agora.getDate()).padStart(2, '0');
  const hojeIso = `${anoHoje}-${mesHoje}-${diaHoje}`;

  // Obtém a data local de amanhã no formato AAAA-MM-DD
  const dataAmanha = new Date(agora);
  dataAmanha.setDate(dataAmanha.getDate() + 1);
  const anoAmanha = dataAmanha.getFullYear();
  const mesAmanha = String(dataAmanha.getMonth() + 1).padStart(2, '0');
  const diaAmanha = String(dataAmanha.getDate()).padStart(2, '0');
  const amanhaIso = `${anoAmanha}-${mesAmanha}-${diaAmanha}`;

  if (dataIso < hojeIso) {
    return { tipo: 'atrasada', rotulo: 'Atrasada' };
  }
  if (dataIso === hojeIso) {
    return { tipo: 'hoje', rotulo: 'Vence no dia' };
  }
  if (dataIso === amanhaIso) {
    return { tipo: 'amanha', rotulo: 'Vence amanhã' };
  }

  // Data futura além de amanhã: ainda não está para vencer (Azul Marinho)
  return { tipo: 'a_vencer', rotulo: 'Ainda não está para vencer' };
}

// Formata uma data no formato "AAAA-MM-DD" para "DD/MM/AAAA"
function formatarDataParaExibicao(dataIso?: string): string {
  if (!dataIso) return '';
  const partes = dataIso.split('-');
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }
  return dataIso;
}

// Carrega as tarefas salvas do localStorage ou cria as tarefas de exemplo
function carregarTarefasIniciais(): Tarefa[] {
  try {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);
    if (dadosSalvos) {
      const tarefasParseadas = JSON.parse(dadosSalvos);
      if (Array.isArray(tarefasParseadas)) {
        return tarefasParseadas;
      }
    }
  } catch (erro) {
    console.error('Erro ao ler tarefas do localStorage:', erro);
  }

  // Exemplos iniciais caso seja o primeiro acesso:
  const hoje = new Date();
  const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

  const dataFutura = new Date(hoje);
  dataFutura.setDate(dataFutura.getDate() + 5);
  const dataFuturaIso = `${dataFutura.getFullYear()}-${String(dataFutura.getMonth() + 1).padStart(2, '0')}-${String(dataFutura.getDate()).padStart(2, '0')}`;

  return [
    {
      id: 1,
      texto: 'Aprender a estrutura básica do HTML',
      concluida: false,
      dataVencimento: hojeIso, // Vence no dia (Vermelho)
    },
    {
      id: 2,
      texto: 'Construir projetos interativos com React e TypeScript',
      concluida: false,
      dataVencimento: dataFuturaIso, // Ainda não está para vencer (Azul Marinho)
    },
    {
      id: 3,
      texto: 'Compreender como funcionam as variáveis e funções no JavaScript',
      concluida: true,
      dataVencimento: '', // Concluída (Verde)
    },
  ];
}

export default function App() {
  // Estado para armazenar a lista com todas as tarefas cadastradas (iniciado com localStorage)
  const [listaDeTarefas, setListaDeTarefas] = useState<Tarefa[]>(carregarTarefasIniciais);

  // Estados para o formulário de cadastro de nova tarefa
  const [textoDaNovaTarefa, setTextoDaNovaTarefa] = useState<string>('');
  const [dataDaNovaTarefa, setDataDaNovaTarefa] = useState<string>(''); // Data opcional
  const [mensagemDeErro, setMensagemDeErro] = useState<string>('');

  // Estados para controlar a edição de uma tarefa
  const [idEmEdicao, setIdEmEdicao] = useState<number | null>(null);
  const [textoEmEdicao, setTextoEmEdicao] = useState<string>('');
  const [dataEmEdicao, setDataEmEdicao] = useState<string>('');
  const [mensagemDeErroEdicao, setMensagemDeErroEdicao] = useState<string>('');

  // 1. SALVAR AUTOMATICAMENTE: sempre que a lista mudar, grava no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(listaDeTarefas));
    } catch (erro) {
      console.error('Erro ao salvar tarefas no localStorage:', erro);
    }
  }, [listaDeTarefas]);

  // ==========================================
  // 1. CRIAR (Create): Adicionar nova tarefa
  // ==========================================
  function adicionarTarefa(evento?: React.FormEvent) {
    if (evento) {
      evento.preventDefault();
    }

    const textoLimpo = textoDaNovaTarefa.trim();

    // Validação: não permite campo vazio ou somente espaços
    if (textoLimpo === '') {
      setMensagemDeErro('Por favor, digite o nome de uma tarefa antes de adicionar!');
      return;
    }

    const novaTarefa: Tarefa = {
      id: Date.now(),
      texto: textoLimpo,
      concluida: false,
      dataVencimento: dataDaNovaTarefa || '', // Salva data se fornecida
    };

    setListaDeTarefas([...listaDeTarefas, novaTarefa]);

    // Limpa os campos
    setTextoDaNovaTarefa('');
    setDataDaNovaTarefa('');
    setMensagemDeErro('');
  }

  // ==========================================
  // 2. ATUALIZAR (Update): Alternar status da tarefa
  // ==========================================
  function alternarStatusTarefa(idParaAlterar: number) {
    const listaAtualizada = listaDeTarefas.map((tarefa) => {
      if (tarefa.id === idParaAlterar) {
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
  // 3. ATUALIZAR (Update): Edição da tarefa
  // ==========================================
  function iniciarEdicao(tarefa: Tarefa) {
    setIdEmEdicao(tarefa.id);
    setTextoEmEdicao(tarefa.texto);
    setDataEmEdicao(tarefa.dataVencimento || '');
    setMensagemDeErroEdicao('');
  }

  function cancelarEdicao() {
    setIdEmEdicao(null);
    setTextoEmEdicao('');
    setDataEmEdicao('');
    setMensagemDeErroEdicao('');
  }

  function salvarEdicao(idParaAtualizar: number) {
    const textoLimpo = textoEmEdicao.trim();

    if (textoLimpo === '') {
      setMensagemDeErroEdicao('O texto da tarefa não pode ficar vazio!');
      return;
    }

    const listaAtualizada = listaDeTarefas.map((tarefa) => {
      if (tarefa.id === idParaAtualizar) {
        return {
          ...tarefa,
          texto: textoLimpo,
          dataVencimento: dataEmEdicao || '',
        };
      }
      return tarefa;
    });

    setListaDeTarefas(listaAtualizada);
    setIdEmEdicao(null);
    setTextoEmEdicao('');
    setDataEmEdicao('');
    setMensagemDeErroEdicao('');
  }

  // ==========================================
  // 4. EXCLUIR (Delete): Remover tarefa
  // ==========================================
  function removerTarefa(idParaRemover: number) {
    if (idEmEdicao === idParaRemover) {
      cancelarEdicao();
    }

    const listaAtualizada = listaDeTarefas.filter((tarefa) => tarefa.id !== idParaRemover);
    setListaDeTarefas(listaAtualizada);
  }

  // Cálculos do resumo
  const totalDeTarefas = listaDeTarefas.length;
  const tarefasConcluidas = listaDeTarefas.filter((t) => t.concluida).length;
  const tarefasPendentes = totalDeTarefas - tarefasConcluidas;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center py-10 px-4">
      {/* Cabeçalho */}
      <header className="w-full max-w-xl text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-900 rounded-2xl mb-3 shadow-sm">
          <ListTodo className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Lista Fan
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Gerencie suas tarefas com datas de vencimento, legendas coloridas e salvamento automático.
        </p>
      </header>

      {/* Cartão Principal */}
      <main className="w-full max-w-xl bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        {/* Formulário para adicionar nova tarefa com campo de data opcional */}
        <section className="p-6 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={adicionarTarefa} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="campo-tarefa" className="sr-only">
                  Digite a sua tarefa
                </label>
                <input
                  id="campo-tarefa"
                  type="text"
                  placeholder="Ex.: Enviar relatório mensal..."
                  value={textoDaNovaTarefa}
                  onChange={(evento) => {
                    setTextoDaNovaTarefa(evento.target.value);
                    if (mensagemDeErro) setMensagemDeErro('');
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Campo opcional de data de vencimento */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <label htmlFor="campo-data" className="sr-only">
                    Data de vencimento (opcional)
                  </label>
                  <div className="relative">
                    <input
                      id="campo-data"
                      type="date"
                      value={dataDaNovaTarefa}
                      onChange={(evento) => setDataDaNovaTarefa(evento.target.value)}
                      className="w-full sm:w-auto px-3 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
                      title="Data de vencimento (opcional)"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-sm transition cursor-pointer shrink-0"
                >
                  <Plus className="w-5 h-5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          </form>

          {/* Mensagem de validação de campo vazio */}
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

        {/* Legenda de Cores da Aplicação */}
        <section className="px-6 py-3 bg-slate-50/90 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
              <span>Legenda:</span>
            </span>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
              {/* Vence no dia (Vermelho) */}
              <div className="inline-flex items-center gap-1.5 font-medium text-red-700">
                <span className="w-3 h-3 rounded-full bg-red-600 ring-2 ring-red-100 shrink-0" />
                <span>Vence no dia (Vermelho)</span>
              </div>

              {/* Ainda não está para vencer (Azul Marinho) */}
              <div className="inline-flex items-center gap-1.5 font-semibold text-blue-950">
                <span className="w-3 h-3 rounded-full bg-blue-900 ring-2 ring-blue-200 shrink-0" />
                <span>Ainda não está para vencer (Azul Marinho)</span>
              </div>

              {/* Concluída (Verde) */}
              <div className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <span className="w-3 h-3 rounded-full bg-emerald-600 ring-2 ring-emerald-100 shrink-0" />
                <span>Concluída (Verde)</span>
              </div>
            </div>
          </div>
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
              {listaDeTarefas.map((tarefa) => {
                const estaSendoEditada = idEmEdicao === tarefa.id;
                const situacao = calcularSituacaoVencimento(tarefa.dataVencimento);

                // Situações de vencimento:
                // 1. Vence no dia / atrasada / amanhã -> VERMELHO
                const ehVenceNoDiaOuUrgente =
                  !tarefa.concluida &&
                  (situacao.tipo === 'hoje' ||
                    situacao.tipo === 'atrasada' ||
                    situacao.tipo === 'amanha');

                // 2. Ainda não está para vencer (data futura) -> AZUL MARINHO
                const ehAindaNaoEstaParaVencer =
                  !tarefa.concluida && situacao.tipo === 'a_vencer';

                // Definição das cores e bordas conforme o estado da tarefa:
                // - Concluída: VERDE (mesmo com data passada)
                // - Pendente que vence no dia: VERMELHO
                // - Pendente que ainda não está para vencer: AZUL MARINHO
                // - Pendente sem data: COR PADRÃO
                let classesDoCard = 'p-4 rounded-xl border transition shadow-xs ';
                if (tarefa.concluida) {
                  classesDoCard += 'bg-emerald-50/80 border-emerald-300 hover:border-emerald-400';
                } else if (ehVenceNoDiaOuUrgente) {
                  classesDoCard += 'bg-red-50/80 border-red-300 hover:border-red-400';
                } else if (ehAindaNaoEstaParaVencer) {
                  classesDoCard += 'bg-blue-50/70 border-blue-900/30 hover:border-blue-900/50';
                } else {
                  classesDoCard += 'bg-white border-slate-200 hover:border-slate-300';
                }

                return (
                  <li key={tarefa.id} className={classesDoCard}>
                    {/* Modo de Edição */}
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

                          {/* Data de vencimento na edição */}
                          <input
                            type="date"
                            value={dataEmEdicao}
                            onChange={(e) => setDataEmEdicao(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-blue-400 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            title="Data de vencimento (opcional)"
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
                      /* Modo de Visualização Normal */
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          {/* Botão de alternar status */}
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
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle
                                className={`w-5 h-5 ${
                                  ehVenceNoDiaOuUrgente
                                    ? 'text-red-500'
                                    : ehAindaNaoEstaParaVencer
                                    ? 'text-blue-900'
                                    : 'text-slate-400'
                                }`}
                              />
                            )}
                          </button>

                          <div className="flex flex-col flex-1 min-w-0">
                            {/* Texto da tarefa: riscado quando concluída */}
                            <span
                              className={`text-sm sm:text-base break-words transition-all duration-200 ${
                                tarefa.concluida
                                  ? 'line-through text-slate-400'
                                  : ehVenceNoDiaOuUrgente
                                  ? 'no-underline text-red-950 font-medium'
                                  : ehAindaNaoEstaParaVencer
                                  ? 'no-underline text-blue-950 font-medium'
                                  : 'no-underline text-slate-800 font-normal'
                              }`}
                            >
                              {tarefa.texto}
                            </span>

                            {/* Informações de status, alertas e data */}
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {/* Tag de status principal */}
                              {tarefa.concluida ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check className="w-3 h-3" />
                                  Concluída
                                </span>
                              ) : ehVenceNoDiaOuUrgente ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200">
                                  {situacao.tipo === 'atrasada' ? (
                                    <AlertTriangle className="w-3 h-3 text-red-600" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-red-600" />
                                  )}
                                  {situacao.rotulo}
                                </span>
                              ) : ehAindaNaoEstaParaVencer ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-950 border border-blue-300">
                                  <Calendar className="w-3 h-3 text-blue-900" />
                                  Ainda não está para vencer
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">
                                  Status:{' '}
                                  <span className="font-semibold text-slate-700">Pendente</span>
                                </span>
                              )}

                              {/* Exibição da Data de Vencimento no formato DD/MM/AAAA */}
                              {tarefa.dataVencimento && (
                                <span
                                  className={`inline-flex items-center gap-1 text-xs ${
                                    tarefa.concluida
                                      ? 'text-slate-400'
                                      : ehVenceNoDiaOuUrgente
                                      ? 'text-red-700 font-medium'
                                      : ehAindaNaoEstaParaVencer
                                      ? 'text-blue-900 font-medium'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  <Calendar className="w-3 h-3" />
                                  Vencimento: {formatarDataParaExibicao(tarefa.dataVencimento)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Ações da Tarefa */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {/* Botão Editar */}
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(tarefa)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Editar tarefa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          {/* Botão Concluir / Desmarcar */}
                          <button
                            type="button"
                            onClick={() => alternarStatusTarefa(tarefa.id)}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                              tarefa.concluida
                                ? 'border-emerald-300 text-emerald-800 hover:bg-emerald-100 bg-white'
                                : ehAindaNaoEstaParaVencer
                                ? 'border-blue-300 text-blue-900 hover:bg-blue-100 bg-white'
                                : 'border-slate-300 text-slate-700 hover:bg-slate-100 bg-white'
                            }`}
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

      {/* Rodapé Didático */}
      <footer className="w-full max-w-xl text-center mt-6 text-xs text-slate-500">
        <p>
          💾 Dados salvos automaticamente no seu navegador via <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono">localStorage</code>.
        </p>
      </footer>
    </div>
  );
}

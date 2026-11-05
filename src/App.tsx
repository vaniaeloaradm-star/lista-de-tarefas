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
  CalendarPlus,
  LogOut,
  CheckCheck,
  Loader2,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './services/googleAuth';
import { criarEventoNoGoogleCalendar } from './services/googleCalendar';

// Estrutura que define o formato de cada tarefa
interface Tarefa {
  id: number;
  texto: string;
  concluida: boolean;
  dataVencimento?: string; // Formato padrão "AAAA-MM-DD" ou vazio
  horarioVencimento?: string; // Formato padrão "HH:MM" ou vazio
  sincronizadaCalendar?: boolean; // Indica se foi sincronizada via API
  linkGoogleCalendar?: string; // Link direto para o evento criado na agenda
}

// Chave utilizada para persistência no localStorage
const CHAVE_STORAGE = 'lista_fan_tarefas';

// Tipos de situação de vencimento para calcular alertas e cores
type TipoVencimento = 'atrasada' | 'hoje' | 'amanha' | 'a_vencer' | 'sem_data';

interface SituacaoVencimento {
  tipo: TipoVencimento;
  rotulo: string;
}

// Função auxiliar para calcular se uma data vence no dia, no dia seguinte, está atrasada ou ainda não está para vencer
function calcularSituacaoVencimento(dataIso?: string): SituacaoVencimento {
  if (!dataIso) {
    return { tipo: 'sem_data', rotulo: '' };
  }

  const agora = new Date();
  const anoHoje = agora.getFullYear();
  const mesHoje = String(agora.getMonth() + 1).padStart(2, '0');
  const diaHoje = String(agora.getDate()).padStart(2, '0');
  const hojeIso = `${anoHoje}-${mesHoje}-${diaHoje}`;

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
    return { tipo: 'amanha', rotulo: 'Vence no dia seguinte' };
  }

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

// Calcula o dia seguinte no formato AAAAMMDD para eventos de dia inteiro no link de template
function calcularDiaSeguinteIso(dataIso: string): string {
  const partes = dataIso.split('-').map(Number);
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    const d = new Date(ano, mes - 1, dia);
    d.setDate(d.getDate() + 1);
    const anoFim = d.getFullYear();
    const mesFim = String(d.getMonth() + 1).padStart(2, '0');
    const diaFim = String(d.getDate()).padStart(2, '0');
    return `${anoFim}${mesFim}${diaFim}`;
  }
  return dataIso.replace(/-/g, '');
}

// Gera a URL direta do Google Calendar para abrir em nova aba
function gerarLinkTemplateCalendar(tarefa: Tarefa): string {
  if (!tarefa.dataVencimento) return '#';

  const titulo = encodeURIComponent(tarefa.texto);
  const detalhes = encodeURIComponent('Tarefa do My Checklist: ' + tarefa.texto);
  const dataLimpa = tarefa.dataVencimento.replace(/-/g, '');

  let datasParam = '';

  if (tarefa.horarioVencimento) {
    const [horaStr, minutoStr] = tarefa.horarioVencimento.split(':');
    const hora = parseInt(horaStr, 10) || 0;
    const minuto = parseInt(minutoStr, 10) || 0;
    const horaInicio = `${String(hora).padStart(2, '0')}${String(minuto).padStart(2, '0')}00`;

    let horaFimNum = hora + 1;
    let dataFimLimpa = dataLimpa;
    if (horaFimNum >= 24) {
      horaFimNum = 0;
      dataFimLimpa = calcularDiaSeguinteIso(tarefa.dataVencimento);
    }
    const horaFim = `${String(horaFimNum).padStart(2, '0')}${String(minuto).padStart(2, '0')}00`;

    datasParam = `${dataLimpa}T${horaInicio}/${dataFimLimpa}T${horaFim}`;
  } else {
    const dataFim = calcularDiaSeguinteIso(tarefa.dataVencimento);
    datasParam = `${dataLimpa}/${dataFim}`;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${datasParam}&details=${detalhes}`;
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
      dataVencimento: hojeIso,
      horarioVencimento: '14:00',
    },
    {
      id: 2,
      texto: 'Construir projetos interativos com React e TypeScript',
      concluida: false,
      dataVencimento: dataFuturaIso,
      horarioVencimento: '10:30',
    },
    {
      id: 3,
      texto: 'Compreender como funcionam as variáveis e funções no JavaScript',
      concluida: true,
      dataVencimento: '',
      horarioVencimento: '',
    },
  ];
}

export default function App() {
  // Lista com todas as tarefas cadastradas
  const [listaDeTarefas, setListaDeTarefas] = useState<Tarefa[]>(carregarTarefasIniciais);

  // Estados de autenticação com a conta Google (OAuth)
  const [usuarioGoogle, setUsuarioGoogle] = useState<User | null>(null);
  const [estaConectandoGoogle, setEstaConectandoGoogle] = useState<boolean>(false);
  const [mostrarAjudaDominio, setMostrarAjudaDominio] = useState<boolean>(false);
  const [mensagemFeedback, setMensagemFeedback] = useState<{
    tipo: 'sucesso' | 'erro';
    texto: string;
  } | null>(null);

  // Estados para diálogo de confirmação de sincronização no Calendar (Regra obrigatória de mutação)
  const [tarefaParaSincronizar, setTarefaParaSincronizar] = useState<Tarefa | null>(null);
  const [estaSincronizando, setEstaSincronizando] = useState<boolean>(false);

  // Estados para o formulário de cadastro de nova tarefa
  const [textoDaNovaTarefa, setTextoDaNovaTarefa] = useState<string>('');
  const [dataDaNovaTarefa, setDataDaNovaTarefa] = useState<string>('');
  const [horarioDaNovaTarefa, setHorarioDaNovaTarefa] = useState<string>('');
  const [mensagemDeErro, setMensagemDeErro] = useState<string>('');

  // Estados para controlar a edição de uma tarefa
  const [idEmEdicao, setIdEmEdicao] = useState<number | null>(null);
  const [textoEmEdicao, setTextoEmEdicao] = useState<string>('');
  const [dataEmEdicao, setDataEmEdicao] = useState<string>('');
  const [horarioEmEdicao, setHorarioEmEdicao] = useState<string>('');
  const [mensagemDeErroEdicao, setMensagemDeErroEdicao] = useState<string>('');

  // 1. Ouvinte do estado de autenticação Google
  useEffect(() => {
    const cancelarOuvinte = initAuth(
      (user) => {
        setUsuarioGoogle(user);
      },
      () => {
        setUsuarioGoogle(null);
      }
    );
    return () => cancelarOuvinte();
  }, []);

  // 2. SALVAR AUTOMATICAMENTE: sempre que a lista mudar, grava no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(listaDeTarefas));
    } catch (erro) {
      console.error('Erro ao salvar tarefas no localStorage:', erro);
    }
  }, [listaDeTarefas]);

  // Login com Google via Popup
  async function handleLoginGoogle() {
    setEstaConectandoGoogle(true);
    setMensagemFeedback(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUsuarioGoogle(res.user);
        setMostrarAjudaDominio(false);
        setMensagemFeedback({
          tipo: 'sucesso',
          texto: `Conectado com sucesso como ${res.user.displayName || res.user.email}!`,
        });
      }
    } catch (erro: any) {
      console.error('Erro ao realizar login Google:', erro);
      const codigoErro = erro?.code || '';

      if (codigoErro === 'auth/unauthorized-domain' || erro?.message?.includes('auth/unauthorized-domain')) {
        setMostrarAjudaDominio(true);
        setMensagemFeedback({
          tipo: 'erro',
          texto: `O endereço "${window.location.hostname}" precisa ser adicionado aos Domínios Autorizados no Firebase para habilitar o login popup. Veja as instruções abaixo ou use o botão "Adicionar à Agenda" diretamente!`,
        });
      } else if (codigoErro === 'auth/popup-closed-by-user') {
        setMensagemFeedback({
          tipo: 'erro',
          texto: 'A janela de login com a conta Google foi fechada antes de concluir.',
        });
      } else {
        setMensagemFeedback({
          tipo: 'erro',
          texto: erro?.message || 'Não foi possível concluir a autenticação com o Google.',
        });
      }
    } finally {
      setEstaConectandoGoogle(false);
    }
  }

  // Logout da conta Google
  async function handleLogoutGoogle() {
    await logout();
    setUsuarioGoogle(null);
    setMensagemFeedback({
      tipo: 'sucesso',
      texto: 'Desconectado da conta Google com sucesso.',
    });
  }

  // Abre o diálogo de confirmação para sincronizar evento no Google Agenda
  function solicitarSincronizacao(tarefa: Tarefa) {
    if (!usuarioGoogle) {
      // Se ainda não conectou, pede login primeiro
      handleLoginGoogle();
      return;
    }
    setTarefaParaSincronizar(tarefa);
  }

  // Executa a criação real do evento no Google Calendar após confirmação expressa do usuário
  async function confirmarSincronizacao() {
    if (!tarefaParaSincronizar || !tarefaParaSincronizar.dataVencimento) return;

    setEstaSincronizando(true);
    setMensagemFeedback(null);

    try {
      const resultado = await criarEventoNoGoogleCalendar({
        titulo: tarefaParaSincronizar.texto,
        dataIso: tarefaParaSincronizar.dataVencimento,
        horario: tarefaParaSincronizar.horarioVencimento,
        detalhes: 'Tarefa cadastrada no My Checklist',
      });

      // Atualiza a tarefa marcando como sincronizada e salvando o link do evento
      const listaAtualizada = listaDeTarefas.map((t) => {
        if (t.id === tarefaParaSincronizar.id) {
          return {
            ...t,
            sincronizadaCalendar: true,
            linkGoogleCalendar: resultado.htmlLink,
          };
        }
        return t;
      });

      setListaDeTarefas(listaAtualizada);
      setMensagemFeedback({
        tipo: 'sucesso',
        texto: `Evento "${tarefaParaSincronizar.texto}" adicionado com sucesso à sua Google Agenda!`,
      });
      setTarefaParaSincronizar(null);
    } catch (erro: any) {
      console.error('Erro na sincronização:', erro);
      setMensagemFeedback({
        tipo: 'erro',
        texto: erro?.message || 'Erro ao sincronizar com a Google Agenda.',
      });
    } finally {
      setEstaSincronizando(false);
    }
  }

  // Adicionar nova tarefa
  function adicionarTarefa(evento?: React.FormEvent) {
    if (evento) {
      evento.preventDefault();
    }

    const textoLimpo = textoDaNovaTarefa.trim();

    if (textoLimpo === '') {
      setMensagemDeErro('Por favor, digite o nome de uma tarefa antes de adicionar!');
      return;
    }

    const novaTarefa: Tarefa = {
      id: Date.now(),
      texto: textoLimpo,
      concluida: false,
      dataVencimento: dataDaNovaTarefa || '',
      horarioVencimento: horarioDaNovaTarefa || '',
    };

    setListaDeTarefas([...listaDeTarefas, novaTarefa]);
    setTextoDaNovaTarefa('');
    setDataDaNovaTarefa('');
    setHorarioDaNovaTarefa('');
    setMensagemDeErro('');
  }

  // Alternar status
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

  // Iniciar e salvar edição
  function iniciarEdicao(tarefa: Tarefa) {
    setIdEmEdicao(tarefa.id);
    setTextoEmEdicao(tarefa.texto);
    setDataEmEdicao(tarefa.dataVencimento || '');
    setHorarioEmEdicao(tarefa.horarioVencimento || '');
    setMensagemDeErroEdicao('');
  }

  function cancelarEdicao() {
    setIdEmEdicao(null);
    setTextoEmEdicao('');
    setDataEmEdicao('');
    setHorarioEmEdicao('');
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
          horarioVencimento: horarioEmEdicao || '',
        };
      }
      return tarefa;
    });

    setListaDeTarefas(listaAtualizada);
    setIdEmEdicao(null);
    setTextoEmEdicao('');
    setDataEmEdicao('');
    setHorarioEmEdicao('');
    setMensagemDeErroEdicao('');
  }

  // Remover tarefa
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
      <header className="w-full max-w-2xl text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-900 rounded-2xl mb-3 shadow-sm">
          <ListTodo className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          My Checklist
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Gerencie suas tarefas com datas, horários e sincronização direta na Google Agenda.
        </p>
      </header>

      {/* Barra de Integração com Google Agenda (Opção B) */}
      <section className="w-full max-w-2xl mb-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                Google Agenda
                {usuarioGoogle ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <span>(Desconectado)</span>
                    <button
                      type="button"
                      onClick={() => setMostrarAjudaDominio(!mostrarAjudaDominio)}
                      className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-0.5 cursor-pointer"
                      title="Como funciona o login no GitHub Pages"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Ajuda login</span>
                    </button>
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {usuarioGoogle
                  ? `Sessão ativa: ${usuarioGoogle.displayName || usuarioGoogle.email}`
                  : 'Faça login para sincronização direta ou use o botão "Adicionar à Agenda" abaixo.'}
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            {usuarioGoogle ? (
              <button
                type="button"
                onClick={handleLogoutGoogle}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLoginGoogle}
                disabled={estaConectandoGoogle}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-800 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {estaConectandoGoogle ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Fazer Login com Google</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Feedback de sucesso ou erro da integração */}
        {mensagemFeedback && (
          <div
            className={`mt-3 flex items-start justify-between gap-2 text-xs px-3.5 py-2.5 rounded-xl border ${
              mensagemFeedback.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            <span className="leading-relaxed">{mensagemFeedback.texto}</span>
            <button
              type="button"
              onClick={() => setMensagemFeedback(null)}
              className="text-slate-500 hover:text-slate-700 cursor-pointer shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Guia explicativo passo a passo para o erro auth/unauthorized-domain */}
        {mostrarAjudaDominio && (
          <div className="mt-3 p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-950 text-xs">
                    Como liberar o login com a conta Google no GitHub Pages:
                  </h3>
                  <p className="mt-1 text-amber-900 leading-relaxed">
                    O Firebase bloqueia tentativas de login vindas de domínios desconhecidos por motivo de segurança. Para permitir o login direto no seu endereço:
                  </p>
                  <ol className="list-decimal ml-4 mt-2 space-y-1.5 text-amber-900">
                    <li>
                      Abra o{' '}
                      <a
                        href="https://console.firebase.google.com/project/gen-lang-client-0627195686/authentication/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline text-blue-700 hover:text-blue-900"
                      >
                        Console do Firebase (Configurações de Autenticação)
                      </a>.
                    </li>
                    <li>
                      Desça até a seção <strong>Domínios autorizados (Authorized domains)</strong> e clique no botão <strong>Adicionar domínio</strong>.
                    </li>
                    <li>
                      Adicione o domínio do seu GitHub Pages:{' '}
                      <code className="bg-white px-2 py-0.5 rounded border border-amber-300 font-mono font-bold text-amber-950">
                        vestma.github.io
                      </code>{' '}
                      e salve.
                    </li>
                  </ol>
                  <div className="mt-3 p-2.5 bg-amber-100/70 border border-amber-300/60 rounded-lg text-amber-900">
                    💡 <strong>Não quer configurar o Firebase?</strong> Não se preocupe! Você não precisa fazer login. Todas as suas tarefas com data têm o botão <strong>&quot;Adicionar à Agenda&quot;</strong> que abre o Google Agenda com tudo preenchido e pronto para salvar em 1 clique!
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMostrarAjudaDominio(false)}
                className="text-amber-700 hover:text-amber-950 cursor-pointer shrink-0"
                title="Fechar ajuda"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Cartão Principal */}
      <main className="w-full max-w-2xl bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        {/* Formulário para adicionar nova tarefa */}
        <section className="p-6 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={adicionarTarefa} className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
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

              {/* Campos opcionais de data e horário + botão Adicionar */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="flex-1 sm:flex-initial">
                  <label htmlFor="campo-data" className="sr-only">
                    Data de vencimento (opcional)
                  </label>
                  <input
                    id="campo-data"
                    type="date"
                    value={dataDaNovaTarefa}
                    onChange={(evento) => setDataDaNovaTarefa(evento.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
                    title="Data de vencimento (opcional)"
                  />
                </div>

                <div className="flex-1 sm:flex-initial">
                  <label htmlFor="campo-horario" className="sr-only">
                    Horário (opcional)
                  </label>
                  <input
                    id="campo-horario"
                    type="time"
                    value={horarioDaNovaTarefa}
                    onChange={(evento) => setHorarioDaNovaTarefa(evento.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
                    title="Horário (opcional)"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-sm transition cursor-pointer shrink-0"
                >
                  <Plus className="w-5 h-5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          </form>

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
              <div className="inline-flex items-center gap-1.5 font-medium text-red-700">
                <span className="w-3 h-3 rounded-full bg-red-600 ring-2 ring-red-100 shrink-0" />
                <span>Vence no dia e no dia seguinte (Vermelho)</span>
              </div>

              <div className="inline-flex items-center gap-1.5 font-semibold text-blue-950">
                <span className="w-3 h-3 rounded-full bg-blue-900 ring-2 ring-blue-200 shrink-0" />
                <span>Ainda não está para vencer (Azul Marinho)</span>
              </div>

              <div className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-3 h-3 rounded-full bg-slate-400 ring-2 ring-slate-200 shrink-0" />
                <span>Concluída (Cinza)</span>
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

                const ehVenceNoDiaOuDiaSeguinte =
                  !tarefa.concluida &&
                  (situacao.tipo === 'hoje' ||
                    situacao.tipo === 'atrasada' ||
                    situacao.tipo === 'amanha');

                const ehAindaNaoEstaParaVencer =
                  !tarefa.concluida && situacao.tipo === 'a_vencer';

                let classesDoCard = 'p-4 rounded-xl border transition shadow-xs ';
                if (tarefa.concluida) {
                  classesDoCard += 'bg-slate-100/90 border-slate-300 hover:border-slate-400 opacity-80';
                } else if (ehVenceNoDiaOuDiaSeguinte) {
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
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Editar descrição da tarefa:
                          </label>
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
                            className="w-full px-3 py-2 rounded-lg border border-blue-400 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Edite o nome da tarefa..."
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="date"
                              value={dataEmEdicao}
                              onChange={(e) => setDataEmEdicao(e.target.value)}
                              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              title="Data de vencimento (opcional)"
                            />

                            <input
                              type="time"
                              value={horarioEmEdicao}
                              onChange={(e) => setHorarioEmEdicao(e.target.value)}
                              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              title="Horário (opcional)"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => salvarEdicao(tarefa.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition cursor-pointer"
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
                      /* Modo de Visualização Normal com Layout Seguro e Responsivo */
                      <div className="flex flex-col">
                        {/* Linha superior: Checkbox + Texto + Badges de Status (largura total) */}
                        <div className="flex items-start gap-3 w-full">
                          {/* Botão de alternar status */}
                          <button
                            type="button"
                            onClick={() => alternarStatusTarefa(tarefa.id)}
                            className="mt-0.5 text-slate-600 hover:text-blue-600 transition cursor-pointer shrink-0"
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
                              <CheckCircle2 className="w-5 h-5 text-slate-500" />
                            ) : (
                              <Circle
                                className={`w-5 h-5 ${
                                  ehVenceNoDiaOuDiaSeguinte
                                    ? 'text-red-500'
                                    : ehAindaNaoEstaParaVencer
                                    ? 'text-blue-900'
                                    : 'text-slate-400'
                                }`}
                              />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            {/* Texto da tarefa: ocupa toda a largura livre */}
                            <p
                              className={`text-sm sm:text-base break-words font-medium leading-relaxed transition-all duration-200 ${
                                tarefa.concluida
                                  ? 'line-through text-slate-500 font-normal'
                                  : ehVenceNoDiaOuDiaSeguinte
                                  ? 'no-underline text-red-950 font-semibold'
                                  : ehAindaNaoEstaParaVencer
                                  ? 'no-underline text-blue-950 font-semibold'
                                  : 'no-underline text-slate-800'
                              }`}
                            >
                              {tarefa.texto}
                            </p>

                            {/* Informações de status, alertas, data e horário */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {/* Tag de status principal */}
                              {tarefa.concluida ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-slate-300">
                                  <Check className="w-3 h-3 text-slate-500" />
                                  Concluída
                                </span>
                              ) : ehVenceNoDiaOuDiaSeguinte ? (
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

                              {/* Indicação se já foi sincronizada na agenda */}
                              {tarefa.sincronizadaCalendar && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  Sincronizado na Agenda
                                </span>
                              )}

                              {/* Exibição da Data de Vencimento e Horário */}
                              {(tarefa.dataVencimento || tarefa.horarioVencimento) && (
                                <span
                                  className={`inline-flex items-center gap-1.5 text-xs ${
                                    tarefa.concluida
                                      ? 'text-slate-500'
                                      : ehVenceNoDiaOuDiaSeguinte
                                      ? 'text-red-700 font-medium'
                                      : ehAindaNaoEstaParaVencer
                                      ? 'text-blue-900 font-medium'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {tarefa.dataVencimento && (
                                    <span className="inline-flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {formatarDataParaExibicao(tarefa.dataVencimento)}
                                    </span>
                                  )}
                                  {tarefa.horarioVencimento && (
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      às {tarefa.horarioVencimento}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Barra inferior de Ações: organizada em linha separada que nunca aperta o texto */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-200/80">
                          {/* Grupo da Google Agenda */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Botão Universal: Adicionar à Google Agenda (funciona diretamente no GitHub Pages sem precisar de login) */}
                            {tarefa.dataVencimento && (
                              <a
                                href={gerarLinkTemplateCalendar(tarefa)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 text-blue-700 bg-blue-50/80 hover:bg-blue-100 transition cursor-pointer"
                                title="Abrir o Google Agenda com data e tarefa já preenchidas para salvar"
                              >
                                <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                                <span>Adicionar à Agenda</span>
                                <ExternalLink className="w-3 h-3 text-blue-500" />
                              </a>
                            )}

                            {/* Botão de Sincronização Direta com 1 Clique (disponível quando a conta Google estiver conectada) */}
                            {tarefa.dataVencimento && !tarefa.concluida && usuarioGoogle && (
                              <button
                                type="button"
                                onClick={() => solicitarSincronizacao(tarefa)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                                  tarefa.sincronizadaCalendar
                                    ? 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                                    : 'border-blue-300 text-blue-700 bg-white hover:bg-blue-50'
                                }`}
                                title="Sincronizar evento automaticamente na Google Agenda"
                              >
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>
                                  {tarefa.sincronizadaCalendar
                                    ? 'Atualizar na Agenda'
                                    : 'Sincronizar (1-Clique)'}
                                </span>
                              </button>
                            )}
                          </div>

                          {/* Grupo de Ações da Tarefa */}
                          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                            {/* Botão Concluir / Desmarcar */}
                            <button
                              type="button"
                              onClick={() => alternarStatusTarefa(tarefa.id)}
                              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                                tarefa.concluida
                                  ? 'border-slate-300 text-slate-700 hover:bg-slate-200 bg-white'
                                  : ehAindaNaoEstaParaVencer
                                  ? 'border-blue-300 text-blue-900 hover:bg-blue-100 bg-white'
                                  : 'border-slate-300 text-slate-700 hover:bg-slate-100 bg-white'
                              }`}
                            >
                              {tarefa.concluida ? 'Marcar como pendente' : 'Marcar como concluída'}
                            </button>

                            {/* Botão Editar */}
                            <button
                              type="button"
                              onClick={() => iniciarEdicao(tarefa)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 bg-white transition cursor-pointer"
                              title="Editar tarefa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Editar</span>
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
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {/* Modal de Confirmação Obrigatório antes de criar evento na Google Agenda (Regra de proteção de dados) */}
      {tarefaParaSincronizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <CalendarPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Adicionar à Google Agenda
                </h3>
                <p className="text-xs text-slate-500">
                  Confirmação com a sua permissão
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-700 mb-4">
              Você confirma a criação do seguinte evento na sua Google Agenda vinculada à conta{' '}
              <strong>{usuarioGoogle?.displayName || usuarioGoogle?.email}</strong>?
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-xs text-slate-700 space-y-1.5">
              <p>
                <strong>Título:</strong> {tarefaParaSincronizar.texto}
              </p>
              <p>
                <strong>Data:</strong>{' '}
                {formatarDataParaExibicao(tarefaParaSincronizar.dataVencimento)}
              </p>
              <p>
                <strong>Horário:</strong>{' '}
                {tarefaParaSincronizar.horarioVencimento
                  ? `às ${tarefaParaSincronizar.horarioVencimento}`
                  : 'Evento de dia inteiro'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTarefaParaSincronizar(null)}
                disabled={estaSincronizando}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarSincronizacao}
                disabled={estaSincronizando}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {estaSincronizando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar e Criar Evento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé Didático */}
      <footer className="w-full max-w-xl text-center mt-6 text-xs text-slate-500">
        <p>
          💾 Dados salvos no seu navegador (<code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono">localStorage</code>) com integração à Google Agenda.
        </p>
      </footer>
    </div>
  );
}

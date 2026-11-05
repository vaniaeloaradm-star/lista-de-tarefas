import { getAccessToken } from './googleAuth';

interface CriarEventoParams {
  titulo: string;
  dataIso: string; // Formato "AAAA-MM-DD"
  horario?: string; // Formato "HH:MM"
  detalhes?: string;
}

// Cria um evento na Google Agenda do usuário autenticado
export async function criarEventoNoGoogleCalendar(
  params: CriarEventoParams
): Promise<{ id: string; htmlLink: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Você precisa estar conectado à sua conta Google para sincronizar.');
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

  let start: { dateTime?: string; date?: string; timeZone?: string };
  let end: { dateTime?: string; date?: string; timeZone?: string };

  if (params.horario) {
    // Evento com horário específico
    const [hora, minuto] = params.horario.split(':').map(Number);
    const inicioStr = `${params.dataIso}T${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00`;

    // Define término para 1 hora após o início por padrão
    let horaFim = hora + 1;
    let dataFim = params.dataIso;
    if (horaFim >= 24) {
      horaFim = 0;
      const [ano, mes, dia] = params.dataIso.split('-').map(Number);
      const d = new Date(ano, mes - 1, dia);
      d.setDate(d.getDate() + 1);
      dataFim = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const fimStr = `${dataFim}T${String(horaFim).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00`;

    start = { dateTime: inicioStr, timeZone };
    end = { dateTime: fimStr, timeZone };
  } else {
    // Evento de dia inteiro (data início e data final no dia seguinte)
    const [ano, mes, dia] = params.dataIso.split('-').map(Number);
    const d = new Date(ano, mes - 1, dia);
    d.setDate(d.getDate() + 1);
    const dataFim = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    start = { date: params.dataIso };
    end = { date: dataFim };
  }

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: params.titulo,
        description: params.detalhes || 'Criado a partir do aplicativo My Checklist',
        start,
        end,
      }),
    }
  );

  if (!response.ok) {
    const erroJson = await response.json().catch(() => ({}));
    throw new Error(
      erroJson?.error?.message ||
        `Erro ao criar evento na Google Agenda (Código ${response.status})`
    );
  }

  const data = await response.json();
  return { id: data.id, htmlLink: data.htmlLink };
}

import { NinoDialogue, NinoExpression, NinoPersonality, Task } from '../types';
import { getTodayString, getGreeting, isNightTime, getMinutesUntil, isTaskOverdue } from './dateUtils';

interface NinoContext {
  userName: string;
  personality: NinoPersonality;
  tasks: Task[];
  selectedDate: string;
}

export function generateNinoGreeting(ctx: NinoContext): NinoDialogue {
  const { userName, personality, tasks, selectedDate } = ctx;
  const today = getTodayString();
  const greeting = getGreeting();
  const night = isNightTime();

  // Filter tasks for the selected day
  const dayTasks = tasks.filter(t => t.date === selectedDate);
  const pendingTasks = dayTasks.filter(t => !t.completed);
  const completedTasks = dayTasks.filter(t => t.completed);
  const totalCount = dayTasks.length;
  const completedCount = completedTasks.length;
  const overdueTasks = tasks.filter(t => isTaskOverdue(t));
  const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');

  // Next upcoming task for today
  const upcomingTask = pendingTasks
    .filter(t => t.time)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    .find(t => {
      const minutes = getMinutesUntil(t.date, t.time);
      return minutes !== null && minutes >= -15 && minutes <= 60;
    });

  // 1. Sleepy Night state
  if (night && pendingTasks.length === 0) {
    switch (personality) {
      case 'divertido':
        return {
          text: `Boa noite, ${userName}! 🌙 Suas tarefas estão em dia. Hora de desligar as turbinas e ir dormir!`,
          expression: 'sleepy',
        };
      case 'profissional':
        return {
          text: `Boa noite, ${userName}. Atividades do dia finalizadas. Tenha um ótimo descanso para recarregar as energias.`,
          expression: 'sleepy',
        };
      case 'motivador':
        return {
          text: `Missão cumprida hoje, ${userName}! 🏆 Descanse bem porque amanhã conquistaremos novos objetivos!`,
          expression: 'sleepy',
        };
      case 'tranquilo':
        return {
          text: `Boa noite, ${userName}... 🌿 Relaxe a mente, respire fundo e aproveite seu merecido sono.`,
          expression: 'sleepy',
        };
    }
  }

  // 2. Imminent task (within 60 mins)
  if (upcomingTask && selectedDate === today) {
    const mins = getMinutesUntil(upcomingTask.date, upcomingTask.time);
    const timeDisplay = mins && mins > 0 ? `daqui a ${mins} minutos` : `em instantes`;
    
    switch (personality) {
      case 'divertido':
        return {
          text: `Ei, ${userName}! ⚡ Seu compromisso "${upcomingTask.title}" começa ${timeDisplay} (${upcomingTask.time}). Bora se preparar!`,
          expression: 'excited',
          urgent: true,
        };
      case 'profissional':
        return {
          text: `Lembrete pontual: "${upcomingTask.title}" está agendado para ${upcomingTask.time} (${timeDisplay}).`,
          expression: 'thinking',
          urgent: true,
        };
      case 'motivador':
        return {
          text: `Atenção, campeão! "${upcomingTask.title}" começa ${timeDisplay}. Mostre o seu melhor! 🔥`,
          expression: 'excited',
          urgent: true,
        };
      case 'tranquilo':
        return {
          text: `Com calma, lembrando que "${upcomingTask.title}" será ${timeDisplay} (${upcomingTask.time}). Respire e vá tranquilo. 🌱`,
          expression: 'happy',
          urgent: true,
        };
    }
  }

  // 3. Overdue tasks exist
  if (overdueTasks.length > 0 && selectedDate === today) {
    const firstOverdue = overdueTasks[0];
    switch (personality) {
      case 'divertido':
        return {
          text: `Ops! A tarefa "${firstOverdue.title}" acabou ficando para trás. Quer marcar como feita ou reagendar?`,
          expression: 'concerned',
          urgent: true,
        };
      case 'profissional':
        return {
          text: `Atenção: existem ${overdueTasks.length} ${overdueTasks.length === 1 ? 'pendência com prazo vencido' : 'pendências com prazo vencido'}. Recomendo priorizar ou reagendar.`,
          expression: 'concerned',
          urgent: true,
        };
      case 'motivador':
        return {
          text: `Não desanime! Ainda dá tempo de resolver "${firstOverdue.title}" hoje. Foco total que você consegue! 💪`,
          expression: 'concerned',
          urgent: true,
        };
      case 'tranquilo':
        return {
          text: `Sem estresse, tudo tem seu tempo. A tarefa "${firstOverdue.title}" precisa de atenção. Vamos reorganizar com calma?`,
          expression: 'neutral',
        };
    }
  }

  // 4. All tasks completed celebration
  if (totalCount > 0 && pendingTasks.length === 0) {
    switch (personality) {
      case 'divertido':
        return {
          text: `UAAAAU! 🎉 Você zerou todas as ${totalCount} tarefas de hoje! É hora de comemorar!`,
          expression: 'celebrating',
        };
      case 'profissional':
        return {
          text: `Excelente desempenho, ${userName}. 100% dos compromissos concluídos com sucesso.`,
          expression: 'proud',
        };
      case 'motivador':
        return {
          text: `SENSACIONAL! 🚀 Meta diária 100% batida! Você é imparável, ${userName}!`,
          expression: 'celebrating',
        };
      case 'tranquilo':
        return {
          text: `Que sensação boa de dever cumprido! ✨ Tudo feito em harmonia. Aproveite a paz do seu momento.`,
          expression: 'proud',
        };
    }
  }

  // 5. High progress (>= 75%)
  if (totalCount >= 3 && completedCount / totalCount >= 0.7) {
    const percent = Math.round((completedCount / totalCount) * 100);
    switch (personality) {
      case 'divertido':
        return {
          text: `Você está voando hoje! 🛸 Já completou ${percent}% da sua lista. Falta só um pouquinho!`,
          expression: 'excited',
        };
      case 'profissional':
        return {
          text: `Progresso muito positivo: ${percent}% concluído. Restam apenas ${pendingTasks.length} tarefas pendentes.`,
          expression: 'proud',
        };
      case 'motivador':
        return {
          text: `Ritmo incrível, ${userName}! ${percent}% concluído! Vamos fechar o dia com chave de ouro? 🔥`,
          expression: 'excited',
        };
      case 'tranquilo':
        return {
          text: `Belo progresso, ${percent}% realizado no seu ritmo natural. Continue assim, sem pressa. 🍃`,
          expression: 'happy',
        };
    }
  }

  // 6. Multiple urgent / high priority tasks
  if (urgentTasks.length >= 2) {
    switch (personality) {
      case 'divertido':
        return {
          text: `Eita, hoje o dia tá bem movimentado! Temos ${urgentTasks.length} tarefas importantes. Quer começar pela mais urgente?`,
          expression: 'thinking',
        };
      case 'profissional':
        return {
          text: `Identifiquei ${urgentTasks.length} prioridades altas para hoje. Sugiro iniciar pela de maior impacto.`,
          expression: 'thinking',
        };
      case 'motivador':
        return {
          text: `Desafios grandes pela frente hoje! ${urgentTasks.length} tarefas de alta prioridade. Vamos com tudo! 💥`,
          expression: 'excited',
        };
      case 'tranquilo':
        return {
          text: `O dia tem atividades importantes, mas vamos dar um passo de cada vez com foco e tranquilidade. 🌿`,
          expression: 'neutral',
        };
    }
  }

  // 7. No tasks at all
  if (totalCount === 0) {
    switch (personality) {
      case 'divertido':
        return {
          text: `Seu dia está totalmente livre por enquanto! 🏖️ Que tal relaxar ou tocar no botão "+" para adicionar algo?`,
          expression: 'happy',
        };
      case 'profissional':
        return {
          text: `Nenhum compromisso agendado para esta data. Utilize o botão de adicionar para planejar suas atividades.`,
          expression: 'neutral',
        };
      case 'motivador':
        return {
          text: `Uma tela em branco cheia de oportunidades! O que vamos construir e conquistar hoje, ${userName}? ✨`,
          expression: 'excited',
        };
      case 'tranquilo':
        return {
          text: `Um dia sereno e sem pendências. Aproveite o tempo para cuidar de você e relaxar. 🌸`,
          expression: 'happy',
        };
    }
  }

  // 8. Standard Day Greeting with count
  switch (personality) {
    case 'divertido':
      return {
        text: `${greeting}, ${userName}! ☀️ Temos ${pendingTasks.length} ${pendingTasks.length === 1 ? 'coisa' : 'coisas'} para fazer hoje. Vamos nessa?`,
        expression: 'happy',
      };
    case 'profissional':
      return {
        text: `${greeting}, ${userName}. Você possui ${pendingTasks.length} ${pendingTasks.length === 1 ? 'atividade programada' : 'atividades programadas'} para o dia.`,
        expression: 'neutral',
      };
    case 'motivador':
      return {
        text: `${greeting}, ${userName}! 🔥 Mais um dia para brilhar com ${pendingTasks.length} metas a cumprir. Vamos juntos!`,
        expression: 'excited',
      };
    case 'tranquilo':
      return {
        text: `${greeting}, ${userName}. 🌿 Temos ${pendingTasks.length} tarefas hoje. Vamos fazer tudo com harmonia e foco.`,
        expression: 'happy',
      };
  }
}

export function getNinoInteractiveQuote(personality: NinoPersonality, userName: string): NinoDialogue {
  const funQuotes: NinoDialogue[] = [
    { text: `Sabia que você fica 10x mais produtivo quando bebe água? 💧 Dá um gole aí!`, expression: 'happy' },
    { text: `Eu sou o Polaris, seu companheiro de jornada! Toca aqui se você vai arrasar hoje! ✋`, expression: 'excited' },
    { text: `Se uma tarefa parecer muito grande, divide ela em pedacinhos menores! Funciona que é uma beleza! 🍰`, expression: 'thinking' },
    { text: `Estou sempre de olho na sua agenda para não deixar você perder nada! 👀`, expression: 'happy' },
    { text: `Quem tem foco chega onde quiser! E com a minha ajuda, chega mais rápido! 🚀`, expression: 'proud' },
  ];

  const profQuotes: NinoDialogue[] = [
    { text: `Dica de gestão de tempo: utilize blocos de foco de 25 minutos (Pomodoro) para maior rendimento.`, expression: 'thinking' },
    { text: `Organização consistente reduz o estresse diário em até 40%. Estamos no caminho certo.`, expression: 'proud' },
    { text: `Priorize tarefas de alto impacto no início do seu período mais produtivo do dia.`, expression: 'neutral' },
    { text: `Sua agenda é sua bússola diária. Mantenha os prazos atualizados para máxima clareza.`, expression: 'happy' },
  ];

  const motQuotes: NinoDialogue[] = [
    { text: `Cada tarefa concluída é um tijolo no castelo dos seus sonhos! Não pare! 🏰🔥`, expression: 'excited' },
    { text: `Você é capaz de muito mais do que imagina, ${userName}! Acredite no seu potencial! ⚡`, expression: 'proud' },
    { text: `O segredo do sucesso é a constância nos pequenos passos de cada dia! 🌟`, expression: 'celebrating' },
    { text: `Dias organizados geram semanas vitoriosas! Vamos com força total! 🚀`, expression: 'excited' },
  ];

  const tranqQuotes: NinoDialogue[] = [
    { text: `Puxe o ar fundo pelo nariz... segure... e solte devagar. Sinta o momento presente. 🍃`, expression: 'happy' },
    { text: `Você não precisa fazer tudo de uma vez. O importante é o equilíbrio e a presença. 🌸`, expression: 'neutral' },
    { text: `Lembre-se de fazer pequenas pausas para esticar o corpo e descansar os olhos. 🌿`, expression: 'happy' },
    { text: `A produtividade saudável respeita o seu ritmo e cuida da sua mente. ☕`, expression: 'proud' },
  ];

  const pool = personality === 'divertido' 
    ? funQuotes 
    : personality === 'profissional' 
    ? profQuotes 
    : personality === 'motivador' 
    ? motQuotes 
    : tranqQuotes;

  const random = pool[Math.floor(Math.random() * pool.length)];
  return random;
}

export interface PolarisFocusStatus {
  taskTitle: string;
  userName: string;
  progressPercent: number; // 0 to 100
  secondsRemaining: number;
  isPaused: boolean;
  isCompleted: boolean;
}

export function getPolarisFocusMessage(status: PolarisFocusStatus): { text: string; expression: NinoExpression } {
  const { taskTitle, userName, progressPercent, isPaused, isCompleted } = status;

  if (isCompleted) {
    const completeMessages = [
      { text: `Fantástico, ${userName}! ✨ Você manteve o foco total e brilhou como uma verdadeira estrela!`, expression: 'celebrating' as NinoExpression },
      { text: `Missão cumprida em "${taskTitle}"! 🏆 Sua dedicação foi impecável!`, expression: 'proud' as NinoExpression },
      { text: `Sessão concluída com maestria! Que orgulho de você, ${userName}! 🌟`, expression: 'celebrating' as NinoExpression },
    ];
    return completeMessages[Math.floor(Math.random() * completeMessages.length)];
  }

  if (isPaused) {
    const pauseMessages = [
      { text: `Pausa estratégica! Respire fundo, tome uma água e volte quando estiver pronto para "${taskTitle}". 💧`, expression: 'thinking' as NinoExpression },
      { text: `Estou guardando seu foco com carinho. Quando quiser continuar, é só apertar o play! ⏸️✨`, expression: 'happy' as NinoExpression },
    ];
    return pauseMessages[Math.floor(Math.random() * pauseMessages.length)];
  }

  if (progressPercent >= 85) {
    const sprintMessages = [
      { text: `Reta final para finalizar "${taskTitle}"! Falta muito pouco, mantenha essa energia máxima! 🔥`, expression: 'excited' as NinoExpression },
      { text: `Últimos minutos, ${userName}! Você está quase lá, continue firme e focado! ⚡`, expression: 'proud' as NinoExpression },
      { text: `Concentração total agora! A sensação de dever cumprido já está logo ali! 🎯`, expression: 'excited' as NinoExpression },
    ];
    return sprintMessages[Math.floor(Math.random() * sprintMessages.length)];
  }

  if (progressPercent >= 50) {
    const midMessages = [
      { text: `Mais da metade do caminho percorrido em "${taskTitle}"! Seu ritmo está excelente! 🚀`, expression: 'happy' as NinoExpression },
      { text: `Atenção plena, ${userName}! Deixe as distrações de lado e continue brilhando. ✨`, expression: 'proud' as NinoExpression },
      { text: `Você está na zona de hiperfoco! Nada pode te parar agora! 🌌`, expression: 'excited' as NinoExpression },
    ];
    return midMessages[Math.floor(Math.random() * midMessages.length)];
  }

  if (progressPercent >= 20) {
    const buildingMessages = [
      { text: `Muito bem, ${userName}! Você já engrenou no fluxo de "${taskTitle}". Mantenha o compasso! 🧭`, expression: 'happy' as NinoExpression },
      { text: `Silenciamos todas as distrações para você. Sinta a tranquilidade de focar em uma coisa por vez. 🛡️`, expression: 'proud' as NinoExpression },
      { text: `Estou aqui ao seu lado te acompanhando em cada passo. Vamos juntos! ⭐`, expression: 'happy' as NinoExpression },
    ];
    return buildingMessages[Math.floor(Math.random() * buildingMessages.length)];
  }

  // Beginning (0-20%)
  const startMessages = [
    { text: `Olá, ${userName}! Eu sou o Polaris, seu guardião do foco. Vamos mergulhar em "${taskTitle}" agora! ✨`, expression: 'excited' as NinoExpression },
    { text: `Modo Silencioso ativado: notificações pausadas. É a sua hora de se concentrar em "${taskTitle}"! 🛡️`, expression: 'happy' as NinoExpression },
    { text: `Respire fundo, conecte-se com sua intenção e vamos fazer acontecer! 🚀`, expression: 'proud' as NinoExpression },
  ];
  return startMessages[Math.floor(Math.random() * startMessages.length)];
}

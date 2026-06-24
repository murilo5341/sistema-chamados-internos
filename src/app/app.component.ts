import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Status = 'NEW' | 'READ' | 'PENDING' | 'COMPLETED' | 'NOT_APPLICABLE';
type Urgency = 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';
type TicketView = 'inbox' | 'pending' | 'completed' | 'notApplicable' | 'sent';
type ViewKey = TicketView | 'newTicket' | 'notifications' | 'account';
type AccountPanel = 'perfil' | 'notificacoes' | 'seguranca' | 'aparencia';

interface Ticket {
  number: number;
  title: string;
  employeeName: string;
  originDepartment: string;
  targetDepartment: string;
  description: string;
  urgency: Urgency;
  status: Status;
  createdAt: string;
  updatedAt: string;
  attachments: string[];
  history: string[];
  resolutionDescription?: string;
}

interface NotificationItem {
  id: number;
  ticketNumber: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  @ViewChild('attachmentsInput') private attachmentsInput?: ElementRef<HTMLInputElement>;
  @ViewChild('loginCard') private loginCard?: ElementRef<HTMLElement>;
  @ViewChild('loginPassInput') private loginPassInput?: ElementRef<HTMLInputElement>;
  @ViewChild('loginUserInput') private loginUserInput?: ElementRef<HTMLInputElement>;

  readonly statusLabels: Record<Status, string> = {
    NEW: 'Novo',
    READ: 'Lido',
    PENDING: 'Pendente',
    COMPLETED: 'Concluido',
    NOT_APPLICABLE: 'Nao cabivel'
  };

  readonly urgencyLabels: Record<Urgency, string> = {
    LOW: 'Baixo',
    MODERATE: 'Moderado',
    HIGH: 'Alta',
    URGENT: 'Urgente'
  };

  readonly navItems: Array<{ key: ViewKey; label: string; icon: string }> = [
    { key: 'inbox', label: 'Recebidos', icon: 'inbox' },
    { key: 'pending', label: 'Pendentes', icon: 'schedule' },
    { key: 'completed', label: 'Concluidos', icon: 'check_circle' },
    { key: 'notApplicable', label: 'Nao cabiveis', icon: 'block' },
    { key: 'sent', label: 'Enviados', icon: 'send' },
    { key: 'notifications', label: 'Atualizacoes', icon: 'notifications' }
  ];

  readonly accountPanels: Array<{ key: AccountPanel; label: string; icon: string }> = [
    { key: 'perfil', label: 'Perfil', icon: 'person' },
    { key: 'notificacoes', label: 'Notificacoes', icon: 'notifications' },
    { key: 'seguranca', label: 'Seguranca', icon: 'lock' },
    { key: 'aparencia', label: 'Aparencia', icon: 'palette' }
  ];

  readonly targetDepartments = ['TI', 'RH', 'Compras', 'Faturamento', 'Marketing', 'Producao'];
  readonly currentUser = 'Marina Costa';
  readonly currentDepartment = 'Financeiro';

  loggedIn = false;
  darkTheme = false;
  loginUser = '';
  loginPass = '';
  activeView: ViewKey = 'inbox';
  activeAccountPanel: AccountPanel = 'perfil';
  selectedNumber = 1024;
  searchTerm = '';
  attachments: File[] = [];
  draggingFiles = false;
  pendingCompleteNumber: number | null = null;
  resolutionDialogOpen = false;
  resolutionInput = '';

  newTicket: { title: string; targetDepartment: string; urgency: Urgency; description: string } = {
    title: '',
    targetDepartment: 'TI',
    urgency: 'MODERATE',
    description: ''
  };

  tickets: Ticket[] = [
    {
      number: 1024,
      title: 'Divergencia no fechamento de caixa',
      employeeName: 'Camila Rocha',
      originDepartment: 'Faturamento',
      targetDepartment: 'Financeiro',
      description: 'O valor consolidado do fechamento nao bate com o relatorio emitido no fim do expediente. Anexei o print da tela e a planilha usada na conferencia.',
      urgency: 'HIGH',
      status: 'NEW',
      createdAt: 'Hoje, 08:42',
      updatedAt: 'Hoje, 08:42',
      attachments: ['print-fechamento.png', 'conferencia-caixa.xlsx'],
      history: ['Chamado aberto por Camila Rocha para Financeiro.']
    },
    {
      number: 1023,
      title: 'Aprovacao de compra emergencial',
      employeeName: 'Rafael Mendes',
      originDepartment: 'Producao',
      targetDepartment: 'Financeiro',
      description: 'Precisamos de aprovacao para compra emergencial de insumos. A producao fica parada se nao houver confirmacao ainda hoje.',
      urgency: 'URGENT',
      status: 'PENDING',
      createdAt: 'Ontem, 16:18',
      updatedAt: 'Hoje, 09:05',
      attachments: ['orcamento-fornecedor.pdf'],
      history: [
        'Chamado aberto por Rafael Mendes para Financeiro.',
        'Marina Costa marcou o chamado como lido.',
        'Marina Costa marcou o chamado como pendente: aguardando validacao da diretoria.'
      ]
    },
    {
      number: 1021,
      title: 'Solicitacao de reembolso de viagem',
      employeeName: 'Bruna Lima',
      originDepartment: 'Marketing',
      targetDepartment: 'Financeiro',
      description: 'Enviei os comprovantes da viagem de prospeccao e preciso confirmar o prazo para reembolso.',
      urgency: 'MODERATE',
      status: 'READ',
      createdAt: 'Segunda, 10:20',
      updatedAt: 'Segunda, 11:04',
      attachments: ['recibos.pdf'],
      history: ['Chamado aberto por Bruna Lima para Financeiro.', 'Lucas Almeida marcou o chamado como lido.']
    },
    {
      number: 1018,
      title: 'Cadastro bancario atualizado',
      employeeName: 'Pedro Martins',
      originDepartment: 'RH',
      targetDepartment: 'Financeiro',
      description: 'Funcionario alterou conta bancaria para pagamento. Seguem comprovantes para conferencia.',
      urgency: 'LOW',
      status: 'COMPLETED',
      createdAt: '20/06, 14:30',
      updatedAt: '21/06, 09:12',
      attachments: ['comprovante-conta.pdf'],
      resolutionDescription: 'Dados bancarios conferidos e atualizados no cadastro financeiro.',
      history: [
        'Chamado aberto por Pedro Martins para Financeiro.',
        'Marina Costa marcou o chamado como lido.',
        'Marina Costa concluiu o chamado: dados bancarios conferidos e atualizados.'
      ]
    },
    {
      number: 1016,
      title: 'Alteracao de verba de campanha',
      employeeName: 'Renata Torres',
      originDepartment: 'Marketing',
      targetDepartment: 'Financeiro',
      description: 'Solicito remanejamento de verba entre duas campanhas ativas.',
      urgency: 'MODERATE',
      status: 'NOT_APPLICABLE',
      createdAt: '19/06, 15:00',
      updatedAt: '19/06, 16:22',
      attachments: [],
      history: [
        'Chamado aberto por Renata Torres para Financeiro.',
        'Lucas Almeida marcou o chamado como lido.',
        'Lucas Almeida marcou como nao cabivel: precisa de aprovacao formal da diretoria antes do financeiro atuar.'
      ]
    },
    {
      number: 1009,
      title: 'Liberacao de acesso ao portal de notas',
      employeeName: 'Marina Costa',
      originDepartment: 'Financeiro',
      targetDepartment: 'TI',
      description: 'Preciso de acesso ao portal de notas para validar documentos recebidos nesta semana.',
      urgency: 'HIGH',
      status: 'COMPLETED',
      createdAt: '18/06, 09:48',
      updatedAt: '18/06, 11:10',
      attachments: ['erro-acesso.png'],
      resolutionDescription: 'Perfil de acesso atualizado no portal e validado com a usuaria solicitante.',
      history: [
        'Chamado aberto por Marina Costa para TI.',
        'TI marcou o chamado como lido.',
        'TI concluiu o chamado: perfil de acesso atualizado.'
      ]
    }
  ];

  notifications: NotificationItem[] = [
    {
      id: 1,
      ticketNumber: 1009,
      title: 'Chamado concluido',
      message: 'TI concluiu seu chamado "Liberacao de acesso ao portal de notas".',
      read: false,
      createdAt: '18/06, 11:10'
    },
    {
      id: 2,
      ticketNumber: 1012,
      title: 'Chamado marcado como pendente',
      message: 'Compras marcou seu chamado como pendente e adicionou uma observacao.',
      read: false,
      createdAt: '17/06, 15:30'
    },
    {
      id: 3,
      ticketNumber: 1003,
      title: 'Chamado lido',
      message: 'RH marcou seu chamado como lido.',
      read: true,
      createdAt: '14/06, 10:06'
    }
  ];

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  login(): void {
    const user = this.loginUser.trim().toLowerCase();

    if (user === 'admin' && this.loginPass === 'admin123') {
      this.loggedIn = true;
      this.loginPass = '';
      this.setView('inbox');
      return;
    }

    const card = this.loginCard?.nativeElement;
    if (card?.animate) {
      card.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-7px)' },
          { transform: 'translateX(7px)' },
          { transform: 'translateX(-4px)' },
          { transform: 'translateX(0)' }
        ],
        { duration: 320, easing: 'ease-in-out' }
      );
    }

    this.loginPass = '';
    window.setTimeout(() => this.loginPassInput?.nativeElement.focus());
  }

  logout(): void {
    this.loggedIn = false;
    this.activeView = 'inbox';
    this.loginPass = '';
    window.setTimeout(() => this.loginUserInput?.nativeElement.focus());
  }

  applyTheme(dark: boolean): void {
    this.darkTheme = dark;
    this.document.body.classList.toggle('dark-theme', dark);
  }

  setView(view: ViewKey, keepSelection = false): void {
    this.activeView = view;

    if (!this.isNonTicketView(view) && !keepSelection) {
      const first = this.visibleTickets()[0];
      if (first) {
        this.selectedNumber = first.number;
      }
    }
  }

  isNonTicketView(view: ViewKey): boolean {
    return view === 'newTicket' || view === 'notifications' || view === 'account';
  }

  visibleTickets(): Ticket[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.tickets
      .filter((ticket) => this.belongs(ticket, this.activeView))
      .filter((ticket) => {
        if (!term) {
          return true;
        }

        return [
          ticket.number,
          ticket.title,
          ticket.employeeName,
          ticket.originDepartment,
          ticket.targetDepartment,
          this.statusLabels[ticket.status],
          this.urgencyLabels[ticket.urgency]
        ]
          .join(' ')
          .toLowerCase()
          .includes(term);
      });
  }

  selectedTicket(): Ticket | undefined {
    const list = this.visibleTickets();
    return list.find((ticket) => ticket.number === this.selectedNumber) ?? list[0];
  }

  selectTicket(number: number): void {
    this.selectedNumber = number;
  }

  currentViewTitle(): string {
    return this.navItems.find((item) => item.key === this.activeView)?.label ?? 'Chamados';
  }

  unreadCount(): number {
    return this.notifications.filter((notification) => !notification.read).length;
  }

  metrics(): Array<{ label: string; value: number; className: string }> {
    return [
      {
        label: 'Recebidos',
        value: this.tickets.filter((ticket) => ['NEW', 'READ'].includes(ticket.status) && ticket.targetDepartment === this.currentDepartment).length,
        className: ''
      },
      {
        label: 'Pendentes',
        value: this.tickets.filter((ticket) => ticket.status === 'PENDING' && ticket.targetDepartment === this.currentDepartment).length,
        className: ''
      },
      {
        label: 'Urgentes',
        value: this.tickets.filter((ticket) => ticket.urgency === 'URGENT').length,
        className: 'urgent'
      },
      {
        label: 'Concluidos',
        value: this.tickets.filter((ticket) => ticket.status === 'COMPLETED' && ticket.targetDepartment === this.currentDepartment).length,
        className: ''
      }
    ];
  }

  statusClass(status: Status): string {
    return status.toLowerCase();
  }

  urgencyClass(urgency: Urgency): string {
    return urgency.toLowerCase();
  }

  showActions(ticket: Ticket): boolean {
    return ticket.targetDepartment === this.currentDepartment && (ticket.status === 'NEW' || ticket.status === 'READ');
  }

  markRead(ticket: Ticket): void {
    ticket.status = 'READ';
    ticket.updatedAt = 'Agora';
    ticket.history.push('Marina Costa marcou o chamado como lido.');
    this.notify(ticket, 'Chamado marcado como lido', 'Financeiro marcou seu chamado como lido.');
  }

  markPending(ticket: Ticket): void {
    ticket.status = 'PENDING';
    ticket.updatedAt = 'Agora';
    ticket.history.push('Marina Costa marcou o chamado como pendente.');
    this.notify(ticket, 'Chamado pendente', 'Financeiro marcou seu chamado como pendente.');
    this.setView('pending');
  }

  markNotApplicable(ticket: Ticket): void {
    ticket.status = 'NOT_APPLICABLE';
    ticket.updatedAt = 'Agora';
    ticket.history.push('Marina Costa marcou como nao cabivel de solucao no momento.');
    this.notify(ticket, 'Chamado nao cabivel', 'Financeiro marcou seu chamado como nao cabivel no momento.');
    this.setView('notApplicable');
  }

  openComplete(ticket: Ticket): void {
    this.pendingCompleteNumber = ticket.number;
    this.resolutionInput = '';
    this.resolutionDialogOpen = true;
  }

  cancelResolution(): void {
    this.resolutionDialogOpen = false;
    this.pendingCompleteNumber = null;
  }

  confirmResolution(): void {
    const ticket = this.tickets.find((item) => item.number === this.pendingCompleteNumber);
    const resolution = this.resolutionInput.trim();

    if (!ticket || resolution.length < 10) {
      return;
    }

    ticket.status = 'COMPLETED';
    ticket.updatedAt = 'Agora';
    ticket.resolutionDescription = resolution;
    ticket.history.push(`Marina Costa concluiu o chamado: ${resolution}`);
    this.notify(ticket, 'Chamado concluido', 'Financeiro concluiu seu chamado e descreveu a solucao.');

    this.resolutionDialogOpen = false;
    this.pendingCompleteNumber = null;
    this.setView('completed');
  }

  createTicket(): void {
    const nextNumber = Math.max(...this.tickets.map((ticket) => ticket.number)) + 1;
    const ticket: Ticket = {
      number: nextNumber,
      title: this.newTicket.title || 'Novo chamado sem titulo',
      employeeName: this.currentUser,
      originDepartment: this.currentDepartment,
      targetDepartment: this.newTicket.targetDepartment,
      description: this.newTicket.description || 'Descricao a preencher.',
      urgency: this.newTicket.urgency,
      status: 'NEW',
      createdAt: 'Agora',
      updatedAt: 'Agora',
      attachments: this.attachments.map((file) => file.name),
      history: [`Chamado aberto por Marina Costa para ${this.newTicket.targetDepartment}.`]
    };

    this.tickets.unshift(ticket);
    this.selectedNumber = ticket.number;
    this.resetNewTicket();
    this.setView('sent', true);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.attachments = Array.from(input.files ?? []);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.draggingFiles = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.draggingFiles = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.draggingFiles = false;

    if (!event.dataTransfer?.files.length) {
      return;
    }

    this.attachments = Array.from(event.dataTransfer.files);

    if (this.attachmentsInput) {
      this.attachmentsInput.nativeElement.files = event.dataTransfer.files;
    }
  }

  openNotification(notification: NotificationItem): void {
    notification.read = true;
    const ticket = this.tickets.find((item) => item.number === notification.ticketNumber);

    if (ticket) {
      this.selectedNumber = ticket.number;
      this.setView('sent', true);
    }
  }

  private belongs(ticket: Ticket, view: ViewKey): boolean {
    if (view === 'inbox') {
      return ticket.targetDepartment === this.currentDepartment && ['NEW', 'READ'].includes(ticket.status);
    }

    if (view === 'pending') {
      return ticket.targetDepartment === this.currentDepartment && ticket.status === 'PENDING';
    }

    if (view === 'completed') {
      return ticket.targetDepartment === this.currentDepartment && ticket.status === 'COMPLETED';
    }

    if (view === 'notApplicable') {
      return ticket.targetDepartment === this.currentDepartment && ticket.status === 'NOT_APPLICABLE';
    }

    if (view === 'sent') {
      return ticket.employeeName === this.currentUser;
    }

    return false;
  }

  private notify(ticket: Ticket, title: string, message: string): void {
    this.notifications.unshift({
      id: Date.now(),
      ticketNumber: ticket.number,
      title,
      message: `${message} Chamado #${ticket.number}: "${ticket.title}".`,
      read: false,
      createdAt: 'Agora'
    });
  }

  private resetNewTicket(): void {
    this.newTicket = {
      title: '',
      targetDepartment: 'TI',
      urgency: 'MODERATE',
      description: ''
    };
    this.attachments = [];
    this.draggingFiles = false;

    if (this.attachmentsInput) {
      this.attachmentsInput.nativeElement.value = '';
    }
  }
}

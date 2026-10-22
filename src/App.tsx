import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import './index.css';

import {
  createBackup,
  getAllInspections,
  removeInspection,
  restoreBackup,
  saveInspection,
  type Answer,
  type AnswerValue,
  type BackupFile,
  type Inspection,
  type InspectionStatus,
} from './db';

import {
  generateInspectionPdf,
  type PdfSection,
} from './pdf';

type Screen = 'HOME' | 'FORM';

type Question = {
  id: string;
  number: string;
  text: string;
};

const LEGACY_STORAGE_KEY =
  'spld-inspections';

const STEP_TITLES = [
  'Identificação',
  'Cadastro de Contratantes',
  'Registro de Operações',
  'Política de PLD/FT',
  'Efetivo Cumprimento',
  'Revisão',
];

/* =========================================================
   SEÇÃO A
   ========================================================= */

const legalEntityQuestions: Question[] = [
  {
    id: 'a-pj-1',
    number: '1',
    text: 'Nome da empresa (razão social)',
  },
  {
    id: 'a-pj-2',
    number: '2',
    text: 'Número de inscrição no CNPJ da matriz',
  },
  {
    id: 'a-pj-3',
    number: '3',
    text: 'Endereço completo',
  },
  {
    id: 'a-pj-4',
    number: '4',
    text: 'Atividade principal desenvolvida',
  },
  {
    id: 'a-pj-5',
    number: '5',
    text: 'Nome das pessoas autorizadas a representá-la e dos proprietários',
  },
  {
    id: 'a-pj-6',
    number: '6',
    text: 'Identificação completa das pessoas autorizadas a representá-la e dos proprietários',
  },
  {
    id: 'a-pj-7',
    number: '7',
    text: 'Nome fantasia',
  },
  {
    id: 'a-pj-8',
    number: '8',
    text: 'Telefone e e-mail',
  },
  {
    id: 'a-pj-9',
    number: '9',
    text: 'Capital social da empresa',
  },
];

const individualQuestions: Question[] = [
  {
    id: 'a-pf-1',
    number: '1',
    text: 'Nome',
  },
  {
    id: 'a-pf-2',
    number: '2',
    text: 'Número de inscrição no CPF e RG ou, se estrangeiro não inscrito no CPF, passaporte ou outro documento oficial que o identifique',
  },
  {
    id: 'a-pf-3',
    number: '3',
    text: 'Endereço residencial e comercial completo',
  },
  {
    id: 'a-pf-4',
    number: '4',
    text: 'Quando se tratar de estrangeiro não inscrito no CPF, além do nome e endereço completos, informar filiação, data de nascimento, país de origem e atividade desenvolvida',
  },
  {
    id: 'a-pf-5',
    number: '5',
    text: 'Se é enquadrado como PEP',
  },
  {
    id: 'a-pf-6',
    number: '6',
    text: 'Telefone e e-mail',
  },
];

/* =========================================================
   SEÇÃO B
   ========================================================= */

const sectionBQuestions: Question[] = [
  {
    id: 'b-1',
    number: '1',
    text: 'Identificação do contratante do serviço de transporte ou, quando for o caso, do custodiante de bens e valores',
  },
  {
    id: 'b-2',
    number: '2',
    text: 'Especificação do valor e natureza do ativo transportado ou temporariamente custodiado',
  },
  {
    id: 'b-3',
    number: '3',
    text: 'Descrição pormenorizada dos serviços prestados ou das operações realizadas',
  },
  {
    id: 'b-4',
    number: '4',
    text: 'Identificação do destinatário e do endereço de entrega, inclusive quando houver mais de um destinatário',
  },
  {
    id: 'b-5',
    number: '5',
    text: 'Data da coleta e da entrega ou prazo de custódia, que deve ser temporária e apenas suficiente para o transporte',
  },
  {
    id: 'b-6',
    number: '6',
    text: 'Forma e meio de pagamento',
  },
  {
    id: 'b-7',
    number: '7',
    text: 'Registro fundamentado da decisão de proceder, ou não, às comunicações de que trata o art. 5º, quando for o caso',
  },
  {
    id: 'b-8',
    number: '8',
    text: 'Identificação do destinatário e do endereço da entrega, bem como de eventuais intermediários',
  },
  {
    id: 'b-9',
    number: '9',
    text: 'Valor do serviço contratado, forma e meio de pagamento',
  },
  {
    id: 'b-10',
    number: '10',
    text: 'Identificação completa da pessoa responsável pelo recebimento do produto transportado, inclusive com protocolo de recebimento',
  },
  {
    id: 'b-11',
    number: '11',
    text: 'Identificação do beneficiário final do serviço contratado e registro do seu endereço completo',
  },
];

/* =========================================================
   SEÇÃO C
   ========================================================= */

const sectionCQuestions: Question[] = [
  {
    id: 'c-1',
    number: '1',
    text: 'Verificou-se a existência de política de PLD/FT formalizada expressamente, com aprovação e assinatura do detentor da autoridade máxima de gestão na empresa? (art. 4º, § 1º, IN nº 196/2021-DG/PF)',
  },
  {
    id: 'c-2',
    number: '2',
    text: 'Considerado o porte da empresa transportadora, a gestão do cliente e de operações suspeitas é efetuada por pessoa dedicada exclusivamente a esta função? Qualificar o responsável e funções que eventualmente acumula.',
  },
  {
    id: 'c-3',
    number: '3',
    text: 'A empresa realiza avaliação interna de riscos de lavagem de dinheiro e financiamento do terrorismo documentada, considerando, no mínimo, os perfis de risco definidos no art. 4º, VI, da IN nº 196/2021-DG/PF?',
  },
  {
    id: 'c-4',
    number: '4',
    text: 'A fim de conhecer seus clientes, a empresa transportadora efetua pesquisas, ao menos em fontes abertas, sobre a existência de indiciamento policial, condenação criminal, processo ou operação policial em que o proponente, contratante, empresa cliente ou seus sócios-administradores e majoritários sejam mencionados como alvos ou envolvidos? (art. 4º, VII, da IN nº 196/2021-DG/PF)',
  },
  {
    id: 'c-5',
    number: '5',
    text: 'A empresa transportadora efetua pesquisas para obtenção de informações sobre o propósito e a natureza dos serviços profissionais, identificação do beneficiário final e identificação de operações ou propostas suspeitas ou de comunicação obrigatória? (art. 4º, I, II e III, da IN nº 196/2021-DG/PF)',
  },
  {
    id: 'c-6',
    number: '6',
    text: 'Verificou-se a existência de canal de comunicação de todos os setores da empresa com o responsável pela prevenção à lavagem de dinheiro? (art. 4º, V, “a”, da IN nº 196/2021-DG/PF)',
  },
  {
    id: 'c-7',
    number: '7',
    text: 'Verificou-se a existência de canais de comunicação dedicados ao recebimento de denúncias anônimas formuladas por seus funcionários e/ou colaboradores? (art. 4º, V, “b”, da IN nº 196/2021-DG/PF)',
  },
  {
    id: 'c-8',
    number: '8',
    text: 'Constatou-se, por meio de entrevistas aleatórias junto aos empregados da empresa, que houve treinamentos em relação à política implantada? (art. 4º, §1º, I, da IN nº 196/2021-DG/PF)',
  },
  {
    id: 'c-9',
    number: '9',
    text: 'Constatou-se, por meio de entrevistas aleatórias junto aos empregados da empresa, que a política implantada faz parte dos procedimentos da empresa de forma contínua? (art. 4º, §1º, II, da IN nº 196/2021-DG/PF)',
  },
];

/* =========================================================
   SEÇÃO D
   ========================================================= */

const sectionDQuestions: Question[] = [
  {
    id: 'd-1',
    number: '1',
    text: 'Todas as propostas recebidas pela transportadora são registradas em sistema informatizado e mantidas pelo prazo legal, ainda que haja desistência da proponente ou que a transportadora decida não efetuar o serviço por qualquer motivo? (art. 3º, §1º, da IN nº 196/2021-DG/PF)',
  },
  {
    id: 'd-1-1',
    number: '1.1',
    text: 'É possível pesquisar no sistema informatizado, e apresentar à fiscalização, a relação de propostas cujo serviço não foi efetivado?',
  },
  {
    id: 'd-1-2',
    number: '1.2',
    text: 'Há campo específico em tais casos, onde esteja o registro fundamentado do motivo da não efetuação do negócio?',
  },
  {
    id: 'd-1-3',
    number: '1.3',
    text: 'Há campo específico em tais casos, onde esteja o registro fundamentado do motivo da comunicação ou não da proposta ao COAF?',
  },
  {
    id: 'd-2-1',
    number: '2.1',
    text: 'É possível pesquisar no sistema informatizado, e apresentar à fiscalização, a relação de empresas que somaram R$ 100.000,00 em operações no período indicado?',
  },
  {
    id: 'd-3',
    number: '3',
    text: 'O sistema de registro de operações, ou de execução de transporte de valores, possui campo para que os executores do transporte registrem situações potencialmente suspeitas por eles presenciadas?',
  },
  {
    id: 'd-4',
    number: '4',
    text: 'O sistema informatizado da transportadora de valores permite que o digitador ou operador aponte facilmente eventos ou situações consideradas suspeitas de prática de lavagem de dinheiro, como as descritas nos incisos I a XII do art. 6º da IN nº 196/2021-DG/PF?',
  },
  {
    id: 'd-5',
    number: '5',
    text: 'O sistema informatizado emite alertas automáticos de situações suspeitas indicadas e registradas por outro funcionário ou colaborador, via software próprio e/ou e-mail, ao responsável pela implementação da política de prevenção à lavagem de dinheiro?',
  },
];

const allQuestions = [
  ...legalEntityQuestions,
  ...individualQuestions,
  ...sectionBQuestions,
  ...sectionCQuestions,
  ...sectionDQuestions,
];
const pdfSections: PdfSection[] = [
  {
    title:
      'A. DO CADASTRO DE CONTRATANTES',
    subtitle:
      'Art. 2º da IN nº 196/2021-DG/PF',
    introduction:
      'Constatou-se, por amostragem, que a empresa especializada em transporte de valores possui cadastro das pessoas jurídicas e físicas contratantes contendo, no mínimo, as informações verificadas abaixo.',
    questions: [
      ...legalEntityQuestions,
      ...individualQuestions,
    ],
  },

  {
    title:
      'B. DO REGISTRO DE OPERAÇÕES',
    subtitle:
      'Art. 3º da IN nº 196/2021-DG/PF',
    introduction:
      'Constatou-se, por amostragem, que a empresa especializada em transporte de valores mantém o registro dos serviços prestados e das operações realizadas em nome de seus clientes.',
    questions:
      sectionBQuestions,
  },

  {
    title:
      'C. DA POLÍTICA DE PREVENÇÃO À LAVAGEM DE DINHEIRO',
    subtitle:
      'Art. 4º da IN nº 196/2021-DG/PF',
    introduction:
      'Verificação da política de prevenção à lavagem de dinheiro e ao financiamento do terrorismo adotada pela empresa.',
    questions:
      sectionCQuestions,
  },

  {
    title:
      'D. DO EFETIVO CUMPRIMENTO DA POLÍTICA DE PLD/FT',
    introduction:
      'Verificação dos procedimentos, registros e sistemas informatizados utilizados pela empresa.',
    questions:
      sectionDQuestions,
  },
];
/* =========================================================
   FUNÇÕES AUXILIARES
   ========================================================= */

function generateId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function createInspection(): Inspection {
  const now =
    new Date().toISOString();

  return {
    id: generateId(),

    companyName: '',
    cnpj: '',
    address: '',
    phone: '',
    inspectionDate: '',

    answers: {},

    status: 'DRAFT',

    createdAt: now,
    updatedAt: now,
  };
}

/*
 * Converte respostas criadas pela
 * versão antiga da aplicação.
 *
 * Antes:
 * pj-1
 * pf-1
 *
 * Agora:
 * a-pj-1
 * a-pf-1
 */

function migrateAnswerIds(
  inspection: Inspection,
): Inspection {
  const answers = {
    ...inspection.answers,
  };

  for (
    let index = 1;
    index <= 9;
    index++
  ) {
    const oldId =
      `pj-${index}`;

    const newId =
      `a-pj-${index}`;

    if (
      answers[oldId] &&
      !answers[newId]
    ) {
      answers[newId] =
        answers[oldId];
    }
  }

  for (
    let index = 1;
    index <= 6;
    index++
  ) {
    const oldId =
      `pf-${index}`;

    const newId =
      `a-pf-${index}`;

    if (
      answers[oldId] &&
      !answers[newId]
    ) {
      answers[newId] =
        answers[oldId];
    }
  }

  return {
    ...inspection,
    answers,
  };
}

/*
 * Migração automática do
 * localStorage para IndexedDB.
 */

async function migrateLegacyStorage() {
  try {
    const saved =
      localStorage.getItem(
        LEGACY_STORAGE_KEY,
      );

    if (!saved) {
      return;
    }

    const legacyInspections:
      Inspection[] =
      JSON.parse(saved);

    if (
      !Array.isArray(
        legacyInspections,
      )
    ) {
      return;
    }

    for (
      const inspection of
      legacyInspections
    ) {
      const migrated =
        migrateAnswerIds(
          inspection,
        );

      await saveInspection(
        migrated,
      );
    }

    /*
     * Só apagamos o armazenamento
     * antigo depois que a cópia foi
     * concluída.
     */

    localStorage.removeItem(
      LEGACY_STORAGE_KEY,
    );

    console.log(
      'Migração para IndexedDB concluída.',
    );
  } catch (error) {
    console.error(
      'Erro na migração do localStorage:',
      error,
    );
  }
}

/* =========================================================
   APLICAÇÃO
   ========================================================= */
   function App() {
    const [screen, setScreen] =
      useState<Screen>('HOME');
  
    const [
      inspections,
      setInspections,
    ] = useState<Inspection[]>([]);
  
    const [
      currentId,
      setCurrentId,
    ] = useState<string | null>(
      null,
    );
  
    const [
      currentStep,
      setCurrentStep,
    ] = useState(0);
  
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      lastSavedAt,
      setLastSavedAt,
    ] = useState<string | null>(
      null,
    );
  
    const backupInputRef =
      useRef<HTMLInputElement | null>(
        null,
      );
  
    const currentInspection =
      useMemo(
        () =>
          inspections.find(
            (inspection) =>
              inspection.id ===
              currentId,
          ) ?? null,
        [
          inspections,
          currentId,
        ],
      );
  
    const isReadOnly =
      currentInspection?.status ===
      'COMPLETED';

  /* =======================================================
     CARREGAMENTO INICIAL
     ======================================================= */

  useEffect(() => {
    async function initialize() {
      try {
        /*
         * Primeiro migramos possíveis
         * registros antigos.
         */

        await migrateLegacyStorage();

        /*
         * Depois carregamos tudo do
         * IndexedDB.
         */

        const stored =
          await getAllInspections();

        setInspections(
          stored.map(
            migrateAnswerIds,
          ),
        );
      } catch (error) {
        console.error(
          'Erro ao carregar vistorias:',
          error,
        );

        alert(
          'Não foi possível carregar o banco local.',
        );
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  /* =======================================================
     SALVAMENTO
     ======================================================= */

  async function persistInspection(
    inspection: Inspection,
  ) {
    try {
      await saveInspection(
        inspection,
      );

      setLastSavedAt(
        new Date().toLocaleTimeString(
          'pt-BR',
          {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          },
        ),
      );
    } catch (error) {
      console.error(
        'Erro ao salvar vistoria:',
        error,
      );

      alert(
        'Ocorreu um erro ao salvar a vistoria no dispositivo.',
      );
    }
  }

  async function startNewInspection() {
    const inspection =
      createInspection();

    try {
      await saveInspection(
        inspection,
      );

      setInspections(
        (current) => [
          inspection,
          ...current,
        ],
      );

      setCurrentId(
        inspection.id,
      );

      setCurrentStep(0);

      setScreen('FORM');

      setLastSavedAt(
        new Date().toLocaleTimeString(
          'pt-BR',
        ),
      );
    } catch (error) {
      console.error(error);

      alert(
        'Não foi possível criar a vistoria.',
      );
    }
  }

  function openInspection(
    id: string,
  ) {
    const inspection =
      inspections.find(
        (item) =>
          item.id === id,
      );

    setCurrentId(id);

    if (
      inspection?.status ===
      'COMPLETED'
    ) {
      setCurrentStep(5);
    } else {
      setCurrentStep(0);
    }

    setScreen('FORM');
  }

  function goHome() {
    setCurrentId(null);

    setCurrentStep(0);

    setScreen('HOME');
  }

  function updateInspection(
    updater: (
      inspection: Inspection,
    ) => Inspection,
  ) {
    if (!currentId) {
      return;
    }

    setInspections(
      (current) =>
        current.map(
          (inspection) => {
            if (
              inspection.id !==
              currentId
            ) {
              return inspection;
            }

            /*
             * Uma vistoria concluída
             * não pode ser alterada.
             */

            if (
              inspection.status ===
              'COMPLETED'
            ) {
              return inspection;
            }

            const updated =
              updater(
                inspection,
              );

            const finalInspection:
              Inspection = {
              ...updated,

              status:
                updated.status ===
                'DRAFT'
                  ? 'IN_PROGRESS'
                  : updated.status,

              updatedAt:
                new Date().toISOString(),
            };

            /*
             * Salva no IndexedDB.
             *
             * Não usamos await aqui
             * para não travar a digitação.
             */

            void persistInspection(
              finalInspection,
            );

            return finalInspection;
          },
        ),
    );
  }

  function updateCompanyField(
    field:
      | 'companyName'
      | 'cnpj'
      | 'address'
      | 'phone'
      | 'inspectionDate',
    value: string,
  ) {
    updateInspection(
      (inspection) => ({
        ...inspection,
        [field]: value,
      }),
    );
  }

  function updateAnswer(
    questionId: string,
    field: keyof Answer,
    value: string,
  ) {
    updateInspection(
      (inspection) => {
        const previousAnswer =
          inspection.answers[
            questionId
          ] ?? {
            value: '',
            observation: '',
          };

        return {
          ...inspection,

          answers: {
            ...inspection.answers,

            [questionId]: {
              value:
                field ===
                'value'
                  ? (value as AnswerValue)
                  : previousAnswer.value,

              observation:
                field ===
                'observation'
                  ? value
                  : previousAnswer.observation,
            },
          },
        };
      },
    );
  }

  async function deleteInspection(
    id: string,
  ) {
    const confirmed =
      window.confirm(
        'Deseja excluir esta vistoria?',
      );

    if (!confirmed) {
      return;
    }

    try {
      await removeInspection(id);

      setInspections(
        (current) =>
          current.filter(
            (inspection) =>
              inspection.id !==
              id,
          ),
      );
    } catch (error) {
      console.error(error);

      alert(
        'Não foi possível excluir a vistoria.',
      );
    }
  }

  async function finishInspection() {
    if (!currentInspection) {
      return;
    }

    if (
      !currentInspection
        .companyName
        .trim()
    ) {
      alert(
        'Informe a Razão Social antes de concluir a vistoria.',
      );

      setCurrentStep(0);

      return;
    }

    if (
      !currentInspection
        .inspectionDate
    ) {
      alert(
        'Informe a data da vistoria antes de concluir.',
      );

      setCurrentStep(0);

      return;
    }

    const unanswered =
      allQuestions.filter(
        (question) =>
          !currentInspection
            .answers[
            question.id
          ]?.value,
      );

    if (
      unanswered.length > 0
    ) {
      const continueAnyway =
        window.confirm(
          `Ainda existem ${unanswered.length} pergunta(s) sem resposta. Deseja concluir mesmo assim?`,
        );

      if (
        !continueAnyway
      ) {
        return;
      }
    }

    const confirmed =
      window.confirm(
        'Deseja realmente concluir esta vistoria? Após a conclusão, ela ficará disponível apenas para consulta.',
      );

    if (!confirmed) {
      return;
    }

    const completed:
      Inspection = {
      ...currentInspection,

      status: 'COMPLETED',

      updatedAt:
        new Date().toISOString(),
    };

    try {
      await saveInspection(
        completed,
      );

      setInspections(
        (current) =>
          current.map(
            (inspection) =>
              inspection.id ===
              completed.id
                ? completed
                : inspection,
          ),
      );

      alert(
        'Vistoria concluída com sucesso.',
      );

      goHome();
    } catch (error) {
      console.error(error);

      alert(
        'Não foi possível concluir a vistoria.',
      );
    }
  }async function exportBackup() {
    try {
      const backup =
        await createBackup();
  
      if (
        backup.inspections.length ===
        0
      ) {
        alert(
          'Não existem vistorias para exportar.',
        );
  
        return;
      }
  
      const json =
        JSON.stringify(
          backup,
          null,
          2,
        );
  
      const blob =
        new Blob(
          [json],
          {
            type: 'application/json',
          },
        );
  
      const url =
        URL.createObjectURL(
          blob,
        );
  
      const date =
        new Date()
          .toISOString()
          .slice(0, 10);
  
      const link =
        document.createElement(
          'a',
        );
  
      link.href = url;
  
      link.download =
        `spld-backup-${date}.json`;
  
      document.body.appendChild(
        link,
      );
  
      link.click();
  
      document.body.removeChild(
        link,
      );
  
      URL.revokeObjectURL(
        url,
      );
  
      alert(
        `Backup criado com sucesso.\n\n${backup.inspections.length} vistoria(s) exportada(s).`,
      );
    } catch (error) {
      console.error(
        'Erro ao exportar backup:',
        error,
      );
  
      alert(
        'Não foi possível gerar o backup.',
      );
    }
  }
  async function importBackup(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];
  
    if (!file) {
      return;
    }
  
    try {
      const text =
        await file.text();
  
      const backup =
        JSON.parse(
          text,
        ) as BackupFile;
  
      const confirmed =
        window.confirm(
          `Deseja importar o arquivo "${file.name}"?\n\nAs vistorias existentes não serão apagadas. Registros com o mesmo identificador serão atualizados.`,
        );
  
      if (!confirmed) {
        event.target.value = '';
  
        return;
      }
  
      const imported =
        await restoreBackup(
          backup,
        );
  
      /*
       * Recarrega a lista diretamente
       * do IndexedDB.
       */
  
      const updated =
        await getAllInspections();
  
      setInspections(
        updated,
      );
  
      alert(
        `Backup restaurado com sucesso.\n\n${imported} vistoria(s) processada(s).`,
      );
    } catch (error) {
      console.error(
        'Erro ao importar backup:',
        error,
      );
  
      alert(
        'O arquivo selecionado não é um backup válido do SPLD Vistoria.',
      );
    } finally {
      /*
       * Permite escolher novamente
       * o mesmo arquivo depois.
       */
  
      event.target.value = '';
    }
  }
  /* =======================================================
     PROGRESSO
     ======================================================= */

  function getAnsweredCount(
    inspection: Inspection,
  ) {
    return allQuestions.filter(
      (question) =>
        inspection.answers[
          question.id
        ]?.value,
    ).length;
  }

  function getProgress(
    inspection: Inspection,
  ) {
    const answered =
      getAnsweredCount(
        inspection,
      );

    return Math.round(
      (answered /
        allQuestions.length) *
        100,
    );
  }

  function getSectionProgress(
    inspection: Inspection,
    questions: Question[],
  ) {
    const answered =
      questions.filter(
        (question) =>
          inspection.answers[
            question.id
          ]?.value,
      ).length;

    return Math.round(
      (answered /
        questions.length) *
        100,
    );
  }

  function statusLabel(
    status: InspectionStatus,
  ) {
    switch (status) {
      case 'COMPLETED':
        return 'Concluída';

      case 'IN_PROGRESS':
        return 'Em andamento';

      default:
        return 'Rascunho';
    }
  }

  function formatDate(
    date: string,
  ) {
    if (!date) {
      return 'Data não informada';
    }

    return new Intl.DateTimeFormat(
      'pt-BR',
    ).format(
      new Date(
        `${date}T12:00:00`,
      ),
    );
  }
  async function downloadInspectionPdf() {
    if (!currentInspection) {
      return;
    }
  
    try {
      await generateInspectionPdf(
        currentInspection,
        pdfSections,
      );
    } catch (error) {
      console.error(
        'Erro ao gerar PDF:',
        error,
      );
  
      alert(
        'Não foi possível gerar o PDF da vistoria.',
      );
    }
  }

  /* =======================================================
     NAVEGAÇÃO
     ======================================================= */

  function nextStep() {
    if (
      currentStep <
      STEP_TITLES.length -
        1
    ) {
      setCurrentStep(
        (step) =>
          step + 1,
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  function previousStep() {
    if (
      currentStep > 0
    ) {
      setCurrentStep(
        (step) =>
          step - 1,
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  function goToStep(
    step: number,
  ) {
    setCurrentStep(step);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /* =======================================================
     COMPONENTE DE PERGUNTA
     ======================================================= */

  function renderQuestion(
    question: Question,
  ) {
    if (
      !currentInspection
    ) {
      return null;
    }

    const answer =
      currentInspection.answers[
        question.id
      ] ?? {
        value: '',
        observation: '',
      };

    return (
      <div
        className="question-card"
        key={question.id}
      >
        <div className="question-number">
          {question.number}
        </div>

        <div className="question-content">
          <p className="question-text">
            {question.text}
          </p>

          <div className="answer-buttons">
            <button
              type="button"
              disabled={
                isReadOnly
              }
              aria-pressed={
                answer.value ===
                'SIM'
              }
              className={
                answer.value ===
                'SIM'
                  ? 'answer answer-yes selected'
                  : 'answer answer-yes'
              }
              onClick={() =>
                updateAnswer(
                  question.id,
                  'value',
                  'SIM',
                )
              }
            >
              {answer.value ===
              'SIM'
                ? '✓ SIM'
                : 'SIM'}
            </button>

            <button
              type="button"
              disabled={
                isReadOnly
              }
              aria-pressed={
                answer.value ===
                'NAO'
              }
              className={
                answer.value ===
                'NAO'
                  ? 'answer answer-no selected'
                  : 'answer answer-no'
              }
              onClick={() =>
                updateAnswer(
                  question.id,
                  'value',
                  'NAO',
                )
              }
            >
              {answer.value ===
              'NAO'
                ? '✓ NÃO'
                : 'NÃO'}
            </button>
          </div>

          <label>
            Observação /
            Justificativa

            <textarea
              disabled={
                isReadOnly
              }
              value={
                answer.observation
              }
              onChange={(
                event,
              ) =>
                updateAnswer(
                  question.id,
                  'observation',
                  event.target
                    .value,
                )
              }
              placeholder="Digite uma observação ou justificativa, se necessário"
            />
          </label>
        </div>
      </div>
    );
  }

  function renderSectionQuestions(
    questions: Question[],
  ) {
    return (
      <div className="questions">
        {questions.map(
          (question) =>
            renderQuestion(
              question,
            ),
        )}
      </div>
    );
  }

  /* =======================================================
     ETAPA 1 - IDENTIFICAÇÃO
     ======================================================= */

  function renderIdentification() {
    if (
      !currentInspection
    ) {
      return null;
    }

    return (
      <section className="card">
        <div className="section-header">
          <span className="section-number">
            1
          </span>

          <div>
            <h2>
              Identificação da empresa
            </h2>

            <p>
              Informe os dados da
              empresa fiscalizada.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <label className="full">
            Razão Social

            <input
              disabled={
                isReadOnly
              }
              value={
                currentInspection
                  .companyName
              }
              onChange={(
                event,
              ) =>
                updateCompanyField(
                  'companyName',
                  event.target
                    .value,
                )
              }
              placeholder="Razão social da empresa"
            />
          </label>

          <label>
            CNPJ

            <input
              disabled={
                isReadOnly
              }
              value={
                currentInspection
                  .cnpj
              }
              onChange={(
                event,
              ) =>
                updateCompanyField(
                  'cnpj',
                  event.target
                    .value,
                )
              }
              placeholder="00.000.000/0000-00"
            />
          </label>

          <label>
            Telefone

            <input
              disabled={
                isReadOnly
              }
              value={
                currentInspection
                  .phone
              }
              onChange={(
                event,
              ) =>
                updateCompanyField(
                  'phone',
                  event.target
                    .value,
                )
              }
              placeholder="(00) 00000-0000"
            />
          </label>

          <label className="full">
            Endereço

            <input
              disabled={
                isReadOnly
              }
              value={
                currentInspection
                  .address
              }
              onChange={(
                event,
              ) =>
                updateCompanyField(
                  'address',
                  event.target
                    .value,
                )
              }
              placeholder="Endereço completo"
            />
          </label>

          <label>
            Data da vistoria

            <input
              type="date"
              disabled={
                isReadOnly
              }
              value={
                currentInspection
                  .inspectionDate
              }
              onChange={(
                event,
              ) =>
                updateCompanyField(
                  'inspectionDate',
                  event.target
                    .value,
                )
              }
            />
          </label>
        </div>
      </section>
    );
  }

  /* =======================================================
     SEÇÃO A
     ======================================================= */

  function renderSectionA() {
    return (
      <section className="card">
        <div className="section-header">
          <span className="section-number">
            A
          </span>

          <div>
            <h2>
              Cadastro de Contratantes
            </h2>

            <p>
              Art. 2º da IN nº
              196/2021-DG/PF
            </p>
          </div>
        </div>

        <div className="intro-box">
          Constatou-se, por
          amostragem, que a empresa
          especializada em transporte
          de valores possui cadastro
          das pessoas jurídicas
          contratantes contendo, no
          mínimo, as informações
          abaixo?
        </div>

        <h3>
          I — Pessoa Jurídica
        </h3>

        {renderSectionQuestions(
          legalEntityQuestions,
        )}

        <h3>
          II — Pessoa Física
        </h3>

        {renderSectionQuestions(
          individualQuestions,
        )}
      </section>
    );
  }

  /* =======================================================
     SEÇÃO B
     ======================================================= */

  function renderSectionB() {
    return (
      <section className="card">
        <div className="section-header">
          <span className="section-number">
            B
          </span>

          <div>
            <h2>
              Registro de Operações
            </h2>

            <p>
              Art. 3º da IN nº
              196/2021-DG/PF
            </p>
          </div>
        </div>

        <div className="intro-box">
          Constatou-se, por
          amostragem, que a empresa
          especializada em transporte
          de valores mantém o registro
          dos serviços prestados e das
          operações realizadas em nome
          de seus clientes, contendo,
          no mínimo, os itens abaixo?
        </div>

        {renderSectionQuestions(
          sectionBQuestions,
        )}
      </section>
    );
  }

  /* =======================================================
     SEÇÃO C
     ======================================================= */

  function renderSectionC() {
    return (
      <section className="card">
        <div className="section-header">
          <span className="section-number">
            C
          </span>

          <div>
            <h2>
              Política de Prevenção à
              Lavagem de Dinheiro
            </h2>

            <p>
              Art. 4º da IN nº
              196/2021-DG/PF
            </p>
          </div>
        </div>

        <div className="intro-box">
          As empresas especializadas
          em transporte de valores
          devem adotar política de
          prevenção à lavagem de
          dinheiro e ao financiamento
          do terrorismo, formalizada
          expressamente e aprovada pelo
          detentor da autoridade máxima
          de gestão na empresa.
        </div>

        {renderSectionQuestions(
          sectionCQuestions,
        )}
      </section>
    );
  }

  /* =======================================================
     SEÇÃO D
     ======================================================= */

  function renderSectionD() {
    return (
      <section className="card">
        <div className="section-header">
          <span className="section-number">
            D
          </span>

          <div>
            <h2>
              Efetivo Cumprimento da
              Política de PLD/FT
            </h2>

            <p>
              Verificação dos
              procedimentos e sistemas
              informatizados.
            </p>
          </div>
        </div>

        <div className="intro-box">
          Nesta etapa são verificados
          os mecanismos adotados pela
          empresa para o registro,
          pesquisa e tratamento de
          operações e situações
          potencialmente suspeitas.
        </div>

        {renderSectionQuestions(
          sectionDQuestions,
        )}
      </section>
    );
  }

  /* =======================================================
     REVISÃO
     ======================================================= */

  function renderReview() {
    if (
      !currentInspection
    ) {
      return null;
    }

    const answered =
      getAnsweredCount(
        currentInspection,
      );

    const unanswered =
      allQuestions.length -
      answered;

    const yesCount =
      allQuestions.filter(
        (question) =>
          currentInspection
            .answers[
            question.id
          ]?.value === 'SIM',
      ).length;

    const noCount =
      allQuestions.filter(
        (question) =>
          currentInspection
            .answers[
            question.id
          ]?.value === 'NAO',
      ).length;

    return (
      <>
        <section className="card">
          <div className="section-header">
            <span className="section-number">
              ✓
            </span>

            <div>
              <h2>
                Revisão da vistoria
              </h2>

              <p>
                Confira as informações
                antes da conclusão.
              </p>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <span>
                Perguntas
              </span>

              <strong>
                {allQuestions.length}
              </strong>
            </div>

            <div className="summary-card">
              <span>
                Respondidas
              </span>

              <strong>
                {answered}
              </strong>
            </div>

            <div className="summary-card">
              <span>
                Sem resposta
              </span>

              <strong>
                {unanswered}
              </strong>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <span>
                Respostas SIM
              </span>

              <strong>
                {yesCount}
              </strong>
            </div>

            <div className="summary-card">
              <span>
                Respostas NÃO
              </span>

              <strong>
                {noCount}
              </strong>
            </div>

            <div className="summary-card">
              <span>
                Progresso
              </span>

              <strong>
                {getProgress(
                  currentInspection,
                )}
                %
              </strong>
            </div>
          </div>
          <div
  style={{
    marginTop: '20px',
    display: 'flex',
    justifyContent:
      'flex-end',
  }}
>
  <button
    type="button"
    className="primary-button"
    onClick={
      downloadInspectionPdf
    }
  >
    Gerar PDF
  </button>
</div>
        </section>

        <section className="card">
          <h3>
            Dados da empresa
          </h3>

          <p>
            <strong>
              Razão Social:
            </strong>{' '}
            {currentInspection
              .companyName ||
              'Não informada'}
          </p>

          <p>
            <strong>
              CNPJ:
            </strong>{' '}
            {currentInspection
              .cnpj ||
              'Não informado'}
          </p>

          <p>
            <strong>
              Endereço:
            </strong>{' '}
            {currentInspection
              .address ||
              'Não informado'}
          </p>

          <p>
            <strong>
              Telefone:
            </strong>{' '}
            {currentInspection
              .phone ||
              'Não informado'}
          </p>

          <p>
            <strong>
              Data da vistoria:
            </strong>{' '}
            {formatDate(
              currentInspection
                .inspectionDate,
            )}
          </p>
        </section>

        <section className="card">
          <h3>
            Situação por seção
          </h3>

          <div className="review-section-list">
            <button
              type="button"
              className="review-section-button"
              onClick={() =>
                goToStep(1)
              }
            >
              <span>
                Seção A
              </span>

              <strong>
                {getSectionProgress(
                  currentInspection,
                  [
                    ...legalEntityQuestions,
                    ...individualQuestions,
                  ],
                )}
                %
              </strong>
            </button>

            <button
              type="button"
              className="review-section-button"
              onClick={() =>
                goToStep(2)
              }
            >
              <span>
                Seção B
              </span>

              <strong>
                {getSectionProgress(
                  currentInspection,
                  sectionBQuestions,
                )}
                %
              </strong>
            </button>

            <button
              type="button"
              className="review-section-button"
              onClick={() =>
                goToStep(3)
              }
            >
              <span>
                Seção C
              </span>

              <strong>
                {getSectionProgress(
                  currentInspection,
                  sectionCQuestions,
                )}
                %
              </strong>
            </button>

            <button
              type="button"
              className="review-section-button"
              onClick={() =>
                goToStep(4)
              }
            >
              <span>
                Seção D
              </span>

              <strong>
                {getSectionProgress(
                  currentInspection,
                  sectionDQuestions,
                )}
                %
              </strong>
            </button>
          </div>
        </section>
      </>
    );
  }

  function renderCurrentStep() {
    switch (
      currentStep
    ) {
      case 0:
        return renderIdentification();

      case 1:
        return renderSectionA();

      case 2:
        return renderSectionB();

      case 3:
        return renderSectionC();

      case 4:
        return renderSectionD();

      case 5:
        return renderReview();

      default:
        return null;
    }
  }

  /* =======================================================
     CARREGANDO
     ======================================================= */

  if (loading) {
    return (
      <div className="app">
        <header className="topbar">
          <div>
            <strong>
              Polícia Federal
            </strong>

            <span>
              SPLD
            </span>
          </div>
        </header>

        <main className="container">
          <section className="card">
            <h2>
              Carregando vistorias...
            </h2>

            <p>
              Aguarde enquanto o banco
              local é iniciado.
            </p>
          </section>
        </main>
      </div>
    );
  }

  /* =======================================================
     TELA INICIAL
     ======================================================= */

     if (
      screen === 'HOME'
    ) {
      return (
        <div className="app">
          <header className="topbar">
            <div>
              <strong>
                Polícia Federal
              </strong>
    
              <span>
                SPLD
              </span>
            </div>
          </header>
    
          <main className="container">
            <section className="home-header">
              <div>
                <p className="eyebrow">
                  Sistema de Fiscalização
                </p>
    
                <h1>
                  Vistorias SPLD
                </h1>
    
                <p>
                  Fiscalização de empresas
                  de transporte de valores.
                </p>
              </div>
    
              <div className="home-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    exportBackup
                  }
                >
                  ↓ Exportar backup
                </button>
    
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    backupInputRef
                      .current
                      ?.click()
                  }
                >
                  ↑ Importar backup
                </button>
    
                <button
                  type="button"
                  className="primary-button large-button"
                  onClick={
                    startNewInspection
                  }
                >
                  + Nova vistoria
                </button>
    
                <input
                  ref={
                    backupInputRef
                  }
                  type="file"
                  accept=".json,application/json"
                  style={{
                    display: 'none',
                  }}
                  onChange={
                    importBackup
                  }
                />
              </div>
            </section>
    
            <section className="summary-grid">
              <div className="summary-card">
                <span>
                  Total
                </span>
    
                <strong>
                  {inspections.length}
                </strong>
              </div>
    
              <div className="summary-card">
                <span>
                  Em andamento
                </span>
    
                <strong>
                  {
                    inspections.filter(
                      (item) =>
                        item.status !==
                        'COMPLETED',
                    ).length
                  }
                </strong>
              </div>
    
              <div className="summary-card">
                <span>
                  Concluídas
                </span>
    
                <strong>
                  {
                    inspections.filter(
                      (item) =>
                        item.status ===
                        'COMPLETED',
                    ).length
                  }
                </strong>
              </div>
            </section>
    
            <section className="card">
              <div className="section-header">
                <span className="section-number">
                  ≡
                </span>
    
                <div>
                  <h2>
                    Vistorias
                  </h2>
    
                  <p>
                    Continue uma vistoria
                    ou visualize uma já
                    concluída.
                  </p>
                </div>
              </div>
    
              {inspections.length === 0 ? (
                <div className="empty-state">
                  <strong>
                    Nenhuma vistoria criada
                  </strong>
    
                  <p>
                    Clique em “Nova vistoria”
                    para iniciar.
                  </p>
                </div>
              ) : (
                <div className="inspection-list">
                  {inspections.map(
                    (inspection) => {
                      const progress =
                        getProgress(
                          inspection,
                        );
    
                      return (
                        <div
                          className="inspection-item"
                          key={
                            inspection.id
                          }
                        >
                          <div className="inspection-main">
                            <div className="inspection-title-row">
                              <strong>
                                {inspection.companyName ||
                                  'Empresa não informada'}
                              </strong>
    
                              <span
                                className={`status status-${inspection.status.toLowerCase()}`}
                              >
                                {statusLabel(
                                  inspection.status,
                                )}
                              </span>
                            </div>
    
                            <div className="inspection-meta">
                              <span>
                                {inspection.cnpj ||
                                  'CNPJ não informado'}
                              </span>
    
                              <span>
                                {formatDate(
                                  inspection.inspectionDate,
                                )}
                              </span>
                            </div>
    
                            <div className="progress-row">
                              <div className="progress-track">
                                <div
                                  className="progress-value"
                                  style={{
                                    width: `${progress}%`,
                                  }}
                                />
                              </div>
    
                              <span>
                                {progress}%
                              </span>
                            </div>
                          </div>
    
                          <div className="inspection-actions">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                openInspection(
                                  inspection.id,
                                )
                              }
                            >
                              {inspection.status ===
                              'COMPLETED'
                                ? 'Visualizar'
                                : 'Continuar'}
                            </button>
    
                            <button
                              type="button"
                              className="danger-button"
                              onClick={() =>
                                deleteInspection(
                                  inspection.id,
                                )
                              }
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </section>
          </main>
        </div>
      );
    }

  const inspectionProgress =
    getProgress(
      currentInspection,
    );

  const stepPercentage =
    Math.round(
      ((currentStep + 1) /
        STEP_TITLES.length) *
        100,
    );

  /* =======================================================
     FORMULÁRIO
     ======================================================= */

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <strong>
            Polícia Federal
          </strong>

          <span>
            SPLD
          </span>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={goHome}
        >
          ← Tela inicial
        </button>
      </header>

      <main className="container">
        <section className="hero">
          <p className="eyebrow">
            Relatório de Vistoria
          </p>

          {isReadOnly && (
            <div className="readonly-badge">
              ✓ Vistoria concluída —
              modo de consulta
            </div>
          )}

          <h1>
            {currentInspection
              .companyName ||
              'Nova vistoria'}
          </h1>

          <p>
            Fiscalização de empresa de
            transporte de valores
          </p>

          <div className="form-status-row">
            <div className="save-status">
              {isReadOnly
                ? '✓ Vistoria concluída'
                : lastSavedAt
                  ? `✓ Salvo no dispositivo às ${lastSavedAt}`
                  : '✓ Salvamento automático'}
            </div>

            <strong>
              {inspectionProgress}%
              respondido
            </strong>
          </div>
        </section>

        <section className="step-panel">
          <div className="step-heading">
            <div>
              <span className="step-counter">
                Etapa{' '}
                {currentStep + 1}{' '}
                de{' '}
                {STEP_TITLES.length}
              </span>

              <strong>
                {
                  STEP_TITLES[
                    currentStep
                  ]
                }
              </strong>
            </div>

            <span>
              {stepPercentage}%
            </span>
          </div>

          <div className="step-progress-track">
            <div
              className="step-progress-value"
              style={{
                width: `${stepPercentage}%`,
              }}
            />
          </div>

          <div className="step-tabs">
            {STEP_TITLES.map(
              (
                title,
                index,
              ) => (
                <button
                  type="button"
                  key={title}
                  className={
                    currentStep ===
                    index
                      ? 'step-tab active'
                      : 'step-tab'
                  }
                  onClick={() =>
                    goToStep(
                      index,
                    )
                  }
                >
                  {index + 1}
                </button>
              ),
            )}
          </div>
        </section>

        {renderCurrentStep()}

        <section className="navigation-card">
          <button
            type="button"
            className="secondary-button"
            disabled={
              currentStep === 0
            }
            onClick={
              previousStep
            }
          >
            ← Anterior
          </button>

          <div className="navigation-center">
            <span>
              {
                STEP_TITLES[
                  currentStep
                ]
              }
            </span>
          </div>

          {currentStep <
          STEP_TITLES.length -
            1 ? (
            <button
              type="button"
              className="primary-button"
              onClick={
                nextStep
              }
            >
              Próximo →
            </button>
          ) : isReadOnly ? (
            <button
              type="button"
              className="primary-button"
              onClick={goHome}
            >
              ← Voltar
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={
                finishInspection
              }
            >
              Concluir vistoria
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
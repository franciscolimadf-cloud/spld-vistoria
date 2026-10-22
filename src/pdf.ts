import { jsPDF } from 'jspdf';

import brasaoRepublica from './assets/brasao-republica.png?inline';

import type {
  Inspection,
} from './db';

export type PdfQuestion = {
  id: string;
  number: string;
  text: string;
};

export type PdfSection = {
  title: string;
  subtitle?: string;
  introduction?: string;
  questions: PdfQuestion[];
};

/* =========================================================
   CONFIGURAÇÕES DA PÁGINA
   ========================================================= */

const PAGE_WIDTH = 210;

const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;

const CONTENT_WIDTH =
  PAGE_WIDTH -
  MARGIN_LEFT -
  MARGIN_RIGHT;

const CONTENT_BOTTOM = 278;

/* =========================================================
   BRASÃO

   A imagem fornecida tem proporção aproximada de 140 x 104.
   Por isso NÃO usamos largura e altura iguais.
   ========================================================= */

const CREST_WIDTH = 23;

const CREST_HEIGHT =
  CREST_WIDTH * (104 / 140);

/* =========================================================
   FUNÇÕES AUXILIARES
   ========================================================= */

function formatDate(
  value: string,
) {
  if (!value) {
    return 'Não informada';
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
  ).format(
    new Date(
      `${value}T12:00:00`,
    ),
  );
}

function safeFileName(
  value: string,
) {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .replace(
      /[^a-zA-Z0-9-_]/g,
      '-',
    )
    .replace(
      /-+/g,
      '-',
    )
    .replace(
      /^-|-$/g,
      '',
    )
    .slice(
      0,
      60,
    );
}

/* =========================================================
   CABEÇALHO DA PRIMEIRA PÁGINA
   ========================================================= */

function drawMainHeader(
  doc: jsPDF,
) {
  const center =
    PAGE_WIDTH / 2;

  /*
   * Brasão centralizado e proporcional.
   */

  doc.addImage(
    brasaoRepublica,
    'PNG',
    center -
      CREST_WIDTH / 2,
    6,
    CREST_WIDTH,
    CREST_HEIGHT,
  );

  let y =
    6 +
    CREST_HEIGHT +
    4;

  doc.setTextColor(
    25,
    25,
    25,
  );

  doc.setFont(
    'helvetica',
    'normal',
  );

  doc.setFontSize(7.2);

  doc.text(
    'SERVIÇO PÚBLICO FEDERAL',
    center,
    y,
    {
      align: 'center',
    },
  );

  y += 3.5;

  doc.text(
    'MJSP - POLÍCIA FEDERAL',
    center,
    y,
    {
      align: 'center',
    },
  );

  y += 3.5;

  doc.text(
    'DIRETORIA DE POLÍCIA ADMINISTRATIVA - DPA',
    center,
    y,
    {
      align: 'center',
    },
  );

  y += 3.5;

  doc.text(
    'COORDENAÇÃO-GERAL DE CONTROLE DE SERVIÇOS E PRODUTOS - CGCSP',
    center,
    y,
    {
      align: 'center',
    },
  );

  y += 3.5;

  doc.text(
    'DIVISÃO DE CONTROLE E FISCALIZAÇÃO DE SEGURANÇA PRIVADA - DICOF',
    center,
    y,
    {
      align: 'center',
    },
  );

  y += 3.5;

  doc.text(
    'SETOR DE PREVENÇÃO À LAVAGEM DE DINHEIRO E AO FINANCIAMENTO DO TERRORISMO EM EMPRESAS DE TRANSPORTE DE VALORES - SPLD',
    center,
    y,
    {
      align: 'center',
      maxWidth:
        CONTENT_WIDTH,
    },
  );

  y += 7;

  doc.setFont(
    'helvetica',
    'bold',
  );

  doc.setFontSize(12.5);

  doc.text(
    'RELATÓRIO DE VISTORIA',
    center,
    y,
    {
      align: 'center',
    },
  );

  y += 4;

  doc.setDrawColor(
    100,
    100,
    100,
  );

  doc.setLineWidth(0.25);

  doc.line(
    MARGIN_LEFT,
    y,
    PAGE_WIDTH -
      MARGIN_RIGHT,
    y,
  );

  return y + 5;
}

/* =========================================================
   CABEÇALHO DAS PÁGINAS SEGUINTES

   Não repetimos todo o cabeçalho institucional.
   Isso reduz bastante o tamanho final.
   ========================================================= */

function drawContinuationHeader(
  doc: jsPDF,
) {
  doc.setTextColor(
    60,
    60,
    60,
  );

  doc.setFont(
    'helvetica',
    'bold',
  );

  doc.setFontSize(8);

  doc.text(
    'RELATÓRIO DE VISTORIA - SPLD',
    MARGIN_LEFT,
    11,
  );

  doc.setDrawColor(
    190,
    190,
    190,
  );

  doc.setLineWidth(0.2);

  doc.line(
    MARGIN_LEFT,
    14,
    PAGE_WIDTH -
      MARGIN_RIGHT,
    14,
  );

  return 20;
}

function addNewPage(
  doc: jsPDF,
) {
  doc.addPage();

  return drawContinuationHeader(
    doc,
  );
}

/* =========================================================
   IDENTIFICAÇÃO DA EMPRESA
   ========================================================= */

function drawCellText(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  doc.setDrawColor(
    175,
    175,
    175,
  );

  doc.rect(
    x,
    y,
    width,
    height,
  );

  doc.setFont(
    'helvetica',
    'bold',
  );

  doc.setFontSize(7.5);

  doc.text(
    `${label}:`,
    x + 2,
    y + 4,
  );

  const labelWidth =
    doc.getTextWidth(
      `${label}: `,
    );

  doc.setFont(
    'helvetica',
    'normal',
  );

  const content =
    value.trim() ||
    'Não informado';

  const lines =
    doc.splitTextToSize(
      content,
      width -
        labelWidth -
        5,
    );

  doc.text(
    lines,
    x +
      labelWidth +
      2,
    y + 4,
  );
}

function drawIdentification(
  doc: jsPDF,
  inspection: Inspection,
  startY: number,
) {
  let y = startY;

  doc.setFont(
    'helvetica',
    'bold',
  );

  doc.setFontSize(8.5);

  doc.text(
    'IDENTIFICAÇÃO DA EMPRESA',
    MARGIN_LEFT,
    y,
  );

  y += 3;

  /*
   * Razão Social
   */

  drawCellText(
    doc,
    'Razão Social',
    inspection.companyName,
    MARGIN_LEFT,
    y,
    CONTENT_WIDTH,
    9,
  );

  y += 9;

  /*
   * CNPJ + Telefone
   */

  drawCellText(
    doc,
    'CNPJ',
    inspection.cnpj,
    MARGIN_LEFT,
    y,
    90,
    9,
  );

  drawCellText(
    doc,
    'Telefone',
    inspection.phone,
    MARGIN_LEFT + 90,
    y,
    90,
    9,
  );

  y += 9;

  /*
   * Endereço
   */

  drawCellText(
    doc,
    'Endereço',
    inspection.address,
    MARGIN_LEFT,
    y,
    CONTENT_WIDTH,
    11,
  );

  y += 11;

  /*
   * Data
   */

  drawCellText(
    doc,
    'Data da Vistoria',
    formatDate(
      inspection.inspectionDate,
    ),
    MARGIN_LEFT,
    y,
    CONTENT_WIDTH,
    9,
  );

  return y + 14;
}

/* =========================================================
   TÍTULO DAS SEÇÕES
   ========================================================= */

function drawSectionTitle(
  doc: jsPDF,
  title: string,
  subtitle:
    | string
    | undefined,
  startY: number,
) {
  let y = startY;

  const titleLines =
    doc.splitTextToSize(
      title,
      CONTENT_WIDTH - 4,
    );

  const titleHeight =
    Math.max(
      8,
      titleLines.length * 4 +
        3,
    );

  doc.setFillColor(
    226,
    230,
    236,
  );

  doc.setDrawColor(
    165,
    170,
    178,
  );

  doc.rect(
    MARGIN_LEFT,
    y,
    CONTENT_WIDTH,
    titleHeight,
    'FD',
  );

  doc.setFont(
    'helvetica',
    'bold',
  );

  doc.setFontSize(9);

  doc.setTextColor(
    20,
    30,
    45,
  );

  doc.text(
    titleLines,
    MARGIN_LEFT + 2,
    y + 5,
  );

  y += titleHeight;

  if (subtitle) {
    doc.setFont(
      'helvetica',
      'italic',
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      70,
      70,
      70,
    );

    doc.text(
      subtitle,
      MARGIN_LEFT + 2,
      y + 4,
    );

    y += 6;
  }

  doc.setTextColor(
    25,
    25,
    25,
  );

  return y;
}

function drawIntroduction(
  doc: jsPDF,
  text: string | undefined,
  startY: number,
) {
  if (!text) {
    return startY;
  }

  doc.setFont(
    'helvetica',
    'normal',
  );

  doc.setFontSize(7.7);

  const lines =
    doc.splitTextToSize(
      text,
      CONTENT_WIDTH,
    );

  doc.text(
    lines,
    MARGIN_LEFT,
    startY,
  );

  return (
    startY +
    lines.length * 3.5 +
    3
  );
}

/* =========================================================
   TABELAS DAS SEÇÕES A E B
   ========================================================= */

const TABLE_X =
  MARGIN_LEFT;

const QUESTION_WIDTH = 116;
const YES_WIDTH = 14;
const NO_WIDTH = 14;
const OBS_WIDTH = 36;

const YES_X =
  TABLE_X +
  QUESTION_WIDTH;

const NO_X =
  YES_X +
  YES_WIDTH;

const OBS_X =
  NO_X +
  NO_WIDTH;

function drawTableHeader(
  doc: jsPDF,
  y: number,
) {
  const height = 8;

  doc.setFillColor(
    235,
    237,
    240,
  );

  doc.setDrawColor(
    150,
    150,
    150,
  );

  doc.rect(
    TABLE_X,
    y,
    QUESTION_WIDTH,
    height,
    'FD',
  );

  doc.rect(
    YES_X,
    y,
    YES_WIDTH,
    height,
    'FD',
  );

  doc.rect(
    NO_X,
    y,
    NO_WIDTH,
    height,
    'FD',
  );

  doc.rect(
    OBS_X,
    y,
    OBS_WIDTH,
    height,
    'FD',
  );

  doc.setFont(
    'helvetica',
    'bold',
  );

  doc.setFontSize(7.3);

  doc.text(
    'QUESTIONAMENTO',
    TABLE_X + 2,
    y + 5,
  );

  doc.text(
    'SIM',
    YES_X +
      YES_WIDTH / 2,
    y + 5,
    {
      align: 'center',
    },
  );

  doc.text(
    'NÃO',
    NO_X +
      NO_WIDTH / 2,
    y + 5,
    {
      align: 'center',
    },
  );

  doc.text(
    'OBSERVAÇÕES',
    OBS_X +
      OBS_WIDTH / 2,
    y + 5,
    {
      align: 'center',
    },
  );

  return y + height;
}

function calculateTableRowHeight(
  doc: jsPDF,
  question: PdfQuestion,
  inspection: Inspection,
) {
  const answer =
    inspection.answers[
      question.id
    ];

  const questionLines =
    doc.splitTextToSize(
      `${question.number}) ${question.text}`,
      QUESTION_WIDTH - 4,
    );

  const observation =
    answer?.observation?.trim() ||
    '';

  const observationLines =
    observation
      ? doc.splitTextToSize(
          observation,
          OBS_WIDTH - 4,
        )
      : [''];

  return Math.max(
    9,
    questionLines.length *
      3.3 +
      4,
    observationLines.length *
      3.3 +
      4,
  );
}

function drawTableRow(
  doc: jsPDF,
  inspection: Inspection,
  question: PdfQuestion,
  y: number,
) {
  const answer =
    inspection.answers[
      question.id
    ] ?? {
      value: '',
      observation: '',
    };

  const rowHeight =
    calculateTableRowHeight(
      doc,
      question,
      inspection,
    );

  doc.setDrawColor(
    175,
    175,
    175,
  );

  doc.rect(
    TABLE_X,
    y,
    QUESTION_WIDTH,
    rowHeight,
  );

  doc.rect(
    YES_X,
    y,
    YES_WIDTH,
    rowHeight,
  );

  doc.rect(
    NO_X,
    y,
    NO_WIDTH,
    rowHeight,
  );

  doc.rect(
    OBS_X,
    y,
    OBS_WIDTH,
    rowHeight,
  );

  doc.setFont(
    'helvetica',
    'normal',
  );

  doc.setFontSize(7.2);

  const questionLines =
    doc.splitTextToSize(
      `${question.number}) ${question.text}`,
      QUESTION_WIDTH - 4,
    );

  doc.text(
    questionLines,
    TABLE_X + 2,
    y + 4,
  );

  /*
   * Marcação das respostas.
   */

  doc.setFont(
    'helvetica',
    'bold',
  );

  doc.setFontSize(9);

  if (
    answer.value ===
    'SIM'
  ) {
    doc.text(
      'X',
      YES_X +
        YES_WIDTH / 2,
      y + rowHeight / 2 + 1,
      {
        align: 'center',
      },
    );
  }

  if (
    answer.value ===
    'NAO'
  ) {
    doc.text(
      'X',
      NO_X +
        NO_WIDTH / 2,
      y + rowHeight / 2 + 1,
      {
        align: 'center',
      },
    );
  }

  /*
   * Observação.
   */

  doc.setFont(
    'helvetica',
    'normal',
  );

  doc.setFontSize(6.8);

  const observation =
    answer.observation.trim();

  if (observation) {
    const observationLines =
      doc.splitTextToSize(
        observation,
        OBS_WIDTH - 4,
      );

    doc.text(
      observationLines,
      OBS_X + 2,
      y + 4,
    );
  }

  return y + rowHeight;
}

function drawGroupHeader(
  doc: jsPDF,
  text: string,
  y: number,
) {
  doc.setFillColor(
    245,
    246,
    248,
  );

  doc.setDrawColor(
    175,
    175,
    175,
  );

  doc.rect(
    TABLE_X,
    y,
    CONTENT_WIDTH,
    7,
    'FD',
  );

  doc.setFont(
    'helvetica',
    'bold',
  );

  doc.setFontSize(7.7);

  doc.text(
    text,
    TABLE_X + 2,
    y + 4.6,
  );

  return y + 7;
}

function drawTableSectionContinuation(
  doc: jsPDF,
  title: string,
  startY: number,
) {
  doc.setFont(
    'helvetica',
    'bold',
  );

  doc.setFontSize(8);

  doc.text(
    `${title} — continuação`,
    MARGIN_LEFT,
    startY,
  );

  return startY + 5;
}

function drawSectionA(
  doc: jsPDF,
  inspection: Inspection,
  section: PdfSection,
  startY: number,
) {
  let y =
    drawSectionTitle(
      doc,
      section.title,
      section.subtitle,
      startY,
    );

  y =
    drawIntroduction(
      doc,
      section.introduction,
      y + 2,
    );

  const legal =
    section.questions.filter(
      (question) =>
        question.id.startsWith(
          'a-pj-',
        ),
    );

  const individual =
    section.questions.filter(
      (question) =>
        question.id.startsWith(
          'a-pf-',
        ),
    );

  const groups = [
    {
      title:
        'I – Se pessoa jurídica',
      questions: legal,
    },

    {
      title:
        'II – Se pessoa física',
      questions:
        individual,
    },
  ];

  for (
    const group of groups
  ) {
    if (
      y + 18 >
      CONTENT_BOTTOM
    ) {
      y = addNewPage(doc);

      y =
        drawTableSectionContinuation(
          doc,
          section.title,
          y,
        );
    }

    y = drawGroupHeader(
      doc,
      group.title,
      y,
    );

    y = drawTableHeader(
      doc,
      y,
    );

    for (
      const question of
      group.questions
    ) {
      const rowHeight =
        calculateTableRowHeight(
          doc,
          question,
          inspection,
        );

      if (
        y + rowHeight >
        CONTENT_BOTTOM
      ) {
        y = addNewPage(doc);

        y =
          drawTableSectionContinuation(
            doc,
            section.title,
            y,
          );

        y =
          drawGroupHeader(
            doc,
            `${group.title} — continuação`,
            y,
          );

        y =
          drawTableHeader(
            doc,
            y,
          );
      }

      y = drawTableRow(
        doc,
        inspection,
        question,
        y,
      );
    }

    y += 4;
  }

  return y;
}

function drawSectionB(
  doc: jsPDF,
  inspection: Inspection,
  section: PdfSection,
  startY: number,
) {
  let y =
    drawSectionTitle(
      doc,
      section.title,
      section.subtitle,
      startY,
    );

  y =
    drawIntroduction(
      doc,
      section.introduction,
      y + 2,
    );

  y = drawTableHeader(
    doc,
    y,
  );

  for (
    const question of
    section.questions
  ) {
    const rowHeight =
      calculateTableRowHeight(
        doc,
        question,
        inspection,
      );

    if (
      y + rowHeight >
      CONTENT_BOTTOM
    ) {
      y = addNewPage(doc);

      y =
        drawTableSectionContinuation(
          doc,
          section.title,
          y,
        );

      y =
        drawTableHeader(
          doc,
          y,
        );
    }

    y = drawTableRow(
      doc,
      inspection,
      question,
      y,
    );
  }

  return y + 5;
}

/* =========================================================
   BLOCOS COMPACTOS DAS SEÇÕES C E D
   ========================================================= */

function calculateQuestionBlockHeight(
  doc: jsPDF,
  inspection: Inspection,
  question: PdfQuestion,
) {
  const answer =
    inspection.answers[
      question.id
    ];

  const questionLines =
    doc.splitTextToSize(
      question.text,
      CONTENT_WIDTH - 16,
    );

  const observation =
    answer?.observation?.trim() ||
    '';

  const observationLines =
    observation
      ? doc.splitTextToSize(
          observation,
          CONTENT_WIDTH - 10,
        )
      : [];

  return (
    questionLines.length *
      3.3 +
    12 +
    (observationLines.length
      ? observationLines.length *
          3.2 +
        4
      : 0)
  );
}

function drawAnswerBadge(
  doc: jsPDF,
  answer:
    | 'SIM'
    | 'NAO'
    | '',
  x: number,
  y: number,
) {
  const yesSelected =
    answer === 'SIM';

  const noSelected =
    answer === 'NAO';

  doc.setFont(
    'helvetica',
    'bold',
  );

  doc.setFontSize(7);

  doc.setDrawColor(
    100,
    100,
    100,
  );

  if (yesSelected) {
    doc.setFillColor(
      225,
      238,
      228,
    );
  } else {
    doc.setFillColor(
      250,
      250,
      250,
    );
  }

  doc.roundedRect(
    x,
    y,
    15,
    6,
    1,
    1,
    'FD',
  );

  doc.text(
    yesSelected
      ? 'X SIM'
      : 'SIM',
    x + 7.5,
    y + 4,
    {
      align: 'center',
    },
  );

  if (noSelected) {
    doc.setFillColor(
      244,
      228,
      228,
    );
  } else {
    doc.setFillColor(
      250,
      250,
      250,
    );
  }

  doc.roundedRect(
    x + 18,
    y,
    15,
    6,
    1,
    1,
    'FD',
  );

  doc.text(
    noSelected
      ? 'X NÃO'
      : 'NÃO',
    x + 25.5,
    y + 4,
    {
      align: 'center',
    },
  );
}

function drawQuestionBlock(
  doc: jsPDF,
  inspection: Inspection,
  question: PdfQuestion,
  y: number,
) {
  const answer =
    inspection.answers[
      question.id
    ] ?? {
      value: '',
      observation: '',
    };

  const height =
    calculateQuestionBlockHeight(
      doc,
      inspection,
      question,
    );

  doc.setDrawColor(
    205,
    205,
    205,
  );

  doc.setFillColor(
    252,
    252,
    252,
  );

  doc.roundedRect(
    MARGIN_LEFT,
    y,
    CONTENT_WIDTH,
    height,
    1.5,
    1.5,
    'FD',
  );

  /*
   * Número.
   */

  doc.setFillColor(
    230,
    233,
    238,
  );

  doc.roundedRect(
    MARGIN_LEFT + 2,
    y + 2,
    10,
    7,
    1,
    1,
    'F',
  );

  doc.setFont(
    'helvetica',
    'bold',
  );

  doc.setFontSize(7.5);

  doc.text(
    question.number,
    MARGIN_LEFT + 7,
    y + 6.6,
    {
      align: 'center',
    },
  );

  /*
   * Pergunta.
   */

  doc.setFont(
    'helvetica',
    'normal',
  );

  doc.setFontSize(7.5);

  const lines =
    doc.splitTextToSize(
      question.text,
      CONTENT_WIDTH - 16,
    );

  doc.text(
    lines,
    MARGIN_LEFT + 14,
    y + 5,
  );

  let cursorY =
    y +
    Math.max(
      10,
      lines.length * 3.3 +
        3,
    );

  /*
   * Resposta.
   */

  drawAnswerBadge(
    doc,
    answer.value,
    MARGIN_LEFT + 14,
    cursorY,
  );

  cursorY += 8;

  /*
   * Observação.
   */

  if (
    answer.observation.trim()
  ) {
    doc.setFont(
      'helvetica',
      'bold',
    );

    doc.setFontSize(6.8);

    doc.text(
      'Observação:',
      MARGIN_LEFT + 14,
      cursorY,
    );

    const labelWidth =
      doc.getTextWidth(
        'Observação: ',
      );

    doc.setFont(
      'helvetica',
      'normal',
    );

    const observationLines =
      doc.splitTextToSize(
        answer.observation.trim(),
        CONTENT_WIDTH -
          20 -
          labelWidth,
      );

    doc.text(
      observationLines,
      MARGIN_LEFT +
        14 +
        labelWidth,
      cursorY,
    );
  }

  return y + height + 3;
}

function drawStandardSection(
  doc: jsPDF,
  inspection: Inspection,
  section: PdfSection,
  startY: number,
) {
  let y =
    drawSectionTitle(
      doc,
      section.title,
      section.subtitle,
      startY,
    );

  y =
    drawIntroduction(
      doc,
      section.introduction,
      y + 2,
    );

  for (
    const question of
    section.questions
  ) {
    const height =
      calculateQuestionBlockHeight(
        doc,
        inspection,
        question,
      );

    if (
      y + height >
      CONTENT_BOTTOM
    ) {
      y = addNewPage(doc);

      doc.setFont(
        'helvetica',
        'bold',
      );

      doc.setFontSize(8);

      doc.text(
        `${section.title} — continuação`,
        MARGIN_LEFT,
        y,
      );

      y += 6;
    }

    y =
      drawQuestionBlock(
        doc,
        inspection,
        question,
        y,
      );
  }

  return y + 3;
}

/* =========================================================
   ASSINATURAS
   ========================================================= */

function drawSignatures(
  doc: jsPDF,
  startY: number,
) {
  let y = startY;

  if (
    y + 35 >
    CONTENT_BOTTOM
  ) {
    y = addNewPage(doc);
  }

  y += 16;

  const width = 70;

  const leftX = 25;

  const rightX =
    PAGE_WIDTH -
    25 -
    width;

  doc.setDrawColor(
    70,
    70,
    70,
  );

  doc.setLineWidth(0.25);

  doc.line(
    leftX,
    y,
    leftX + width,
    y,
  );

  doc.line(
    rightX,
    y,
    rightX + width,
    y,
  );

  doc.setFont(
    'helvetica',
    'normal',
  );

  doc.setFontSize(8);

  doc.text(
    'Policial Federal',
    leftX + width / 2,
    y + 5,
    {
      align: 'center',
    },
  );

  doc.text(
    'Responsável pela empresa',
    rightX + width / 2,
    y + 5,
    {
      align: 'center',
    },
  );
}

/* =========================================================
   RODAPÉ E PAGINAÇÃO
   ========================================================= */

function addFooters(
  doc: jsPDF,
) {
  const pages =
    doc.getNumberOfPages();

  for (
    let page = 1;
    page <= pages;
    page++
  ) {
    doc.setPage(page);

    doc.setDrawColor(
      205,
      205,
      205,
    );

    doc.setLineWidth(0.2);

    doc.line(
      MARGIN_LEFT,
      284,
      PAGE_WIDTH -
        MARGIN_RIGHT,
      284,
    );

    doc.setFont(
      'helvetica',
      'normal',
    );

    doc.setFontSize(7);

    doc.setTextColor(
      90,
      90,
      90,
    );

    doc.text(
      'RELATÓRIO DE VISTORIA - SPLD',
      MARGIN_LEFT,
      289,
    );

    doc.text(
      `Página ${page} de ${pages}`,
      PAGE_WIDTH -
        MARGIN_RIGHT,
      289,
      {
        align: 'right',
      },
    );
  }
}

/* =========================================================
   GERAÇÃO DO DOCUMENTO
   ========================================================= */

export function generateInspectionPdf(
  inspection: Inspection,
  sections: PdfSection[],
) {
  const doc =
    new jsPDF({
      orientation:
        'portrait',
      unit: 'mm',
      format: 'a4',
    });

  doc.setProperties({
    title:
      'Relatório de Vistoria - SPLD',

    subject:
      'Relatório de Vistoria SPLD',

    author:
      'Polícia Federal',

    creator:
      'SPLD Vistoria',
  });

  /*
   * Primeira página.
   */

  let y =
    drawMainHeader(doc);

  y =
    drawIdentification(
      doc,
      inspection,
      y,
    );

  /*
   * Seções.
   */

  for (
    const section of
    sections
  ) {
    if (
      y + 20 >
      CONTENT_BOTTOM
    ) {
      y = addNewPage(doc);
    }

    if (
      section.title.startsWith(
        'A.',
      )
    ) {
      y = drawSectionA(
        doc,
        inspection,
        section,
        y,
      );

      continue;
    }

    if (
      section.title.startsWith(
        'B.',
      )
    ) {
      y = drawSectionB(
        doc,
        inspection,
        section,
        y,
      );

      continue;
    }

    y =
      drawStandardSection(
        doc,
        inspection,
        section,
        y,
      );
  }

  /*
   * Assinaturas.
   */

  drawSignatures(
    doc,
    y,
  );

  /*
   * Rodapé.
   */

  addFooters(doc);

  /*
   * Nome do arquivo.
   */

  const company =
    safeFileName(
      inspection.companyName ||
        'empresa',
    );

  const date =
    inspection.inspectionDate ||
    new Date()
      .toISOString()
      .slice(0, 10);

  doc.save(
    `Relatorio-Vistoria-SPLD-${company}-${date}.pdf`,
  );
}
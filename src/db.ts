import Dexie, { type Table } from 'dexie';

export type AnswerValue =
  | 'SIM'
  | 'NAO'
  | '';

export type Answer = {
  value: AnswerValue;
  observation: string;
};

export type InspectionStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type Inspection = {
  id: string;

  companyName: string;
  cnpj: string;
  address: string;
  phone: string;
  inspectionDate: string;

  answers: Record<string, Answer>;

  status: InspectionStatus;

  createdAt: string;
  updatedAt: string;
};

export type BackupFile = {
  backupVersion: 1;
  application: 'SPLD Vistoria';
  exportedAt: string;
  inspections: Inspection[];
};

class SpldDatabase extends Dexie {
  inspections!: Table<
    Inspection,
    string
  >;

  constructor() {
    super('spld-vistoria-db');

    this.version(1).stores({
      inspections:
        'id, companyName, cnpj, inspectionDate, status, createdAt, updatedAt',
    });
  }
}

export const db =
  new SpldDatabase();

/* =========================================================
   VISTORIAS
   ========================================================= */

export async function getAllInspections(): Promise<
  Inspection[]
> {
  return db.inspections
    .orderBy('createdAt')
    .reverse()
    .toArray();
}

export async function getInspection(
  id: string,
): Promise<
  Inspection | undefined
> {
  return db.inspections.get(id);
}

export async function saveInspection(
  inspection: Inspection,
): Promise<void> {
  await db.inspections.put(
    inspection,
  );
}

export async function removeInspection(
  id: string,
): Promise<void> {
  await db.inspections.delete(id);
}

export async function countInspections(): Promise<number> {
  return db.inspections.count();
}

/* =========================================================
   BACKUP
   ========================================================= */

export async function createBackup(): Promise<BackupFile> {
  const inspections =
    await getAllInspections();

  return {
    backupVersion: 1,
    application: 'SPLD Vistoria',
    exportedAt:
      new Date().toISOString(),
    inspections,
  };
}

export async function restoreBackup(
  backup: BackupFile,
): Promise<number> {
  if (
    backup.application !==
    'SPLD Vistoria'
  ) {
    throw new Error(
      'Arquivo não pertence ao SPLD Vistoria.',
    );
  }

  if (
    backup.backupVersion !== 1
  ) {
    throw new Error(
      'Versão de backup não suportada.',
    );
  }

  if (
    !Array.isArray(
      backup.inspections,
    )
  ) {
    throw new Error(
      'Arquivo de backup inválido.',
    );
  }

  /*
   * bulkPut:
   *
   * - cria registros inexistentes;
   * - atualiza registros com o mesmo ID;
   * - não apaga outros registros
   *   já existentes no dispositivo.
   */

  await db.inspections.bulkPut(
    backup.inspections,
  );

  return backup.inspections.length;
}
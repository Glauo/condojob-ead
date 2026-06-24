import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { dbQuery, dbQueryOne, dbRun } from "@/lib/db";

export type ParsedLead = {
  nome: string;
  whatsapp: string | null;
  email: string | null;
  origem?: string | null;
  observacoes?: string | null;
};

type ExistingLead = {
  id: string;
  nome_contato: string;
  whatsapp: string | null;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeLeadName(value: string) {
  return normalizeWhitespace(String(value || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeLeadPhone(value: string | null | undefined) {
  const raw = String(value || "").trim();
  const expanded = /^[\d.]+e\+\d+$/i.test(raw) ? Number(raw).toFixed(0) : raw;
  const digits = expanded.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits.slice(2);
  return digits;
}

function extractEmail(parts: string[]) {
  for (const part of parts) {
    const match = part.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (match) return match[0].toLowerCase();
  }
  return null;
}

function extractPhone(parts: string[]) {
  for (const part of parts) {
    const digits = normalizeLeadPhone(part);
    if (digits.length >= 10 && digits.length <= 13) return digits;
  }
  return null;
}

function extractName(parts: string[]) {
  const filtered = parts
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean)
    .filter((part) => !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(part))
    .filter((part) => normalizeLeadPhone(part).length < 10);

  return filtered.join(" ").trim();
}

function toLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
}

function parseWorksheetRows(rows: unknown[][]) {
  if (!rows.length) return [];
  const header = rows[0].map((value) => normalizeLeadName(String(value ?? "")));
  const nomeIndex = header.findIndex((value) => value === "nome");
  const phoneIndex = header.findIndex((value) => value === "telefone_processado" || value === "telefone");
  const emailIndex = header.findIndex((value) => value === "e-mail" || value === "email");
  const origemIndex = header.findIndex((value) => value === "origem");

  if (nomeIndex >= 0 && phoneIndex >= 0) {
    const leads: ParsedLead[] = [];
    for (const row of rows.slice(1)) {
      const nome = normalizeWhitespace(String(row[nomeIndex] ?? ""));
      const whatsapp = normalizeLeadPhone(String(row[phoneIndex] ?? ""));
      const email = emailIndex >= 0 ? String(row[emailIndex] ?? "").trim().toLowerCase() || null : null;
      const origem = origemIndex >= 0 ? normalizeWhitespace(String(row[origemIndex] ?? "")) || null : null;
      if (!nome || !whatsapp) continue;
      leads.push({ nome, whatsapp, email, origem });
    }
    return leads;
  }

  const leads: ParsedLead[] = [];

  for (const row of rows) {
    const parts = row
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);

    if (!parts.length) continue;
    const whatsapp = extractPhone(parts);
    const email = extractEmail(parts);
    const nome = extractName(parts);
    if (!nome || !whatsapp) continue;

    leads.push({
      nome,
      whatsapp,
      email,
    });
  }

  return leads;
}

function parsePlainText(text: string) {
  const leads: ParsedLead[] = [];
  const lines = toLines(text);

  for (const line of lines) {
    const phoneMatch = line.match(/(\+?55\s*)?(\(?\d{2}\)?\s*)?\d{4,5}[-\s]?\d{4}/);
    if (!phoneMatch) continue;

    const whatsapp = normalizeLeadPhone(phoneMatch[0]);
    if (!whatsapp) continue;

    const nome = normalizeWhitespace(line.replace(phoneMatch[0], "").replace(/[|;,]+/g, " "));
    if (!nome) continue;

    const emailMatch = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    leads.push({
      nome,
      whatsapp,
      email: emailMatch ? emailMatch[0].toLowerCase() : null,
    });
  }

  return leads;
}

export async function parseLeadFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "").toLowerCase();

  if (ext === "xlsx" || ext === "xls" || ext === "csv") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const leads: ParsedLead[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as unknown[][];
      leads.push(...parseWorksheetRows(rows));
    }

    return leads;
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return parsePlainText(result.value || "");
  }

  if (ext === "pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return parsePlainText(result.text || "");
    } finally {
      await parser.destroy();
    }
  }

  if (ext === "txt") {
    return parsePlainText(buffer.toString("utf-8"));
  }

  throw new Error("Formato nao suportado. Envie Excel (.xlsx/.xls/.csv), Word (.docx), PDF textual ou TXT.");
}

function dedupeParsedLeads(leads: ParsedLead[]) {
  const unique: ParsedLead[] = [];
  const seenPhones = new Set<string>();
  const seenNames = new Set<string>();

  for (const lead of leads) {
    const nomeKey = normalizeLeadName(lead.nome);
    const phoneKey = normalizeLeadPhone(lead.whatsapp);
    if (!nomeKey || !phoneKey) continue;
    if (seenPhones.has(phoneKey) || seenNames.has(nomeKey)) continue;
    seenPhones.add(phoneKey);
    seenNames.add(nomeKey);
    unique.push({
      ...lead,
      nome: normalizeWhitespace(lead.nome),
      whatsapp: phoneKey,
      email: lead.email?.trim().toLowerCase() || null,
    });
  }

  return unique;
}

export async function importParsedLeads(leads: ParsedLead[], sessionId: string, fileName: string) {
  const sanitized = dedupeParsedLeads(leads);
  const existingLeads = await dbQuery<ExistingLead>("SELECT id, nome_contato, whatsapp FROM cj_comercial_leads");
  const existingPhones = new Set(existingLeads.map((lead) => normalizeLeadPhone(lead.whatsapp)).filter(Boolean));
  const existingNames = new Set(existingLeads.map((lead) => normalizeLeadName(lead.nome_contato)).filter(Boolean));
  const inserted: string[] = [];
  const duplicates: string[] = [];

  for (const lead of sanitized) {
    const phoneKey = normalizeLeadPhone(lead.whatsapp);
    const nameKey = normalizeLeadName(lead.nome);
    if (existingPhones.has(phoneKey) || existingNames.has(nameKey)) {
      duplicates.push(lead.nome);
      continue;
    }

    const created = await dbQueryOne<{ id: string }>(
      `INSERT INTO cj_comercial_leads
        (empresa, nome_contato, email, whatsapp, origem, estagio, status, observacoes, tags, score, valor_potencial, responsavel_id, criado_por, atualizado_em)
       VALUES ($1,$2,$3,$4,$5,'novo','ativo',$6,$7::jsonb,50,0,$8,$8,now())
       RETURNING id`,
      [
        lead.nome,
        lead.nome,
        lead.email,
        lead.whatsapp,
        lead.origem?.trim() || "importacao-arquivo",
        lead.observacoes || `Lead importado automaticamente do arquivo ${fileName}.`,
        JSON.stringify(["importado", "arquivo"]),
        sessionId,
      ]
    );

    if (!created) continue;

    inserted.push(lead.nome);
    existingPhones.add(phoneKey);
    existingNames.add(nameKey);
    await dbRun(
      `INSERT INTO cj_comercial_atividades (lead_id, tipo, titulo, descricao, criado_por)
       VALUES ($1,'movimentacao','Lead importado',$2,$3)`,
      [created.id, `Lead importado do arquivo ${fileName}.`, sessionId]
    );
  }

  return {
    totalRecebidos: leads.length,
    totalValidos: sanitized.length,
    inseridos: inserted.length,
    duplicados: duplicates.length,
    insertedNames: inserted,
    duplicateNames: duplicates,
  };
}

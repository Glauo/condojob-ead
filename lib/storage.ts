import path from "path";

export function getUploadsRoot() {
  const configured = String(process.env.UPLOADS_DIR || "").trim();
  return configured ? path.resolve(configured) : path.join(process.cwd(), "public");
}

export function getUploadFolder(folder: "videos" | "materiais" | "respostas") {
  return path.join(getUploadsRoot(), folder);
}

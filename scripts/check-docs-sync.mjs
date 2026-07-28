import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const WINDOWS_ABSOLUTE_RE = /(?:file:\/\/\/|[A-Za-z]:[\\/](?:Users|Documents|OneDrive)[\\/])/i;
const TASK_NAME_RE = /^\d{4}-\d{2}-\d{2}-[a-z0-9]{6,}-[a-z0-9-]+\.md$/;

const IMPACT_RULES = [
  {
    name: "contratos HTTP",
    source: (file) => file.startsWith("api/"),
    docs: ["docs/technical/08-api-reference.md"],
  },
  {
    name: "pagos Flow",
    source: (file) => file.startsWith("api/flow/") || file.startsWith("src/server/flow/"),
    docs: ["docs/technical/05-payment-flow.md", "docs/technical/08-api-reference.md"],
  },
  {
    name: "modelo Supabase",
    source: (file) => file.startsWith("supabase/migrations/"),
    docs: [
      "docs/technical/03-domain-model.md",
      "docs/technical/06-inventory-reservations.md",
      "docs/technical/07-supabase-security.md",
      "docs/technical/11-deployment.md",
    ],
  },
  {
    name: "rutas y experiencia",
    source: (file) => file.startsWith("src/routes/") || file.startsWith("src/components/"),
    docs: ["docs/technical/04-use-cases.md", "docs/technical/09-frontend-components.md"],
  },
  {
    name: "herramientas y dependencias",
    source: (file) =>
      [
        "package.json",
        "package-lock.json",
        "vite.config.ts",
        "tsconfig.json",
        "eslint.config.js",
        ".nvmrc",
      ].includes(file),
    docs: ["README.md", "docs/technical/01-stack.md", "docs/technical/10-installation.md"],
  },
  {
    name: "despliegue y automatización",
    source: (file) =>
      file === "vercel.json" ||
      file.startsWith(".github/workflows/") ||
      file.startsWith("supabase/config.toml"),
    docs: ["docs/technical/11-deployment.md", "AGENTS.md"],
  },
];

function normalize(file) {
  return file.replaceAll("\\", "/").replace(/^\.\//, "");
}

function walkFiles(directory, predicate = () => true) {
  if (!existsSync(directory)) return [];

  const files = [];
  for (const entry of readdirSync(directory)) {
    const absolute = path.join(directory, entry);
    const relative = normalize(path.relative(ROOT, absolute));
    if (
      relative === "docs/archive" ||
      relative.startsWith("docs/archive/") ||
      relative === "node_modules" ||
      relative.startsWith("node_modules/")
    ) {
      continue;
    }

    if (statSync(absolute).isDirectory()) {
      files.push(...walkFiles(absolute, predicate));
    } else if (predicate(absolute)) {
      files.push(absolute);
    }
  }
  return files;
}

export function extractMarkdownLinks(markdown) {
  const links = [];
  const pattern = /!?\[[^\]]*]\(([^)]+)\)/g;
  for (const match of markdown.matchAll(pattern)) {
    let target = match[1].trim();
    if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
    target = target.replace(/\s+["'][^"']*["']$/, "");
    links.push(target);
  }
  return links;
}

export function hasValidNoImpactReason(text = "") {
  return /Docs-impact:\s*none\s*[-—:]\s*\S.{19,}/i.test(text);
}

export function collectUndocumentedEndpoints(endpointPaths, apiReference) {
  return endpointPaths
    .map(normalize)
    .filter((file) => file.startsWith("api/") && file.endsWith(".ts"))
    .filter((file) => !apiReference.includes(file));
}

export function evaluateImpact(changedFiles) {
  const changed = new Set(changedFiles.map(normalize));
  const failures = [];

  for (const rule of IMPACT_RULES) {
    const sources = [...changed].filter(rule.source);
    if (sources.length === 0) continue;
    if (!rule.docs.some((document) => changed.has(document))) {
      failures.push({ name: rule.name, sources, docs: rule.docs });
    }
  }
  return failures;
}

function getActiveMarkdownFiles() {
  const roots = ["README.md", "AGENTS.md", "docs", "supabase/AGENTS.md", "src/routes/README.md"];
  const files = [];

  for (const item of roots) {
    const absolute = path.join(ROOT, item);
    if (!existsSync(absolute)) continue;
    if (statSync(absolute).isDirectory()) {
      files.push(...walkFiles(absolute, (file) => file.endsWith(".md")));
    } else {
      files.push(absolute);
    }
  }
  return files;
}

function validateLinks() {
  const errors = [];

  for (const file of getActiveMarkdownFiles()) {
    const markdown = readFileSync(file, "utf8");
    const relativeFile = normalize(path.relative(ROOT, file));
    if (WINDOWS_ABSOLUTE_RE.test(markdown)) {
      errors.push(`${relativeFile}: contiene una ruta privada o file:///`);
    }

    for (const rawTarget of extractMarkdownLinks(markdown)) {
      if (/^(?:https?:|mailto:|#)/i.test(rawTarget)) continue;

      const targetWithoutFragment = rawTarget.split("#", 1)[0];
      if (!targetWithoutFragment) continue;

      let decodedTarget;
      try {
        decodedTarget = decodeURIComponent(targetWithoutFragment);
      } catch {
        errors.push(`${relativeFile}: enlace con codificación inválida: ${rawTarget}`);
        continue;
      }

      const resolved = decodedTarget.startsWith("/")
        ? path.join(ROOT, decodedTarget.slice(1))
        : path.resolve(path.dirname(file), decodedTarget);

      if (!existsSync(resolved)) {
        errors.push(`${relativeFile}: enlace inexistente: ${rawTarget}`);
      }
    }
  }
  return errors;
}

function validateTasks() {
  const taskDirectory = path.join(ROOT, "docs/tasks");
  if (!existsSync(taskDirectory)) return ["Falta docs/tasks/"];

  const errors = [];
  for (const file of readdirSync(taskDirectory).filter((entry) => entry.endsWith(".md"))) {
    if (file === "README.md") continue;
    if (!TASK_NAME_RE.test(file)) {
      errors.push(`docs/tasks/${file}: nombre sin fecha o identificador único`);
    }
    const content = readFileSync(path.join(taskDirectory, file), "utf8");
    if (!/^Estado:\s*\S+/m.test(content)) {
      errors.push(`docs/tasks/${file}: falta Estado`);
    }
  }
  return errors;
}

function validateEndpointCoverage() {
  const endpointPaths = walkFiles(path.join(ROOT, "api"), (file) => file.endsWith(".ts")).map(
    (file) => normalize(path.relative(ROOT, file)),
  );
  const referencePath = path.join(ROOT, "docs/technical/08-api-reference.md");
  if (!existsSync(referencePath)) return ["Falta docs/technical/08-api-reference.md"];

  return collectUndocumentedEndpoints(endpointPaths, readFileSync(referencePath, "utf8")).map(
    (endpoint) => `Endpoint no documentado: ${endpoint}`,
  );
}

function validateTooling() {
  const errors = [];
  const lockfiles = [
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lock",
    "bun.lockb",
  ].filter((file) => existsSync(path.join(ROOT, file)));
  if (lockfiles.length !== 1 || lockfiles[0] !== "package-lock.json") {
    errors.push(
      `Debe existir solo package-lock.json; encontrados: ${lockfiles.join(", ") || "ninguno"}`,
    );
  }

  const packageJson = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
  if (packageJson.packageManager) {
    errors.push(
      "package.json no debe declarar otro gestor mientras package-lock.json sea canónico",
    );
  }
  if (packageJson.engines?.node !== ">=22.13.0") {
    errors.push('package.json debe declarar engines.node = ">=22.13.0"');
  }
  if (readFileSync(path.join(ROOT, ".nvmrc"), "utf8").trim() !== "22.13.0") {
    errors.push(".nvmrc debe fijar 22.13.0");
  }
  return errors;
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map(normalize)
    .filter(Boolean);
}

function getChangedFiles(baseRef) {
  if (baseRef) {
    try {
      return gitOutput(["diff", "--name-only", "--diff-filter=ACDMRTUXB", `${baseRef}...HEAD`]);
    } catch {
      return gitOutput(["diff", "--name-only", "--diff-filter=ACDMRTUXB", baseRef, "HEAD"]);
    }
  }

  return [
    ...gitOutput(["diff", "--name-only", "--diff-filter=ACDMRTUXB", "HEAD"]),
    ...gitOutput(["ls-files", "--others", "--exclude-standard"]),
  ];
}

function readBaseArgument(argv) {
  const index = argv.indexOf("--base");
  const baseRef = index >= 0 ? argv[index + 1] : process.env.DOCS_BASE_REF;
  return baseRef && !/^0+$/.test(baseRef) ? baseRef : undefined;
}

export function runChecks({ baseRef, noImpactText = "" } = {}) {
  const errors = [
    ...validateLinks(),
    ...validateTasks(),
    ...validateEndpointCoverage(),
    ...validateTooling(),
  ];

  const changedFiles = getChangedFiles(baseRef);
  const impactFailures = evaluateImpact(changedFiles);
  if (impactFailures.length > 0 && !hasValidNoImpactReason(noImpactText)) {
    for (const failure of impactFailures) {
      errors.push(
        `${failure.name}: cambiaron ${failure.sources.join(", ")} sin actualizar ${failure.docs.join(" o ")}`,
      );
    }
  }

  return { errors, changedFiles, impactFailures };
}

function main() {
  const result = runChecks({
    baseRef: readBaseArgument(process.argv.slice(2)),
    noImpactText: process.env.DOCS_NO_IMPACT_REASON ?? "",
  });

  if (result.errors.length > 0) {
    console.error("Validación documental fallida:");
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  if (result.impactFailures.length > 0) {
    console.warn("Impacto documental omitido con justificación explícita.");
  }
  console.log(`Validación documental correcta (${result.changedFiles.length} archivos cambiados).`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) main();

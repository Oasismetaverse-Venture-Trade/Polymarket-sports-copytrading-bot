import { Chalk } from "chalk";
import stripAnsi from "strip-ansi";
import {logger} from "chalk-prettier";

const chalk = new Chalk({
  level: process.env.NO_COLOR ? 0 : 3
});

const PAL = ["#ff0080", "#b24bff", "#00c6ff", "#00ffc8", "#c8ff00", "#ff9f1a"];

let tableStarted = false;

function termCols(): number {
  return Math.max(52, Math.min(96, process.stdout.columns || 80));
}

function vis(s: string): number {
  return stripAnsi(s).length;
}

function gradientText(text: string): string {
  return [...text].map((c, i) => chalk.hex(PAL[i % PAL.length]!)(c)).join("");
}

function fit(s: string, max: number): string {
  const plain = stripAnsi(s);
  if (plain.length <= max) return s;
  return chalk.dim(plain.slice(0, Math.max(1, max - 1)) + "…");
}

function centerLine(s: string, width: number): string {
  const v = vis(s);
  const pad = Math.max(0, Math.floor((width - v) / 2));
  return " ".repeat(pad) + s;
}

function primitiveKv(
  obj: Record<string, unknown>,
  skip: Set<string>
): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (skip.has(k)) continue;
    if (v === null || v === undefined) continue;
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean") {
      out.push(`${k}: ${String(v)}`);
    }
  }
  return out;
}

export function printSportResultColoredTable(p: unknown): void {
  if (!p || typeof p !== "object") {
    console.log(chalk.dim(`sport_result ${String(p)}`));
    return;
  }
  const o = p as Record<string, unknown>;
  const es =
    o.eventState && typeof o.eventState === "object"
      ? (o.eventState as Record<string, unknown>)
      : null;

  const league = String(o.leagueAbbreviation ?? "—");
  const home = String(o.homeTeam ?? "—");
  const away = String(o.awayTeam ?? "—");
  const score = String(o.score ?? es?.score ?? "—");
  const period = String(o.period ?? es?.period ?? "—");
  const status = String(o.status ?? "—");
  const gameId = o.gameId != null ? String(o.gameId) : "—";
  const live = Boolean(o.live ?? es?.live);
  const ended = Boolean(o.ended ?? es?.ended);
  const tournament = String(es?.tournamentName ?? "");
  const round = String(es?.tennisRound ?? es?.round ?? "");
  const sport = String(es?.type ?? "—");

  const W = termCols();
  const innerW = W - 4;

  const B = chalk.hex("#9575cd");
  const edge = chalk.hex("#7e57c2");
  const top = B("╔") + edge("═".repeat(W - 2)) + B("╗");
  const mid = B("╠") + chalk.hex("#5e35b1")("═".repeat(W - 2)) + B("╣");

  const boxLine = (inner: string): string => {
    if (vis(inner) <= innerW) {
      const pad = Math.max(0, innerW - vis(inner));
      return B("║") + " " + inner + " ".repeat(pad) + " " + B("║");
    }
    const plain = stripAnsi(inner);
    const t = plain.slice(0, Math.max(1, innerW - 1)) + "…";
    const out = chalk.gray(t);
    const pad = Math.max(0, innerW - vis(out));
    return B("║") + " " + out + " ".repeat(pad) + " " + B("║");
  };

  const badgeLive = live
    ? chalk.bgHex("#1b5e20").white.bold(" LIVE ")
    : chalk.bgHex("#455a64").white(" IDLE ");
  const badgeEnd = ended ? chalk.hex("#ff1744").bold(" FINAL ") : chalk.hex("#90a4ae")(" — ");

  const half = Math.floor((innerW - 5) / 2);
  const vsRow =
    chalk.hex("#eceff1").bold(fit(home, half)) +
    chalk.hex("#ff4081").bold("  ⚔  ") +
    chalk.hex("#eceff1").bold(fit(away, innerW - half - 5));

  const scoreInner =
    chalk.bgHex("#4a148c").white.bold(" SCORE ") +
    "  " +
    chalk.bold.hex("#ffeb3b")(score) +
    "    " +
    chalk.hex("#ce93d8")("◆") +
    "    " +
    chalk.bgHex("#00695c").white.bold(` ${period} `);

  const headline =
    chalk.bold.hex("#ffe082")(league.toUpperCase()) +
    (tournament ? chalk.hex("#b0bec5")(`  ·  ${tournament}`) : "") +
    "    " +
    badgeLive +
    badgeEnd +
    "    " +
    chalk.hex("#b39ddb")(sport);

  const metaLine =
    chalk.hex("#80deea")("status") +
    chalk.white.bold(` ${fit(status, 28)}`) +
    chalk.hex("#607d8b")("  ·  ") +
    chalk.hex("#80deea")("gameId") +
    chalk.white.bold(` ${gameId}`);

  const skipRoot = new Set([
    "eventState",
    "leagueAbbreviation",
    "homeTeam",
    "awayTeam",
    "score",
    "period",
    "status",
    "gameId",
    "live",
    "ended"
  ]);
  const skipEs = new Set([
    "score",
    "period",
    "live",
    "ended",
    "tournamentName",
    "tennisRound",
    "round",
    "type"
  ]);

  const extraRoot = primitiveKv(o, skipRoot);
  const extraEs = es ? primitiveKv(es, skipEs) : [];
  const extraLine =
    [...extraRoot, ...extraEs].length > 0
      ? chalk.hex("#9e9e9e")(extraRoot.concat(extraEs).join("  ·  "))
      : "";

  const roundLine = round ? chalk.italic.hex("#e1bee7")(round) : "";

  const ornament = chalk.hex("#5c6bc0")("·━".repeat(Math.floor((W - 4) / 2)) + "·");

  if (!tableStarted) {
    tableStarted = true;
    logger.info("sportResultTable started");
    console.log();
    console.log(chalk.dim(centerLine(ornament, W)));
    console.log(centerLine(gradientText(" ◆  LIVE SPORTS  ◆ "), W));
    console.log(chalk.hex("#5c6bc0")(centerLine("─".repeat(W - 4), W)));
    console.log(top);
  } else {
    console.log(mid);
  }

  console.log(boxLine(""));
  console.log(boxLine(headline));
  if (roundLine) console.log(boxLine(roundLine));
  console.log(boxLine(""));
  console.log(boxLine(vsRow));
  console.log(boxLine(""));
  console.log(boxLine(scoreInner));
  console.log(boxLine(""));
  console.log(boxLine(metaLine));
  if (extraLine) console.log(boxLine(extraLine));
}

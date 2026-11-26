#!/usr/bin/env python3
"""
Auditor Formal de Rastreabilidade Bidirecional (RTM) — ISO/IEC/IEEE 29148
Inspeciona automaticamente:
1. Todos os Requisitos Funcionais (RF-XX) e Não-Funcionais (RNF-XX) declarados em docs/requirements/SRS.md;
2. Presença e status de mapeamento correspondente em docs/requirements/RTM.md;
3. Existência física dos arquivos de ADRs referenciados na RTM;
4. Existência física das User Stories core referenciadas na RTM em docs/backlog/user-stories/;
5. Existência física de todas as suítes de teste automatizadas listadas na Seção 4 da RTM.

Retorna código 0 se 100% íntegro e sem órfãos, ou código 1 detalhando inconsistências.
"""

import os
import re
import sys
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    srs_path = repo_root / "docs" / "requirements" / "SRS.md"
    rtm_path = repo_root / "docs" / "requirements" / "RTM.md"
    us_dir = repo_root / "docs" / "backlog" / "user-stories"
    adr_dir = repo_root / "docs" / "architecture" / "adrs"

    errors: list[str] = []

    if not srs_path.exists():
        print(f"[ERRO] Arquivo SRS não encontrado: {srs_path}")
        return 1
    if not rtm_path.exists():
        print(f"[ERRO] Arquivo RTM não encontrado: {rtm_path}")
        return 1

    srs_text = srs_path.read_text(encoding="utf-8")
    rtm_text = rtm_path.read_text(encoding="utf-8")

    # 1. Extrair RF-XX e RNF-XX do SRS.md
    srs_rfs = sorted(set(re.findall(r"\[(RF-\d+)\]", srs_text)))
    srs_rnfs = sorted(set(re.findall(r"\[(RNF-\d+)\]", srs_text)))

    # 2. Extrair RF-XX e RNF-XX mapeados em linhas de tabela da RTM.md
    rtm_rfs = sorted(set(re.findall(r"\|\s*\*\*(RF-\d+)\*\*\s*\|", rtm_text)))
    rtm_rnfs = sorted(set(re.findall(r"\|\s*\*\*(RNF-\d+)\*\*\s*\|", rtm_text)))

    orphan_rfs = set(srs_rfs) - set(rtm_rfs)
    ghost_rfs = set(rtm_rfs) - set(srs_rfs)
    orphan_rnfs = set(srs_rnfs) - set(rtm_rnfs)
    ghost_rnfs = set(rtm_rnfs) - set(srs_rnfs)

    for rf in sorted(orphan_rfs):
        errors.append(f"Requisito Funcional órfão no SRS sem cobertura na RTM: {rf}")
    for rf in sorted(ghost_rfs):
        errors.append(f"Requisito Funcional na RTM inexistente no SRS: {rf}")
    for rnf in sorted(orphan_rnfs):
        errors.append(f"Requisito Não-Funcional órfão no SRS sem cobertura na RTM: {rnf}")
    for rnf in sorted(ghost_rnfs):
        errors.append(f"Requisito Não-Funcional na RTM inexistente no SRS: {rnf}")

    # 3. Verificar User Stories (US-XX) citadas na RTM contra arquivos reais
    rtm_us_ids = sorted(set(re.findall(r"`(US-\d+)`", rtm_text)))
    us_files = [p.name for p in us_dir.glob("US-*.md")] if us_dir.exists() else []
    for us_id in rtm_us_ids:
        if not any(fname.startswith(f"{us_id}-") or fname == f"{us_id}.md" for fname in us_files):
            errors.append(f"User Story referenciada na RTM não possui arquivo em docs/backlog/user-stories/: {us_id}")

    # 4. Verificar ADRs (ADR-XXX) citadas na RTM contra arquivos reais
    rtm_adr_ids = sorted(set(re.findall(r"`(ADR-\d+)`", rtm_text)))
    adr_files = [p.name for p in adr_dir.glob("ADR-*.md")] if adr_dir.exists() else []
    for adr_id in rtm_adr_ids:
        if not any(fname.startswith(f"{adr_id}-") for fname in adr_files):
            errors.append(f"ADR referenciada na RTM não possui arquivo em docs/architecture/adrs/: {adr_id}")

    # 5. Verificar arquivos de teste automatizados citados na RTM contra o filesystem
    rtm_test_files = sorted(set(re.findall(r"(test_[a-zA-Z0-9_]+\.(?:py|test\.js|js))", rtm_text)))
    all_repo_files = {
        p.name
        for p in repo_root.rglob("test_*")
        if "node_modules" not in p.parts and ".git" not in p.parts
    }
    for test_file in rtm_test_files:
        if test_file not in all_repo_files:
            errors.append(f"Suíte de teste referenciada na RTM não encontrada no repositório: {test_file}")

    print("=" * 72)
    print(" AUDITORIA FORMAL DE RASTREABILIDADE (RTM — ISO/IEC/IEEE 29148)")
    print("=" * 72)
    print(f" • Requisitos Funcionais auditados (SRS <-> RTM):     {len(srs_rfs)}/{len(rtm_rfs)}")
    print(f" • Requisitos Não-Funcionais auditados (SRS <-> RTM): {len(srs_rnfs)}/{len(rtm_rnfs)}")
    print(f" • User Stories BDD vinculadas e verificadas:         {len(rtm_us_ids)}")
    print(f" • Decisões Arquiteturais (ADRs) verificadas:         {len(rtm_adr_ids)}")
    print(f" • Suítes de Teste Automatizadas verificadas:         {len(rtm_test_files)}")
    print("-" * 72)

    if errors:
        print(f"[FALHA] {len(errors)} violação(ões) de rastreabilidade detectada(s):")
        for err in errors:
            print(f"  ✗ {err}")
        return 1

    print("[APROVADO] 100% de rastreabilidade bidirecional íntegra e zero requisitos órfãos!")
    return 0


if __name__ == "__main__":
    sys.exit(main())

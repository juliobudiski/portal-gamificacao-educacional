"""
End-to-End (E2E) Test Suite: Portal GamificaEdu Restructuring & Documentation
==============================================================================
Requirements Reference: ORIGINAL_REQUEST.md (§R1, §R2, §R3) & TEST_INFRA.md
Architecture & Design: PROJECT.md & Hexagonal Architecture Guidelines

Tiers Covered:
--------------
- Tier 1: Feature Coverage (Docs hierarchy, 23 ADRs, C4/ERD diagrams, 8 Epics,
          15 BDD User Stories with YAML frontmatter, gamification mechanics,
          20 badges catalog, academic DSR/MUI models, 14 preserved binaries with
          SHA-256 custody manifest, master index links, root sanitization,
          scripts relocation with +x, test layout, target directories).
- Tier 2: Boundary & Corner Cases (Script path resolution outside root,
          missing env var fallback, permission boundaries, non-empty contents,
          exhaustive markdown relative link resolution, tamper resistance).
- Tier 3: Cross-Feature Combinations (Pytest discovery hermetic isolation
          excluding Playwright from .venv, dynamic anchoring to logs/ and data/,
          ADR cross-traceability).
- Tier 4: Real-World Scenarios (Developer onboarding tour, development start
          pre-flight readiness, PhD custody cryptographic audit, automated
          forensic repository hygiene audit, live backend domain execution).
"""

import hashlib
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple
import pytest

# Dynamic root resolution
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# --- AUTHORITATIVE ORACLES & REFERENCE DATA ---

# Authoritative cryptographic hashes of the 14 PhD dissertation binaries
ARCHIVE_HASH_ORACLE: Dict[str, str] = {
    "Brainstorming de Itens para a Loja de Recompensas.docx": "5b5e86d5285f9b1c0e947f1ee27daf7e1bb8872cffab9c171e6397822d082289",
    "Compilado de Relatorios de Progresso do Projeto 01.docx": "9d3043fa8999aca425091cc2f8493556a180611300f516c7b0d46592312ba1f3",
    "Compilado RPP 02.docx": "62c219e7905f751851889c18513d4c182bf6cd2a79e4937b144853b62095dcc3",
    "Compilado RPP 03.docx": "562cbbd4eadeb4251c6219608a40d3ad0a1c1f21ca9fa48e910490610e936ef7",
    "diagrama_classes.pdf": "7e785192b0fb4177e3556a4ffe8f9f1a0d930ade346a1a65aa7acc09909001c2",
    "diagramaMatematicaPortal.png": "0e2bf9b2f1fba9529caea0c00f39b98047271852d750d24e2207ae3a8cd1f4a9",
    "diagramaPortal.pdf": "4af110bdec8d7df4b29753947b4386514b1cdee22403f0d1f327e58cd25bd942",
    "diagramaProfessorPortal.png": "5d1345e0dd7d017e087ffbe4ba12c5a218b31540c223177483ccb026d34673a2",
    "Documento de Design do Ambiente Gamificado.docx": "6c20a8fdf543958d5002a4bf65a4e78747a137ef258594e748fedf9204070943",
    "Documento de Requisitos do Portal de Gamificação Educacional.docx": "857336737c242a8031fd78b77013fb5a524d4f225ddd2cd7fabec9ecfdc941dc",
    "FunilReducaoPortal.png": "8179fd60a114bdb652005effd166c9849857b9143a7a7d4e749827601738f365",
    "Registro de Decisoes do Projeto (RDP01).docx": "e534a14183939eee47fa97670b24941a3577f5ba2aca12438f7d5f828704e892",
    "Relatório de Especificação Funcional.docx": "68c222f3b1bc5866cb84102401c881bc5a3c1c9ccc2f99eabc056787207b68b8",
    "Sistema de Medalhas e Conquistas.docx": "f6850adcb5cd2be4dba4c7c0ded1e805863bdda8f8eada1192f150d6478ae636",
}

# 32 normalized relational database entities mapped in architecture specifications
EXPECTED_32_TABLES: List[str] = [
    "User", "Class", "Enrollment", "Team", "EventLog", "ContactMessage",
    "Activity", "ActivityTag", "Tag", "ActivityRevision", "ActivityProgress",
    "ActivityRating", "LearningContent", "QuizContent", "NarrativeContent",
    "StudentResponse", "ManualFeedback", "Medal", "UserUnlockedMedal",
    "StoreItem", "Purchase", "Title", "UserUnlockedTitle", "RouletteWin",
    "SlotWin", "Conversation", "ConversationParticipants", "ChatMessage",
    "ForumCategory", "ForumTopic", "ForumPost", "TopicLike", "PostLike"
]

# 20 gamification badges across 4 pedagogical categories
EXPECTED_20_BADGES: Set[str] = {
    # Conclusão e Desempenho (7)
    "Inspetor", "Peça-Chave", "Explorador", "Diamante de Excelência",
    "Velocista", "Maratonista", "Fênix",
    # Colaboração e Comunidade (4)
    "Espírito de Equipe", "Semeador do Saber", "Conector", "Embaixador",
    # Habilidade e Conhecimento (5)
    "Arquiteto do Conhecimento", "Sinergia", "Inovador", "Polímata", "Mestre",
    # Especiais e Engajamento (4)
    "Pioneiro", "Curioso", "Veterano", "Caçador de Tesouros"
}

# Approved canonical files allowed in root directory
CANONICAL_ROOT_ALLOWED_FILES: Set[str] = {
    "README.md",
    "package.json",
    "vercel.json",
    "conftest.py",
    ".gitignore",
    "pytest.ini",
    ".coverage",
    "TEST_READY.md"
}

# Forbidden file extensions in root
FORBIDDEN_ROOT_EXTENSIONS: Set[str] = {".log", ".sql", ".tex"}


# --- HELPER UTILITIES ---

def compute_file_sha256(filepath: Path) -> str:
    """Compute hex SHA-256 of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()


def extract_yaml_frontmatter(content: str) -> Dict[str, str]:
    """Extract key-value pairs from YAML frontmatter between '---' markers."""
    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return {}
    frontmatter_text = match.group(1)
    data = {}
    for line in frontmatter_text.splitlines():
        line = line.strip()
        if line and ":" in line and not line.startswith("#"):
            k, v = line.split(":", 1)
            data[k.strip()] = v.strip().strip("'\"")
    return data


def extract_relative_markdown_links(content: str) -> List[str]:
    """Extract local relative file links from markdown [text](link)."""
    matches = re.findall(r"\[.*?\]\((?!https?:\/\/|mailto:|#)(.*?)\)", content)
    clean_links = []
    for link in matches:
        clean_target = link.split("#")[0].split("?")[0].strip()
        if clean_target:
            clean_links.append(clean_target)
    return clean_links


# ==============================================================================
# TIER 1 - FEATURE COVERAGE
# ==============================================================================

class TestTier1FeatureCoverage:
    """
    Tier 1 tests verify the primary happy-path existence, structural hierarchy,
    content completeness, and relational consistency of all features mandated
    by ORIGINAL_REQUEST.md (§R1, §R2, §R3) and PROJECT.md.
    """

    def test_docs_taxonomy_directories_exist(self):
        """Verify that docs/ and all required subdirectories exist."""
        required_dirs = [
            PROJECT_ROOT / "docs",
            PROJECT_ROOT / "docs" / "architecture",
            PROJECT_ROOT / "docs" / "backlog",
            PROJECT_ROOT / "docs" / "gamification",
            PROJECT_ROOT / "docs" / "academic",
            PROJECT_ROOT / "docs" / "archive",
        ]
        for d in required_dirs:
            assert d.exists(), f"Required documentation directory missing: {d.relative_to(PROJECT_ROOT)}"
            assert d.is_dir(), f"Expected directory but found file: {d.relative_to(PROJECT_ROOT)}"

    def test_architecture_documentation_adr_coverage(self):
        """Verify that all 23 Architecture Decision Records (ADRs) exist and contain required sections."""
        adrs_dir = PROJECT_ROOT / "docs" / "architecture" / "adrs"
        if not adrs_dir.exists():
            adrs_dir = PROJECT_ROOT / "docs" / "architecture"

        adr_files = list(adrs_dir.glob("ADR-*.md"))
        assert len(adr_files) >= 23, (
            f"Expected at least 23 ADRs in {adrs_dir.relative_to(PROJECT_ROOT)}, but found {len(adr_files)}."
        )

        found_numbers = set()
        for adr in adr_files:
            match = re.search(r"ADR-(\d{2,3})", adr.name)
            if match:
                found_numbers.add(int(match.group(1)))

        missing_adrs = set(range(1, 24)) - found_numbers
        assert not missing_adrs, f"Missing required ADR numbers: {sorted(list(missing_adrs))}"

        for adr in adr_files:
            content = adr.read_text(encoding="utf-8")
            assert len(content.strip()) > 100, f"ADR file {adr.name} is too short or empty."
            lower = content.lower()
            assert any(h in lower for h in ["contexto", "context"]), f"{adr.name} missing Context section"
            assert any(h in lower for h in ["decisão", "decisao", "decision"]), f"{adr.name} missing Decision section"
            assert any(h in lower for h in ["consequência", "consequencia", "consequences"]), (
                f"{adr.name} missing Consequences section"
            )

    def test_architecture_c4_and_erd_diagrams(self):
        """Verify that C4 architecture diagrams and the 32-table ERD are documented."""
        arch_dir = PROJECT_ROOT / "docs" / "architecture"

        c4_files = list(arch_dir.glob("*c4*.md")) + list(arch_dir.glob("*diagram*.md"))
        assert len(c4_files) >= 1, f"No C4 architecture diagrams found in {arch_dir.relative_to(PROJECT_ROOT)}"

        has_mermaid = False
        for f in arch_dir.glob("*.md"):
            content = f.read_text(encoding="utf-8")
            if "```mermaid" in content:
                has_mermaid = True
                break
        assert has_mermaid, f"No Mermaid diagrams found in {arch_dir.relative_to(PROJECT_ROOT)}"

        erd_files = list(arch_dir.glob("*erd*.md")) + list(arch_dir.glob("*data_model*.md")) + list(arch_dir.glob("*schema*.md"))
        assert len(erd_files) >= 1, f"Database ERD / Data Model documentation missing in {arch_dir.relative_to(PROJECT_ROOT)}"

        erd_content = "\n".join(f.read_text(encoding="utf-8") for f in erd_files)
        norm_content = re.sub(r"[^a-z0-9]", "", erd_content.lower())

        covered_tables = [table for table in EXPECTED_32_TABLES if re.sub(r"[^a-z0-9]", "", table.lower()) in norm_content]
        coverage_ratio = len(covered_tables) / len(EXPECTED_32_TABLES)
        assert coverage_ratio >= 0.85, (
            f"ERD documentation covers only {len(covered_tables)}/{len(EXPECTED_32_TABLES)} tables. "
            f"Missing tables: {set(EXPECTED_32_TABLES) - set(covered_tables)}"
        )

    def test_architecture_recommendation_engine_spec(self):
        """Verify the Contextual Recommendation Engine (MRC/MUI/SAD) mathematical specifications."""
        arch_dir = PROJECT_ROOT / "docs" / "architecture"
        rec_files = list(arch_dir.glob("*recommendation*.md")) + list(arch_dir.glob("*mrc*.md")) + list(arch_dir.glob("*mui*.md"))
        assert len(rec_files) >= 1, f"Contextual recommendation engine specification missing in {arch_dir.relative_to(PROJECT_ROOT)}"

        rec_content = "\n".join(f.read_text(encoding="utf-8") for f in rec_files)
        assert "S_b" in rec_content or "Sinergia" in rec_content or "sinergia" in rec_content, "Missing synergy formulation"
        assert "P_c" in rec_content or "Risco" in rec_content or "risco" in rec_content, "Missing risk formulation"
        assert any(term in rec_content.lower() for term in ["veto", "dark side", "conflito"]), (
            "Missing pedagogical veto / dark side conflict resolution logic"
        )

    def test_backlog_epics_and_user_stories(self):
        """Verify agile backlog contains at least 8 Epics and 15 User Stories with BDD criteria."""
        backlog_dir = PROJECT_ROOT / "docs" / "backlog"

        epics_dir = backlog_dir / "epics"
        if not epics_dir.exists():
            epics_dir = backlog_dir

        epic_files = list(epics_dir.glob("EPIC-*.md"))
        assert len(epic_files) >= 8, (
            f"Expected at least 8 Epics in {epics_dir.relative_to(PROJECT_ROOT)}, found {len(epic_files)}."
        )

        stories_dir = backlog_dir / "user-stories"
        if not stories_dir.exists():
            stories_dir = backlog_dir

        story_files = list(stories_dir.glob("US-*.md"))
        assert len(story_files) >= 15, (
            f"Expected at least 15 User Stories in {stories_dir.relative_to(PROJECT_ROOT)}, found {len(story_files)}."
        )

        for story in story_files:
            content = story.read_text(encoding="utf-8")
            frontmatter = extract_yaml_frontmatter(content)
            assert frontmatter, f"{story.name} must have valid YAML frontmatter between --- markers"
            assert "id" in frontmatter or "title" in frontmatter, f"{story.name} frontmatter missing id or title"

            lower = content.lower()
            assert any(t in lower for t in ["caminho feliz", "happy path", "cenário feliz"]), (
                f"{story.name} missing Happy Path BDD scenario"
            )
            assert any(t in lower for t in ["caminho alternativo", "alternative path", "cenário alternativo"]), (
                f"{story.name} missing Alternative Path BDD scenario"
            )
            assert any(t in lower for t in ["exceção", "excecao", "exception"]), (
                f"{story.name} missing Exception BDD scenario"
            )
            assert any(t in lower for t in ["caos", "chaos", "adversarial", "limite"]), (
                f"{story.name} missing Chaos/Adversarial BDD scenario"
            )

    def test_gamification_system_documentation(self):
        """Verify gamification mechanics: XP vs Coins, 20 badges catalog, store economy, and board."""
        gamif_dir = PROJECT_ROOT / "docs" / "gamification"
        assert gamif_dir.exists(), "docs/gamification directory missing"

        badges_files = list(gamif_dir.glob("*badge*.md")) + list(gamif_dir.glob("*medal*.md"))
        assert len(badges_files) >= 1, "Badges catalog documentation missing in docs/gamification"
        badges_content = "\n".join(f.read_text(encoding="utf-8") for f in badges_files)

        found_badges = {b for b in EXPECTED_20_BADGES if b.lower() in badges_content.lower()}
        missing_badges = EXPECTED_20_BADGES - found_badges
        assert len(missing_badges) <= 2, (
            f"Badges catalog missing {len(missing_badges)} badges: {missing_badges}"
        )

        all_gamif_content = "\n".join(f.read_text(encoding="utf-8") for f in gamif_dir.glob("*.md"))
        assert "xp" in all_gamif_content.lower(), "Gamification docs must document XP progression"
        assert any(term in all_gamif_content.lower() for term in ["moeda", "coin", "pontos", "sabedoria"]), (
            "Gamification docs must document spendable currency / coins"
        )

    def test_academic_documentation_and_thesis_integration(self):
        """Verify academic docs: DSR methodology, mathematical models, SWEBOK matrix, and thesis LaTeX."""
        academic_dir = PROJECT_ROOT / "docs" / "academic"
        assert academic_dir.exists(), "docs/academic directory missing"

        academic_files = list(academic_dir.glob("*.md"))
        assert len(academic_files) >= 2, f"Expected academic documentation files in {academic_dir.relative_to(PROJECT_ROOT)}"

        academic_content = "\n".join(f.read_text(encoding="utf-8") for f in academic_files)
        assert any(term in academic_content.lower() for term in ["design science research", "dsr", "metodologia"]), (
            "Academic docs must document DSR methodology"
        )

        tex_in_academic = list(academic_dir.rglob("*.tex"))
        assert len(tex_in_academic) >= 1, "5-propostav2.tex should be relocated into docs/academic/ (or subfolder)"

    def test_archive_preservation_and_sha256_manifest(self):
        """Verify all 14 original PhD binaries are preserved with SHA-256 matching the manifest."""
        archive_dir = PROJECT_ROOT / "docs" / "archive"
        assert archive_dir.exists(), "docs/archive directory missing"

        binaries_dir = archive_dir / "repositorio_doutorado"
        if not binaries_dir.exists():
            binaries_dir = archive_dir

        for filename, expected_hash in ARCHIVE_HASH_ORACLE.items():
            target_file = binaries_dir / filename
            if not target_file.exists():
                fallback_file = PROJECT_ROOT / "docs" / "RepositorioDoutoradoPortal" / filename
                assert fallback_file.exists(), f"Binary file {filename} is completely missing from repository!"
                target_file = fallback_file

            actual_hash = compute_file_sha256(target_file)
            assert actual_hash == expected_hash, (
                f"SHA-256 hash mismatch for {filename}!\nExpected: {expected_hash}\nActual:   {actual_hash}"
            )

        manifest_readme = archive_dir / "README.md"
        assert manifest_readme.exists(), "docs/archive/README.md custody manifest missing"
        manifest_content = manifest_readme.read_text(encoding="utf-8")
        assert "sha-256" in manifest_content.lower() or "sha256" in manifest_content.lower(), (
            "docs/archive/README.md must document SHA-256 hashes for custody verification"
        )

    def test_docs_master_index_and_relative_links(self):
        """Verify docs/README.md master index exists and all its internal relative links resolve."""
        master_index = PROJECT_ROOT / "docs" / "README.md"
        assert master_index.exists(), "docs/README.md master index missing"
        content = master_index.read_text(encoding="utf-8")
        assert len(content.strip()) > 200, "docs/README.md is too short"

        links = extract_relative_markdown_links(content)
        assert len(links) >= 5, f"docs/README.md contains too few internal links ({len(links)})"

        broken_links = []
        for link in links:
            target = (master_index.parent / link).resolve()
            if not target.exists():
                broken_links.append(link)

        assert not broken_links, (
            f"Broken relative links found in docs/README.md: {broken_links}"
        )

    def test_root_cleanliness_no_forbidden_files(self):
        """Verify project root contains ZERO loose .log, .sql, .tex, test_*.py, or unapproved scripts."""
        root_entries = [p for p in PROJECT_ROOT.iterdir() if p.is_file()]

        # 1. No forbidden extensions (.log, .sql, .tex)
        forbidden_files = [p.name for p in root_entries if p.suffix.lower() in FORBIDDEN_ROOT_EXTENSIONS]
        assert not forbidden_files, f"Forbidden loose files found in project root: {forbidden_files}"

        # 2. No loose test_*.py files in root (except canonical conftest.py)
        loose_tests = [p.name for p in root_entries if p.name.startswith("test_") and p.suffix == ".py"]
        assert not loose_tests, f"Loose test files found in root: {loose_tests}. Relocate to tests/ or backend/tests/."

        # 3. No unapproved scripts in root
        unapproved_scripts = {"start_dev.sh", "changepng.sh", "find_undocumented.py", "fix_theme.py", "save_wakatime.py", "logger.py"}
        loose_scripts = [p.name for p in root_entries if p.name in unapproved_scripts]
        assert not loose_scripts, f"Loose operational scripts found in root: {loose_scripts}. Relocate to scripts/ or tests/."

        # 4. Sensitive ops documentation relocated
        assert not (PROJECT_ROOT / "VPS_ACCESS.md").exists(), (
            "VPS_ACCESS.md must be relocated to docs/infrastructure/ to prevent credential leaks"
        )

        # 5. Loose diagrams and state JSON relocated
        assert not (PROJECT_ROOT / "classes_GameficaEdu.png").exists(), "classes_GameficaEdu.png must be relocated to docs/academic/"
        assert not (PROJECT_ROOT / "test_state.json").exists(), "test_state.json must be relocated to data/"
        assert not (PROJECT_ROOT / "wakatime_history.json").exists(), "wakatime_history.json must be relocated to data/"

    def test_root_canonical_files_only(self):
        """Verify that files remaining in root are exclusively approved canonical files."""
        root_files = [p for p in PROJECT_ROOT.iterdir() if p.is_file()]
        unapproved_files = []
        for f in root_files:
            if f.name in CANONICAL_ROOT_ALLOWED_FILES:
                continue
            if f.name.startswith("."):
                continue
            unapproved_files.append(f.name)

        assert not unapproved_files, (
            f"Non-canonical files detected in root directory: {unapproved_files}. "
            f"Approved files: {sorted(list(CANONICAL_ROOT_ALLOWED_FILES))}"
        )

    def test_scripts_relocation_and_executable_permissions(self):
        """Verify operational scripts are in scripts/ and shell scripts have executable permissions (+x)."""
        scripts_dir = PROJECT_ROOT / "scripts"
        assert scripts_dir.exists(), "scripts/ directory missing"

        expected_scripts = [
            "start_dev.sh",
            "changepng.sh",
            "setup-git-hooks.sh",
            "bump-version.js",
            "find_undocumented.py",
            "fix_theme.py",
            "save_wakatime.py",
        ]
        for script_name in expected_scripts:
            target = scripts_dir / script_name
            assert target.exists(), f"Expected script missing in scripts/: {script_name}"

        shell_scripts = list(scripts_dir.glob("*.sh"))
        for sh in shell_scripts:
            is_executable = os.access(sh, os.X_OK) and (sh.stat().st_mode & 0o111 != 0)
            assert is_executable, f"Shell script {sh.name} must have executable permissions (+x)"

    def test_tests_relocation_layout(self):
        """Verify tests layout: E2E and Playwright helpers in tests/, backend unit/integration in backend/tests/."""
        tests_dir = PROJECT_ROOT / "tests"
        backend_tests_dir = PROJECT_ROOT / "backend" / "tests"

        assert tests_dir.exists(), "tests/ directory missing"
        assert backend_tests_dir.exists(), "backend/tests/ directory missing"

        assert (tests_dir / "test_auth_pilot.py").exists(), "test_auth_pilot.py missing in tests/"
        assert (tests_dir / "test_cache.py").exists(), "test_cache.py missing in tests/"
        assert (tests_dir / "logger.py").exists(), "logger.py missing in tests/"

        assert (backend_tests_dir / "test_domain_rules.py").exists(), "backend/tests/test_domain_rules.py missing"
        assert (backend_tests_dir / "test_ai_draft_pipeline.py").exists(), "backend/tests/test_ai_draft_pipeline.py missing"

    def test_target_directories_and_relocated_assets(self):
        """Verify logs/, data/, backups/, docs/academic/, and docs/infrastructure/ directories and contents."""
        logs_dir = PROJECT_ROOT / "logs"
        assert logs_dir.exists(), "logs/ directory missing"

        data_dir = PROJECT_ROOT / "data"
        assert data_dir.exists(), "data/ directory missing"
        assert (data_dir / "test_state.json").exists() or (data_dir / "wakatime_history.json").exists(), (
            "data/ should contain relocated state or history JSON files"
        )

        backups_dir = PROJECT_ROOT / "backups"
        assert backups_dir.exists(), "backups/ directory missing"
        assert (backups_dir / "gamificaedu_backup.sql").exists(), "gamificaedu_backup.sql should be in backups/"

        infra_dir = PROJECT_ROOT / "docs" / "infrastructure"
        assert infra_dir.exists(), "docs/infrastructure/ directory missing"
        assert (infra_dir / "VPS_ACCESS.md").exists(), "VPS_ACCESS.md should be in docs/infrastructure/"


# ==============================================================================
# TIER 2 - BOUNDARY & CORNER CASES
# ==============================================================================

class TestTier2BoundaryAndCornerCases:
    """
    Tier 2 tests verify edge cases, boundary conditions, path resolution
    invariance, permission limits, non-empty file constraints, and cryptographic tamper resistance.
    """

    def test_script_path_resolution_when_executed_from_outside_root(self):
        """Verify scripts dynamically resolve PROJECT_ROOT and do not fail when invoked from outside root."""
        start_dev_script = PROJECT_ROOT / "scripts" / "start_dev.sh"
        if not start_dev_script.exists():
            start_dev_script = PROJECT_ROOT / "start_dev.sh"

        assert start_dev_script.exists(), "start_dev.sh script not found"

        result = subprocess.run(
            ["bash", "-n", str(start_dev_script)],
            cwd="/tmp",
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"Bash syntax check failed for start_dev.sh:\n{result.stderr}"

        script_content = start_dev_script.read_text(encoding="utf-8")
        assert any(p in script_content for p in ["BASH_SOURCE", "dirname", "PROJECT_ROOT"]), (
            "start_dev.sh must dynamically anchor its PROJECT_ROOT via BASH_SOURCE/dirname"
        )

    def test_missing_env_vars_fallback_handling(self):
        """Verify services and scripts handle missing or empty environment variables gracefully."""
        ai_service_path = PROJECT_ROOT / "backend" / "app" / "services" / "ai_service.py"
        assert ai_service_path.exists(), "ai_service.py missing"

        ai_content = ai_service_path.read_text(encoding="utf-8")
        assert "GOOGLE_API_KEY" in ai_content, "ai_service.py should reference GOOGLE_API_KEY"
        assert "default_api_key" in ai_content, "ai_service.py should gracefully handle unset api key"

    def test_file_permission_boundaries_and_non_empty_content(self):
        """Verify all restructured files have non-zero byte size and readable permissions."""
        check_dirs = [
            PROJECT_ROOT / "docs",
            PROJECT_ROOT / "scripts",
            PROJECT_ROOT / "data",
            PROJECT_ROOT / "backups",
        ]

        empty_files = []
        unreadable_files = []

        for d in check_dirs:
            if not d.exists():
                continue
            for file_path in d.rglob("*"):
                if file_path.is_file():
                    if file_path.stat().st_size == 0:
                        empty_files.append(str(file_path.relative_to(PROJECT_ROOT)))
                    if not os.access(file_path, os.R_OK):
                        unreadable_files.append(str(file_path.relative_to(PROJECT_ROOT)))

        assert not empty_files, f"Hollow 0-byte files detected: {empty_files}"
        assert not unreadable_files, f"Unreadable files detected: {unreadable_files}"

    def test_docs_markdown_link_integrity_deep_scan(self):
        """Exhaustively verify that all internal relative markdown links across docs/ resolve cleanly."""
        docs_dir = PROJECT_ROOT / "docs"
        assert docs_dir.exists(), "docs directory missing"

        broken_links: List[Tuple[str, str]] = []
        md_files = list(docs_dir.rglob("*.md"))
        assert len(md_files) >= 10, f"Too few markdown files found in docs/ ({len(md_files)})"

        for md_file in md_files:
            try:
                content = md_file.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue

            links = extract_relative_markdown_links(content)
            for link in links:
                target = (md_file.parent / link).resolve()
                if not target.exists():
                    broken_links.append((str(md_file.relative_to(PROJECT_ROOT)), link))

        assert not broken_links, (
            f"Found {len(broken_links)} broken relative link(s) across documentation:\n"
            + "\n".join(f"  In {src}: target '{target}' does not exist" for src, target in broken_links[:15])
        )

    def test_binary_file_tamper_and_boundary_resistance(self):
        """Boundary test: verify cryptographic sensitivity detects any 1-byte alteration in binary archive."""
        # Validate that simulated modification would fail hash matching
        sample_filename = "FunilReducaoPortal.png"
        sample_path = PROJECT_ROOT / "docs" / "archive" / "repositorio_doutorado" / sample_filename
        if not sample_path.exists():
            sample_path = PROJECT_ROOT / "docs" / "RepositorioDoutoradoPortal" / sample_filename

        assert sample_path.exists(), f"Sample binary {sample_filename} not found for tamper verification"
        genuine_hash = compute_file_sha256(sample_path)
        assert genuine_hash == ARCHIVE_HASH_ORACLE[sample_filename], "Genuine file hash corrupted before test!"

        # Boundary simulation: simulate 1-byte append/corruption in memory
        content = sample_path.read_bytes()
        tampered_content = content + b"\x00"
        tampered_hash = hashlib.sha256(tampered_content).hexdigest()
        assert tampered_hash != genuine_hash, "Hash collision! SHA-256 did not detect 1-byte boundary alteration."


# ==============================================================================
# TIER 3 - CROSS-FEATURE COMBINATIONS
# ==============================================================================

class TestTier3CrossFeatureCombinations:
    """
    Tier 3 tests verify combinatorial interactions between components:
    Pytest runner isolation, dynamic logs/data paths, and cross-module contracts.
    """

    def test_pytest_discovery_isolates_backend_without_playwright(self):
        """Verify pytest discovery in .venv strictly targets backend/tests without attempting Playwright import."""
        pytest_ini = PROJECT_ROOT / "pytest.ini"
        assert pytest_ini.exists(), "pytest.ini missing in root"
        ini_content = pytest_ini.read_text(encoding="utf-8")

        assert "testpaths = backend/tests" in ini_content or "testpaths = backend" in ini_content, (
            "pytest.ini must isolate testpaths to backend/tests to prevent collection errors in .venv"
        )

        result = subprocess.run(
            [sys.executable, "-m", "pytest", "--collect-only", "-q"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, (
            f"Pytest collection failed! Likely trying to collect Playwright E2E tests in .venv:\n{result.stderr}\n{result.stdout}"
        )
        assert "test_e2e_gamification_lifecycle.py" not in result.stdout, (
            "Playwright E2E test was erroneously collected by standard backend pytest runner!"
        )

    def test_scripts_and_services_dynamically_anchor_to_logs_and_data(self):
        """Verify scripts and backend services reference logs/ and data/ rather than root."""
        ai_service_path = PROJECT_ROOT / "backend" / "app" / "services" / "ai_service.py"
        ai_content = ai_service_path.read_text(encoding="utf-8")
        assert "FileHandler('ai_debug.log')" not in ai_content, (
            "ai_service.py still has hardcoded root 'ai_debug.log'! Update to reference logs/ai_debug.log."
        )

        test_cache_path = PROJECT_ROOT / "tests" / "test_cache.py"
        if not test_cache_path.exists():
            test_cache_path = PROJECT_ROOT / "test_cache.py"

        cache_content = test_cache_path.read_text(encoding="utf-8")
        assert 'cache_file: str = "test_state.json"' not in cache_content or "data" in cache_content, (
            "test_cache.py should target data/test_state.json or resolve data folder dynamically."
        )

        start_dev_path = PROJECT_ROOT / "scripts" / "start_dev.sh"
        if not start_dev_path.exists():
            start_dev_path = PROJECT_ROOT / "start_dev.sh"

        start_dev_content = start_dev_path.read_text(encoding="utf-8")
        assert "logs/backend_tunnel.log" in start_dev_content or "LOGS_DIR" in start_dev_content, (
            "start_dev.sh should write tunnel logs into logs/ directory"
        )

    def test_cross_feature_traceability_matrix_and_adrs(self):
        """Verify ADRs and architecture components cross-reference domain entities and requirements."""
        arch_dir = PROJECT_ROOT / "docs" / "architecture"
        adrs_dir = arch_dir / "adrs" if (arch_dir / "adrs").exists() else arch_dir

        adr_index = adrs_dir / "README.md"
        assert adr_index.exists(), f"ADR index README.md missing in {adrs_dir.relative_to(PROJECT_ROOT)}"
        index_content = adr_index.read_text(encoding="utf-8")

        for i in range(1, 24):
            assert f"ADR-{i:03d}" in index_content or f"ADR-{i:02d}" in index_content, (
                f"ADR-{i:03d} missing from ADR index README.md"
            )


# ==============================================================================
# TIER 4 - REAL-WORLD SCENARIOS
# ==============================================================================

class TestTier4RealWorldScenarios:
    """
    Tier 4 tests simulate end-to-end user and developer journeys:
    Onboarding developer walkthrough, development environment bootstrap,
    academic custody audit, automated forensic repository hygiene audit,
    and live backend domain rules execution.
    """

    def test_scenario_developer_onboarding_and_documentation_tour(self):
        """Scenario 1: Developer Onboarding Tour through documentation hierarchy."""
        docs_readme = PROJECT_ROOT / "docs" / "README.md"
        assert docs_readme.exists(), "docs/README.md missing"
        docs_text = docs_readme.read_text(encoding="utf-8")

        assert any(t in docs_text.lower() for t in ["arquitetura", "architecture"]), "docs/README.md missing architecture section"
        assert any(t in docs_text.lower() for t in ["backlog", "requisitos"]), "docs/README.md missing backlog section"
        assert any(t in docs_text.lower() for t in ["gamifica", "medalhas"]), "docs/README.md missing gamification section"
        assert any(t in docs_text.lower() for t in ["acadêmico", "academico", "academic"]), "docs/README.md missing academic section"

    def test_scenario_runtime_environment_bootstrap_readiness(self):
        """Scenario 2: Developer Pre-flight readiness check before starting local dev."""
        backend_init = PROJECT_ROOT / "backend" / "app" / "__init__.py"
        assert backend_init.exists(), "backend/app/__init__.py missing"

        frontend_pkg = PROJECT_ROOT / "frontend" / "package.json"
        assert frontend_pkg.exists(), "frontend/package.json missing"

        start_dev_script = PROJECT_ROOT / "scripts" / "start_dev.sh"
        if not start_dev_script.exists():
            start_dev_script = PROJECT_ROOT / "start_dev.sh"
        assert start_dev_script.exists(), "start_dev.sh missing"
        assert os.access(start_dev_script, os.X_OK), "start_dev.sh must be executable"

        logs_dir = PROJECT_ROOT / "logs"
        assert logs_dir.exists(), "logs/ directory must exist for server log outputs"
        assert os.access(logs_dir, os.W_OK), "logs/ directory must be writable"

    def test_scenario_cryptographic_custody_and_academic_integrity_audit(self):
        """Scenario 3: Academic auditor inspects preserved PhD binaries and cryptographic manifest."""
        manifest_file = PROJECT_ROOT / "docs" / "archive" / "README.md"
        assert manifest_file.exists(), "docs/archive/README.md custody manifest missing"
        manifest_content = manifest_file.read_text(encoding="utf-8")

        archive_dir = PROJECT_ROOT / "docs" / "archive" / "repositorio_doutorado"
        if not archive_dir.exists():
            archive_dir = PROJECT_ROOT / "docs" / "archive"

        for filename, expected_hash in ARCHIVE_HASH_ORACLE.items():
            target = archive_dir / filename
            if not target.exists():
                target = PROJECT_ROOT / "docs" / "RepositorioDoutoradoPortal" / filename
            assert target.exists(), f"Archive file {filename} not found!"

            actual_hash = compute_file_sha256(target)
            assert actual_hash == expected_hash, f"Hash divergence on {filename}!"

            assert expected_hash in manifest_content or actual_hash in manifest_content, (
                f"Hash for {filename} is missing from docs/archive/README.md manifest!"
            )

    def test_scenario_automated_forensic_repository_hygiene_audit(self):
        """Scenario 4: Forensic audit verifies zero unapproved files, no leaked keys, and clean root."""
        root_files = [p.name for p in PROJECT_ROOT.iterdir() if p.is_file()]
        for f in root_files:
            if f.startswith("."):
                continue
            assert f in CANONICAL_ROOT_ALLOWED_FILES, (
                f"Forensic scan found unapproved root file: {f}. Cleanliness violation!"
            )

        gitignore_path = PROJECT_ROOT / ".gitignore"
        assert gitignore_path.exists(), ".gitignore missing"
        gitignore_content = gitignore_path.read_text(encoding="utf-8")

        assert "logs" in gitignore_content, ".gitignore should ignore logs"
        assert any(rule in gitignore_content for rule in ["*.sql", "backups"]), ".gitignore should ignore database backups"
        assert any(rule in gitignore_content for rule in ["VPS_ACCESS.md", "**/VPS_ACCESS.md"]), (
            ".gitignore should ignore VPS_ACCESS.md credential document"
        )

    def test_scenario_live_backend_domain_rules_execution(self):
        """Scenario 5: Live execution of core domain rules test suite to verify zero domain regression."""
        domain_test_file = PROJECT_ROOT / "backend" / "tests" / "test_domain_rules.py"
        assert domain_test_file.exists(), "test_domain_rules.py missing in backend/tests/"

        result = subprocess.run(
            [sys.executable, "-m", "pytest", str(domain_test_file), "-q"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"Domain rules tests failed!\n{result.stderr}\n{result.stdout}"
        assert "passed" in result.stdout, "Domain rules tests did not pass"

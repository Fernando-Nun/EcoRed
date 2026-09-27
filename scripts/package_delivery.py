#!/usr/bin/env python3
"""Package the source, CI and reports as a clean Git snapshot ZIP."""

from pathlib import Path
import os
import shutil
import subprocess
import tempfile
import zipfile


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "artifacts" / "ecored" / "deliverables" / "EcoRed-entrega.zip"
OUTPUT_RELATIVE = OUTPUT.relative_to(ROOT)
EXCLUDED_DIRECTORIES = {
    ".agents",
    ".cache",
    ".conversation",
    ".git",
    ".local",
    ".pythonlibs",
    ".venv",
    "__pycache__",
    "dist",
    "node_modules",
}


def should_skip(relative: Path) -> bool:
    if relative == OUTPUT_RELATIVE or relative.parts[:3] == (
        "artifacts",
        "ecored",
        "deliverables",
    ):
        return True
    if any(part in EXCLUDED_DIRECTORIES for part in relative.parts):
        return True
    if any(part.startswith(".env") for part in relative.parts):
        return True
    return relative.suffix in {".log", ".pyc", ".tsbuildinfo"}


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_suffix(".zip.tmp")
    file_count = 0

    with tempfile.TemporaryDirectory(prefix="ecored-delivery-") as temp_directory:
        snapshot = Path(temp_directory) / "EcoRed"
        snapshot.mkdir()
        for current, directories, filenames in os.walk(ROOT):
            current_path = Path(current)
            relative_directory = current_path.relative_to(ROOT)
            directories[:] = [
                directory
                for directory in directories
                if not should_skip(relative_directory / directory)
            ]
            for filename in filenames:
                full_path = current_path / filename
                relative = full_path.relative_to(ROOT)
                if should_skip(relative) or full_path.is_symlink():
                    continue
                destination = snapshot / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(full_path, destination)
                file_count += 1

        subprocess.run(["git", "init", "--quiet"], cwd=snapshot, check=True)
        subprocess.run(["git", "add", "--all", "--force"], cwd=snapshot, check=True)
        commit_environment = {
            **os.environ,
            "GIT_AUTHOR_NAME": "EcoRed Delivery",
            "GIT_AUTHOR_EMAIL": "delivery@ecored.invalid",
            "GIT_COMMITTER_NAME": "EcoRed Delivery",
            "GIT_COMMITTER_EMAIL": "delivery@ecored.invalid",
        }
        subprocess.run(
            ["git", "commit", "--quiet", "-m", "Snapshot de entrega EcoRed"],
            cwd=snapshot,
            env=commit_environment,
            check=True,
        )

        with zipfile.ZipFile(
            temporary,
            mode="w",
            compression=zipfile.ZIP_DEFLATED,
            compresslevel=9,
            allowZip64=True,
        ) as archive:
            for current, _directories, filenames in os.walk(snapshot):
                current_path = Path(current)
                for filename in filenames:
                    full_path = current_path / filename
                    relative = full_path.relative_to(snapshot)
                    archive.write(full_path, Path("EcoRed") / relative)

    temporary.replace(OUTPUT)
    print(f"ZIP creado: {OUTPUT.relative_to(ROOT)}")
    print(f"Archivos incluidos: {file_count}")
    print("El ZIP contiene un repositorio Git limpio con un commit de snapshot.")


if __name__ == "__main__":
    main()
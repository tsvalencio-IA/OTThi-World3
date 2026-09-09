#!/usr/bin/env python3
from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / 'src/module-order.json').read_text('utf-8'))
VERSION = json.loads((ROOT / 'VERSION.json').read_text('utf-8'))
RELEASE_FILES = [
    'index.html',
    'style.css',
    'assets/vendor/three-r128.min.js',
    'assets/js/core/runtime-config.js',
    'assets/js/core/safe-pointer.js',
    'assets/js/core/viewport-manager.js',
    'assets/js/save-db.js',
    'firebase-config.js',
    'assets/js/game-account.js',
    'assets/js/multiplayer-rtdb.js',
    'app.js',
    'assets/js/ui/shared-modal.js',
    'assets/js/core/performance-guardian.js',
    'assets/js/multiplayer/room-manager.js',
    'assets/js/education/adaptive-learning.js',
    'assets/js/safety/child-safety.js',
    'manifest.webmanifest',
    '404.html',
    'VERSION.json',
    'sw.js',
]


def body_after_marker(path: Path, marker: str) -> str:
    text = path.read_text('utf-8')
    if marker not in text:
        raise RuntimeError(f'Marcador {marker!r} ausente em {path}')
    return text.split(marker, 1)[1].lstrip('\r\n')


def build_js() -> str:
    parts = ["(() => {\n"]
    for item in MANIFEST['javascript']:
        path = ROOT / item['file']
        body = body_after_marker(path, '// @otthi-module-body')
        digest = hashlib.sha256(body.encode()).hexdigest()
        if digest != item['sha256Body']:
            item['sha256Body'] = digest
        parts.append(f"\n  // ===== MODULE: {path.name} =====\n")
        parts.append(body)
    parts.append("\n})();\n")
    return ''.join(parts)


def build_css() -> str:
    parts = []
    for item in MANIFEST['styles']:
        path = ROOT / item['file']
        body = body_after_marker(path, '/* @otthi-style-body */')
        digest = hashlib.sha256(body.encode()).hexdigest()
        if digest != item['sha256Body']:
            item['sha256Body'] = digest
        parts.append(f"\n/* ===== MODULE: {path.name} ===== */\n")
        parts.append(body)
    return ''.join(parts).lstrip()


def node_executable() -> str:
    candidate = os.environ.get('OTTHI_NODE') or shutil.which('node')
    if not candidate:
        raise RuntimeError('Node.js não encontrado. Instale Node 20+ ou defina OTTHI_NODE.')
    return candidate


def release_file_bytes(relative: str, overrides: dict[str, bytes] | None = None) -> bytes:
    overrides = overrides or {}
    if relative in overrides:
        return overrides[relative]
    path = ROOT / relative
    if not path.is_file():
        raise RuntimeError(f'Arquivo de release ausente: {relative}')
    return path.read_bytes()


def normalized_revision_bytes(relative: str, overrides: dict[str, bytes] | None = None) -> bytes:
    data = release_file_bytes(relative, overrides)
    if relative == 'index.html':
        text = data.decode('utf-8')
        text, count = re.subn(
            r'data-otthi-revision="[^"]*"',
            'data-otthi-revision="__REVISION__"',
            text,
            count=1,
        )
        if count != 1:
            raise RuntimeError('Marcador data-otthi-revision ausente em index.html')
        return text.encode('utf-8')
    if relative == 'sw.js':
        text = data.decode('utf-8')
        text, count = re.subn(
            r"const REVISION = '[^']*';",
            "const REVISION = '__REVISION__';",
            text,
            count=1,
        )
        if count != 1:
            raise RuntimeError('Constante REVISION ausente em sw.js')
        return text.encode('utf-8')
    return data


def calculate_release_revision(overrides: dict[str, bytes] | None = None) -> str:
    digest = hashlib.sha256()
    for relative in RELEASE_FILES:
        digest.update(relative.encode('utf-8'))
        digest.update(b'\0')
        digest.update(normalized_revision_bytes(relative, overrides))
        digest.update(b'\0')
    return digest.hexdigest()[:16]


def revised_index_and_worker(revision: str) -> tuple[bytes, bytes]:
    index = (ROOT / 'index.html').read_text('utf-8')
    index, index_count = re.subn(
        r'data-otthi-revision="[^"]*"',
        f'data-otthi-revision="{revision}"',
        index,
        count=1,
    )
    if index_count != 1:
        raise RuntimeError('Nao foi possivel atualizar a revisao em index.html')
    sw = (ROOT / 'sw.js').read_text('utf-8')
    sw, sw_count = re.subn(
        r"const REVISION = '[^']*';",
        f"const REVISION = '{revision}';",
        sw,
        count=1,
    )
    if sw_count != 1:
        raise RuntimeError('Nao foi possivel atualizar a revisao em sw.js')
    return index.encode('utf-8'), sw.encode('utf-8')


def build_release_manifest(revision: str, overrides: dict[str, bytes]) -> dict:
    files = {}
    for relative in RELEASE_FILES:
        files[relative] = hashlib.sha256(release_file_bytes(relative, overrides)).hexdigest()
    return {
        'version': int(VERSION['version']),
        'build': str(VERSION['build']),
        'revision': revision,
        'algorithm': 'SHA-256',
        'files': files,
    }


def validate_candidates(candidates: dict[str, bytes]) -> None:
    with tempfile.TemporaryDirectory(prefix='otthi-v700-build-') as temporary:
        temp_root = Path(temporary)
        app_candidate = temp_root / 'app.js'
        sw_candidate = temp_root / 'sw.js'
        app_candidate.write_bytes(candidates['app.js'])
        sw_candidate.write_bytes(candidates['sw.js'])
        subprocess.run([node_executable(), '--check', str(app_candidate)], check=True)
        subprocess.run([node_executable(), '--check', str(sw_candidate)], check=True)
    json.loads((ROOT / 'manifest.webmanifest').read_text('utf-8'))
    json.loads((ROOT / 'firebase-database.rules.json').read_text('utf-8'))
    json.loads((ROOT / 'VERSION.json').read_text('utf-8'))
    json.loads(candidates['src/module-order.json'].decode('utf-8'))
    json.loads(candidates['release-manifest.json'].decode('utf-8'))


def commit_candidates(candidates: dict[str, bytes]) -> None:
    temporary_paths = []
    try:
        for relative, data in candidates.items():
            target = ROOT / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            temporary_path = target.with_name(f'.{target.name}.otthi-{os.getpid()}.tmp')
            temporary_path.write_bytes(data)
            temporary_paths.append((temporary_path, target))
        for temporary_path, target in temporary_paths:
            os.replace(temporary_path, target)
    finally:
        for temporary_path, _ in temporary_paths:
            if temporary_path.exists():
                temporary_path.unlink()


if __name__ == '__main__':
    js = build_js()
    css = build_css()
    MANIFEST['version'] = int(VERSION['version'])
    MANIFEST['build'] = str(VERSION['build'])
    candidates = {
        'app.js': js.encode('utf-8'),
        'style.css': css.encode('utf-8'),
        'src/module-order.json': (json.dumps(MANIFEST, ensure_ascii=False, indent=2) + '\n').encode('utf-8'),
    }
    revision = calculate_release_revision(candidates)
    candidates['index.html'], candidates['sw.js'] = revised_index_and_worker(revision)
    release = build_release_manifest(revision, candidates)
    candidates['release-manifest.json'] = (json.dumps(release, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    validate_candidates(candidates)
    commit_candidates(candidates)
    print(f'app.js: {len(js):,} caracteres')
    print(f'style.css: {len(css):,} caracteres')
    print(f"release-manifest.json: {len(release['files'])} arquivos verificados; revisao {revision}")
    print('Build modular concluído.')

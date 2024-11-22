# server.spec
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['Z:/Programy/WWW_S7_1200/Stranky/web/server.py'],
    pathex=['Z:/Programy/WWW_S7_1200/Stranky/web'],
    binaries=[],
    datas=[
        ('Z:/Programy/WWW_S7_1200/Stranky/web/template', 'template'),
        ('Z:/Programy/WWW_S7_1200/Stranky/web/static', 'static'),
        ('Z:/Programy/WWW_S7_1200/Stranky/web/plc_config.txt', '.'),
        ('Z:/Programy/WWW_S7_1200/Stranky/web/plc_data.csv', '.'),
        ('Z:/Programy/WWW_S7_1200/Stranky/web/cert.pem', '.'),
        ('Z:/Programy/WWW_S7_1200/Stranky/web/key.pem', '.')
    ],
    hiddenimports=[
        'flask',
        'snap7',
        'flask_cors',
        'flask_sslify',
        'pandas',
        'struct',
        'datetime',
        'csv',
        'os',
        'threading',
        'time'
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='server',
)

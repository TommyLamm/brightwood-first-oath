# 苔陶蟲 atlas 組裝來源記錄

runtime 圖集由 18 張獨立的 96×96 RGBA 有效姿勢原樣排入六欄五列；沒有把概念大圖等分裁格，也沒有把 idle 複製成動作。

## 身份錨點與生成報告

- 共用右向身份錨點：`art-source/ruins-a/actors/moss-carapace-idle-anchor-v1-mirrored-right.png`。
- idle/walk 來源、逐格 prompt、savedPath／revisedPrompt 對照與正規化紀錄：`plan/reports/ruins-a-motion-frames.md`。
- attack/hurt/dead 原稿 SHA-256、10/10 逐 call savedPath／revisedPrompt 對照、姿勢編排及正規化紀錄：`plan/reports/ruins-a-action-frames.md`。
- 組裝輸入是下表列出的獨立 normalized 影格；assemble 腳本不縮放、裁切或重畫它們。來源 SHA-256 與 pixel SHA-256 記錄在 `metadata.json`。

## 有效姿勢逐格 mapping

| Atlas frame | 狀態 | 正規化來源 | SHA-256 |
| ---: | --- | --- | --- |
| 0 | idle | `art-source/ruins-a/motion-frames/normalized/frame-00.png` | `aaed95a72b6c16f5c781e82bea45add27c64cf44cf84ecc201f15640cd5fc010` |
| 1 | idle | `art-source/ruins-a/motion-frames/normalized/frame-01.png` | `550bd14a0b63ac6ffe961583bf59c09929b66f0a3b99355335ea6f067b53b2ed` |
| 6 | walk | `art-source/ruins-a/motion-frames/normalized/frame-06.png` | `cd8b4e11ff67d11d798e0bb9cd1d78ca9bc987f7e7a624db8436a453549cba56` |
| 7 | walk | `art-source/ruins-a/motion-frames/normalized/frame-07.png` | `57676e1c01c98e7bef2466840a4452d051dd54f65e3b1fd78814358109ee02bc` |
| 8 | walk | `art-source/ruins-a/motion-frames/normalized/frame-08.png` | `9403a02cfa38b579d1cda4228953ba60e3006d63414bdad66434cc53a8f62474` |
| 9 | walk | `art-source/ruins-a/motion-frames/normalized/frame-09.png` | `a898dfd6675e183bedb4b8504cead8e893dd0da3924738d511ee0f3aab31b6dd` |
| 10 | walk | `art-source/ruins-a/motion-frames/normalized/frame-10.png` | `8c01cea7c0e55b9b193acda66ebeaa33cc59d5ace8bd345ccff78c107811e03e` |
| 11 | walk | `art-source/ruins-a/motion-frames/normalized/frame-11.png` | `ffe7124c6737afcd5f1d04b55c1ede740c8e3973d0da44080072ddbc6042ae5b` |
| 12 | attack | `art-source/ruins-a/action-frames/normalized/frame-12.png` | `a76215fc35bc264e5e018f070569bf43571463374667c552231c7e18d976dbc4` |
| 13 | attack | `art-source/ruins-a/action-frames/normalized/frame-13.png` | `60542b304fa652b52ca6dc6b06539a32fc6ace33f956111d413218c9dd818629` |
| 14 | attack | `art-source/ruins-a/action-frames/normalized/frame-14.png` | `9691b398b7d0f7a1eb8e4f9ca4ae5c71b2dcc5e174e347ee98b891c0d68345d1` |
| 15 | attack | `art-source/ruins-a/action-frames/normalized/frame-15.png` | `e12beb91f8d256e7ab99649d9b2ded7991390130df7a1398b1ec7706e372eb93` |
| 18 | hurt | `art-source/ruins-a/action-frames/normalized/frame-18.png` | `20f6e53f98328f6ef6b1c5372aee75333edb888f4a35b587a46da62df8cf1b17` |
| 19 | hurt | `art-source/ruins-a/action-frames/normalized/frame-19.png` | `1210733d33febae67b5be2f62f91ab5343bc59123befe09981e1a20391a4f2d9` |
| 24 | dead | `art-source/ruins-a/action-frames/normalized/frame-24.png` | `83b2c9d835b5182c6cf4f1ff4cdf11e2864a730beb64dd6aca07f5740b1bdfea` |
| 25 | dead | `art-source/ruins-a/action-frames/normalized/frame-25.png` | `896c5e67c8709a054c17c6ddd4e21838963d3b52620c9b66cde5086b93f06c9c` |
| 26 | dead | `art-source/ruins-a/action-frames/normalized/frame-26.png` | `c7df97bd6e1551726da92cbda5db762e333f81ce888ccd6300cea501f55fe019` |
| 27 | dead | `art-source/ruins-a/action-frames/normalized/frame-27.png` | `26590675399a212390d2da18b7122dbf08267a52150b65a8bdb7c6b838c26c7f` |

## 補格與隔離稿

- Idle cells 2–5 copy frame 1; attack cells 16–17 copy frame 15; hurt cells 20–23 copy frame 19; dead cells 28–29 copy frame 27. Walk row uses all six unique source frames.
- Rejected legacy sheets remain isolated under `art-source/ruins-a/`: `ruins-moss-carapace-atlas-generated.png`, `ruins-moss-carapace-atlas-generated-v2.png`, and `ruins-moss-carapace-atlas-generated-v3.png`. They are not runtime sources because high-alpha subjects crossed internal cell boundaries / overlapped adjacent poses; prior diagnosis is in `plan/reports/ruins-a-combat.md` and `plan/reports/ruins-a-actor-art.md`.
- No failed or rejected source was removed or promoted into `public/`.

## Runtime output and checks

- Runtime image: `public/assets/actors/monster-ruins-moss-carapace.png`; 576×480 RGBA, six columns by five rows, display 96×96, pivot (0.5, 1).
- Runtime manifest: `public/assets/actors/manifest.json`; only the `actor:ruins-moss-carapace` image and its five animation entries were appended.
- Check list: true RGBA/alpha, 96×96 input cells, complete non-edge-clipped alpha bounds, duplicate-pose rejection, exact filler copies, contract check against `src/render/animation-contract.ts`, and retained prior manifest entries.
- Visual review is represented by `moss-carapace-contact-sheet.jpg` (neutral background, JPEG quality 70, below 1280 px).

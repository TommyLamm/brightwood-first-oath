# Sunwell Sentinel final atlas source v1

All actor source groups use built-in ImageGen and retain their original raw images and exact prompts in this folder or the linked attack/walk-fix packages. This export only takes rectangular RGBA crops, uniformly resizes with nearest-neighbor sampling, and places each frame in a transparent cell. It does not redraw, recolor, erase, or clean pixels.

- Runtime output: `public/assets/actors/monsters/sunwell-sentinel-atlas-v1.png` (384×384 RGBA, 4×4 96×96 cells), SHA-256 `2D38D260642684BA90D73A58FB8A1752A4664923285605715714C1C4111C6737`.
- Game display: 192×192 per cell; pivot [0.5, 1.0]; baseline y=94; logic collision 72×84.
- Pose groups are scaled by a shared chest-core height target of 9 source-inspection pixels. Walk0 uses its accepted targeted-edit source and is normalized by its measured core height to match the generated walk group.
- The turquoise color mask is used only to measure the core and determine common scale. The crop includes original RGBA values unchanged.

## Locked row-major frame contract

| Cell | State | Pose | Source | Scale | Hard silhouette in cell | Source SHA-256 |
|---:|---|---|---|---:|---:|---|
| 0 | idle | idle 0 | `art-source/expansion-sands/sentinel/actor/sunwell-sentinel-idle-pose-0-crop-v1.png` | 0.102272727 | 77×78 | 5160FA2DF521BEE74F8AC593B882FA70783E0D65FB8B5F86A504E2D209D5D0A6 |
| 1 | idle | idle 1 | `art-source/expansion-sands/sentinel/actor/sunwell-sentinel-idle-pose-1-crop-v1.png` | 0.102272727 | 78×78 | 32F30B00C85ACC0EF82B0E8E4EB1BD137074D7AE978EAFFFFAEF6E682D00CF21 |
| 2 | walk | walk 0 (targeted edit) | `art-source/expansion-sands/sentinel/walk-fix/sunwell-sentinel-walk-pose-0-edited-raw-v1.png` | 0.068181818 | 76×80 | 02AB63D4707462F32220490DD949BC365CA2C530FA310C5E90BD6ECDC580E002 |
| 3 | walk | walk 1 | `art-source/expansion-sands/sentinel/actor/sunwell-sentinel-walk-pose-1-crop-v1.png` | 0.136363636 | 76×79 | F3B4E61A22F87D3700DB6156F26B8AC100D608ACFD1D28B7C9957DF6AB502FB1 |
| 4 | walk | walk 2 | `art-source/expansion-sands/sentinel/actor/sunwell-sentinel-walk-pose-2-crop-v1.png` | 0.136363636 | 82×79 | E484175F1CCB773B69A141693BEB0FA12E7AA4310ADBEA7EE1AEBF5268FA9367 |
| 5 | walk | walk 3 | `art-source/expansion-sands/sentinel/actor/sunwell-sentinel-walk-pose-3-crop-v1.png` | 0.136363636 | 74×79 | 79E3E20F3075E4A076DE3E61730BE6C538D6BC7D0E3867E817FD1CDF78FB6AE7 |
| 6 | attack | attack 6: wind-up low | `art-source/expansion-sands/sentinel/attack/sunwell-sentinel-attack-06-windup-low-crop-v1.png` | 0.150000000 | 85×68 | 9781A1B67D30F884D29A5E89609DF9F258E81AB5BC68C1AD252D3A4C6ACDCB4B |
| 7 | attack | attack 7: fists high | `art-source/expansion-sands/sentinel/attack/sunwell-sentinel-attack-07-fists-high-crop-v1.png` | 0.150000000 | 71×86 | 566AB7B8886A8E435FA113E76C0E89E104C6F01CC34C9E982E2154184E6C1107 |
| 8 | attack | attack 8: low smash | `art-source/expansion-sands/sentinel/attack/sunwell-sentinel-attack-08-low-smash-crop-v1.png` | 0.150000000 | 89×60 | 7CA2A23840AC49AF565CBF26478E013CBB93F630813593C0B14882E143E76DBA |
| 9 | attack | attack 9: recover | `art-source/expansion-sands/sentinel/attack/sunwell-sentinel-attack-09-recover-crop-v1.png` | 0.150000000 | 84×71 | E0691B73EDC9A8BCC545CB9885398A2745FDCC30CAE81061C1C7E35C6E741366 |
| 10 | hurt | hurt 0 | `art-source/expansion-sands/sentinel/actor/sunwell-sentinel-hurt-pose-0-crop-v1.png` | 0.104651163 | 74×83 | 4B8136D62652685AA04AC5264E855442DF2F69C0223C8EFC5381CE53414F5015 |
| 11 | hurt | hurt 1 | `art-source/expansion-sands/sentinel/actor/sunwell-sentinel-hurt-pose-1-crop-v1.png` | 0.104651163 | 68×76 | 2DCCDEAB7C77D1F0629B470CBA96501F62017C8487D48442C6B30616D524D481 |
| 12 | dead | dead 0: fall | `art-source/expansion-sands/sentinel/actor/sunwell-sentinel-dead-pose-0-crop-v1.png` | 0.160714286 | 84×84 | 1C4C5993801DDC5BE959C36E83F7AAFBE743DF4699769972FA80E0351E6052B0 |
| 13 | dead | dead 1: kneel | `art-source/expansion-sands/sentinel/actor/sunwell-sentinel-dead-pose-1-crop-v1.png` | 0.160714286 | 86×70 | DB27AE504AAE67C50BB468F40E97C3F07ACD7227EAB1EEAF9E021F1632CB3C6D |
| 14 | dead | dead 2: collapse | `art-source/expansion-sands/sentinel/actor/sunwell-sentinel-dead-pose-2-crop-v1.png` | 0.160714286 | 88×51 | 52A4F5D46CA6BA188EE156918002833B607630A3F0C9D4AD5E8EEF2B8ACC26B6 |
| 15 | dead | dead 3: prone | `art-source/expansion-sands/sentinel/actor/sunwell-sentinel-dead-pose-3-crop-v1.png` | 0.160714286 | 86×37 | AF0AA66435D51E70601838AD76E8FA56F19495F3DD3624D53D081166E61E5473 |

- Idle: cells 0–1, 200 ms each, looping.
- Walk: cells 2–5, 120 ms each, looping.
- Attack: cells 6–9, non-looping; 900 ms warning, 100 ms active, 850 ms recovery. The four images are low wind-up, fists raised, low smash, recovery.
- Hurt: cells 10–11, 100 ms each, non-looping.
- Dead: cells 12–15, 100 ms each, non-looping.

The 96px overview is the final runtime atlas itself. The 192px previews double each cell by nearest-neighbor scaling; the sky-backed board is a visual review only and is not part of the runtime sprite.

## Source-sheet crop note

The final 192px review shows narrow edge strokes on walk cells 3–5. The original walk poses are packed close together; their hard-alpha rectangles and the preserved padded crops overlap or meet near neighboring outlines. A tighter rectangular crop cannot safely exclude those pixels without trimming the pose's hard outline or fist/leg edge, so the minor marks are retained. No pixels were erased or redrawn.

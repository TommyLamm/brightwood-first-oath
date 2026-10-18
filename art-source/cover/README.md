# Playroom gameplay cover source

The original capture came from the active Q01 camp in the integrated game, shown in the hidden in-app browser at 1280×720. It contains the player scene, 森芽 name label, forest background, platform, and ladder. The browser capture returned JPEG/JFIF bytes; both the raw capture and a full-resolution PNG transcode are preserved here.

| File | Dimensions | Bytes | SHA-256 | Source/transform |
| --- | ---: | ---: | --- | --- |
| `gameplay-source.jpg` | 1280×720 | 177,532 | `F914A696677A310A0F47B3D842D5CB87144FE42A37E9F1D7BEB9F7C41B2B2292` | Original browser screenshot bytes (`tab.getScreenshot({emit:false})`) |
| `gameplay-source.png` | 1280×720 | 1,785,543 | `816339E5CFCAE166D8594B2087B0AF1033CA3D98DAB7F1D56B6BA0C04246EE2D` | Full-resolution PNG transcode of the original JPEG, without crop or repaint |
| `../../public/cover.png` | 800×500 | 1,006,776 | `4E66F74FFFE578F3FE9A040DB5E0DAA9430DE0493BE18F478A66C4B5A888BE77` | Crop `(x=264, y=256, width=496, height=310)` from the PNG source, resized with System.Drawing `HighQualityBicubic` |

The cover crop keeps the actual game scene and excludes the temporary HUD labels at the top and bottom. It is a direct crop and resize; nothing was redrawn or composited. The result was visually inspected and is below the 5 MiB cover limit.

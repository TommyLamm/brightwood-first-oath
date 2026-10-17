# T06：普通怪物AI、首領與唯一死亡事件

目的：六怪及兩階段首領具有實際行為。所有權src/domain/actors/**、tests/actors.test.ts。依賴G0及T02 stepMovement，正式rules來T01。不能自行寫第二套地形碰撞、玩家扣血或掉落經濟。

公開createMonster、stepActors、applyMonsterHit按07。MonsterState除了基本欄位，使用T00發布的pendingSkillId／attackOrigin／attackFacing／deathReported，不能藏另一份可變global狀態。

## 步驟

- [x] T06-01 由MonsterDef及spawn建HP／foot position／mode／phase1，roam固定在spawn定義，首次出圖不重生額外怪。
- [x] T06-02 idle↔patrol定時及來回，距離300內chase，離開活動區回巡邏；不讓怪物走出roam或永久卡牆。
- [x] T06-03 用T02處理水平／重力／落地；怪物不自行跳梯繩，遇邊界轉向，未追到玩家也不能跨地形瞬移。
- [x] T06-04 玩家在attackRange且招式可用時進windup，固定origin/facing/pendingSkillId，當刻送一次AttackRequest；combat負責唯一前搖／命中，AI按同時序停步／預告／後搖，禁止等windup後再送造成雙倍前搖。
- [x] T06-05 接觸傷害由app每tick查交疊並用800ms無敵，AI不再直接扣玩家HP，避免近戰與接觸重複繞過保護。
- [x] T06-06 applyMonsterHit扣HP／套普通怪擊退；到0設mode dead、deadAtMs，deathReported仍false；stepActors首次看到dead&&未報時回deaths並設true，只此一次。
- [x] T06-07 普通怪死亡8000ms後回respawnRequests舊EntityId，app用新EntityId及原spawn滿HP重新createMonster替換；清舊攻擊／命中集合，不在AI偷用隨機ID。
- [x] T06-08 guardian按08交替slam/wave，HP≤50%只轉phase2一次；預告Telegraph與實際attack range同源，時間固定，低波可跳避。
- [x] T06-09 guardian受擊不擊退，無普通重生；退出／重試由app重新createMonster，所有pending招式／telegraph由空集合開始。
- [x] T06-10 測巡邏界、windup只產一次request、死亡只報一次、普通重生新ID請求、phase2一次及新boss無殘留；只跑actors.test.ts。
- [x] T06-11 report列app需處理的唯一死亡、掉落、接觸傷害、ID提供與重試清理接線，提供簡短範例。

完成：不是只會左右移動的圖片，至少巡邏／追擊／前搖／攻擊／受擊／死亡／重生可用；首領兩招及phase2真實產生攻擊請求，沒有只畫紅框而無傷害。

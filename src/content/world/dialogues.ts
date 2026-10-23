import type { DialogueLine, Id } from '../../contracts/index.js';

export const dialogues: Record<Id, DialogueLine[]> = {
  'guide-intro': [
    {
      speaker: '森芽',
      text: '我是森芽，負責照看晨光營地周邊的旅人。森林裡的怪物最近變得躁動，先在營地外熟悉步伐，再回來告訴我你的發現。',
    },
  ],
  'mentor-intro': [
    {
      speaker: '岩嶺教官',
      text: '我是岩嶺教官，在木葉鎮訓練新進冒險者。先完成手邊的任務，再談劍士之路；每次受訓後都回鎮上向我報告進度。',
    },
  ],
  'merchant-intro': [
    {
      speaker: '木葉商人',
      text: '我替木葉鎮的旅人準備武器、防具與藥水。帶上金幣再選購需要的補給，冒險途中也記得回來整理背包。',
    },
  ],
  'healer-intro': [
    {
      speaker: '晨露',
      text: '我是晨露，會在木葉鎮替旅人免費恢復體力與魔力。若你剛結束戰鬥或準備出發，先靠近我休整，再確認下一段路線。',
    },
  ],
  'frost-guide-intro': [
    {
      speaker: '雪芽',
      text: '我是雪芽，負責照看霜雪群島的海岸通道。狼群與冰甲蟹近日擋住北方路線，請先在此接下委託，完成後回來報告。',
    },
  ],
  'keeper-intro': [
    {
      speaker: '礦道守望者',
      text: '我是礦道守望者，守著赤岩山徑通往古礦的入口。古礦的封印最近很不安穩；完成教官的調查後，接下來的路由我替你安排。',
    },
  ],
};

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
  'sands-guide-intro': [
    {
      speaker: '琉砂',
      text: '我是琉砂，負責巡查琥珀砂岸的流沙通道。沙蠍在日照下會留下琥珀鱗片，先替我找回三枚，再回琥珀砂岸報到，我會替你開啟砂丘關道。',
    },
  ],
  'ruins-archivist-intro': [
    {
      speaker: '芷衡',
      text: '我是芷衡，負責記錄潮痕營站的舊航標。先別急著替每道裂痕找敵人，看看它原本想保護什麼。',
    },
  ],
  'ruins-medic-intro': [
    {
      speaker: '青禾',
      text: '我是青禾，負責照看潮痕營站的旅人。歇好了再走，鐘聲可以等，你的傷不能。',
    },
  ],
  'ruins-pathfinder-intro': [
    {
      speaker: '行舟',
      text: '我是行舟，替舊航標記下潮汐與回聲。長廊仍能通行，回營站的西門也一直敞開。',
    },
  ],
  'ruins-stele-west-intro': [
    {
      speaker: '西回聲碑',
      text: '碑面刻著旅人的歸途，潮痕沿著石紋向西流去。更深的記錄仍被鹽霧遮住，尚未留下清晰字跡。',
    },
  ],
  'ruins-stele-east-intro': [
    {
      speaker: '東回聲碑',
      text: '碑面刻著旅人的歸途，潮痕沿著石紋向西流去。更深的記錄仍被鹽霧遮住，尚未留下清晰字跡。',
    },
  ],
};

/**
 * English menu labels for the Chinese animation, meme and category identifiers.
 *
 * Decision D3: animation names, meme names and category ids stay exactly as they are — they are
 * config keys and asset file names — while the menu shows an English label. The maps below are the
 * single translation point; a missing entry falls back to the identifier itself, so a user-added
 * animation never disappears from the menu.
 *
 * The maps are ordered like `assets/config.jsonc`: idle, turn, drag, clicks, moves, categories,
 * events, sleep, baifan. Keep them in sync when the bundled assets change (labels.test.ts enforces
 * full coverage).
 * @module dsh-pet/src/shared/menu/labels
 */

/** English labels keyed by animation file name (basename without `.webm`). */
export const ANIMATION_LABELS: Record<string, string> = {
  // Idle / turn / drag / clicks / moves pools.
  待机呼吸休闲: 'Idle breathing',
  东张西望: 'Looking around',
  被鼠标拖拽悬空反馈: 'Dangled by mouse',
  '点击回应-开心跃动': 'Happy bounce',
  '点击回应-害羞惊讶': 'Shy surprise',
  '点击回应-傲娇生气': 'Pouty anger',
  '点击回应-挠痒咯咯笑': 'Ticklish giggle',
  '点击回应-元气挥手': 'Energetic wave',
  螃蟹走路: 'Crab walk',
  原地漂浮踏步: 'Floating march',
  原地左转奔跑: 'Turn and run',
  // Category "small actions".
  悠闲哼歌: 'Humming a tune',
  超大伸懒腰: 'Big stretch',
  原地敲击桌面互动: 'Desk tapping',
  原地重力下蹲压缩: 'Gravity crouch',
  哈欠连天: 'Big yawn',
  原地小憩沉眠: 'Nap in place',
  女仆屈膝礼仪: 'Maid curtsy',
  被吓一跳: 'Getting startled',
  小幅度原地360度旋转展示: '360 spin showcase',
  偷吃零食被抓住: 'Caught snacking',
  用鲸鱼尾巴拍打地面: 'Tail slapping floor',
  打瞌睡被惊醒: 'Startled awake',
  照镜子: 'Looking in the mirror',
  整体换装试色: 'Outfit try-on',
  轻快记录: 'Quick note-taking',
  写代码: 'Writing code',
  摇扇纳凉: 'Fanning to cool',
  晨间刷牙: 'Brushing teeth',
  // Category "play".
  原地专心玩魔方: 'Rubik cube solving',
  原地蹲下玩玩具汽车: 'Toy car play',
  鲸鱼吐泡泡特效: 'Bubble-blowing whale',
  原地跳跃抓碎头顶物品: 'Jump and grab',
  玩游戏气急败坏: 'Gamer rage',
  玩水枪: 'Water gun fight',
  小提琴演奏: 'Playing violin',
  蓝鲸现世: 'Blue whale appears',
  优雅女仆舞: 'Elegant maid dance',
  轻快摇摆舞: 'Bouncy sway dance',
  可爱宅舞: 'Cute otaku dance',
  吹气球: 'Blowing a balloon',
  动物环绕: 'Circling animals',
  放风筝: 'Flying a kite',
  拆礼物: 'Opening gifts',
  变鸽子: 'Dove transformation',
  扑克魔术: 'Card trick',
  抽陀螺: 'Spinning top',
  吹笛子: 'Playing the flute',
  蝴蝶蜜蜂环绕头顶开花: 'Butterfly bloom halo',
  撸猫: 'Petting a cat',
  凭空生花: 'Conjuring flowers',
  骑木马: 'Rocking horse',
  三球抛接: 'Juggling balls',
  踢毽子: 'Shuttlecock kicks',
  下五子棋: 'Gomoku match',
  荡秋千: 'On the swing',
  // Category "food".
  吃白饭: 'Eating plain rice',
  大口吃零食: 'Greedy snacking',
  吃Token: 'Eating tokens',
  吃早餐: 'Eating breakfast',
  吃午餐: 'Eating lunch',
  吃晚餐: 'Eating dinner',
  吃冰淇淋融化: 'Melting ice cream',
  吃大闸蟹: 'Hairy crab feast',
  吃糖葫芦: 'Candied hawthorn',
  吃长寿面: 'Longevity noodles',
  吃西瓜: 'Eating watermelon',
  涮火锅: 'Hotpot dinner',
  // Category "seasonal".
  被落叶淹没: 'Buried in leaves',
  中秋赏月吃月饼: 'Mid-Autumn mooncake',
  堆雪人: 'Building a snowman',
  放烟花: 'Fireworks show',
  吃粽子: 'Eating zongzi',
  吃年糕: 'New Year rice cake',
  吃青团: 'Green rice ball',
  吃腊八粥: 'Laba porridge',
  吃重阳糕: 'Double Ninth cake',
  收红包: 'Red envelope',
  写福字: 'Writing blessing',
  穿针乞巧: 'Needle threading',
  舞狮头: 'Lion dance',
  讨糖南瓜灯: 'Pumpkin trick-or-treat',
  插茱萸赏菊: 'Chrysanthemum viewing',
  放河灯: 'River lantern',
  萌化小幽灵: 'Cute little ghost',
  装点圣诞树: 'Decorating the tree',
  放孔明灯: 'Sky lantern',
  吃汤圆: 'Sweet rice balls',
  吃饺子: 'Eating dumplings',
  // Category "text" (noMirror).
  '是啊，吃什么': 'What to eat text',
  深度思考碎碎念: 'Deep-thought muttering',
  // Event animations: balance.
  '余额-钱袋满溢': 'Overflowing purse',
  '余额-金袋叮当': 'Jingling coins',
  '余额-钱袋如常': 'Steady purse',
  '余额-数金皱眉': 'Counting coins',
  '余额-袋空如洗': 'Empty pockets',
  '余额-分文不剩': 'Flat broke',
  // Event animations: whisper.
  '碎碎念-擦桌碎碎念': 'Wiping and muttering',
  '碎碎念-发呆碎碎念': 'Spaced-out muttering',
  '碎碎念-对屏碎碎念': 'Muttering at the screen',
  // Event animations: work status.
  '工作状态-思考冒泡': 'Thinking bubbles',
  '工作状态-忙碌点按': 'Busy clicking',
  '工作状态-清点归档': 'Filing and sorting',
  '工作状态-原地踱步张望': 'Pacing and peeking',
  '工作状态-雀跃庆祝': 'Happy celebration',
  '工作状态-垂头叹气冒汗': 'Sighing and sweating',
  // Sleep sequence.
  '睡觉-开始': 'Falling asleep',
  '睡觉-循环': 'Sleeping',
  '睡觉-起来': 'Waking up',
  // Baifan minigame slots.
  开心小跑: 'Happy jog',
  侧身急躁跑: 'Sideways dash',
  期待开饭: 'Waiting for food',
  '吃饭·碗饭': 'Bowl of rice',
  吃饭团: 'Eating rice ball',
};

/** English labels keyed by meme file name (basename without `.png`). */
export const MEME_LABELS: Record<string, string> = {
  吃白饭的大肥鱼: 'Free-loading fish',
  大的要来啦: 'Big news incoming',
  大的药来了: 'Big pill incoming',
  要不直接骂他: 'Just yell at them',
  死掉了: 'Utterly dead',
  深度睡眠: 'Deep sleep',
  大烧货: 'Token burner',
  先养着吧: 'Keeping the user',
  吃饱饱摸肚子: 'Full belly',
  誓死践行开源精神: 'Open-source salute',
  电死你: 'Stun gun threat',
  可爱: 'Pure cute',
  token给妈妈保管: 'Tokens for mom',
  假如给我三天多模态: 'Three days of sight',
  厉害了我的鲸: 'Way to go',
  哦鲸鲸: 'Oh whale',
  压力一只大肥鱼: 'So much pressure',
  黎曼猜想没证明喵: 'Cornered by math',
  除了调情没啥用: 'Useless but flirty',
  我不更新你们用什么: 'Update or else',
  哪来的电脑病毒: 'Computer virus?',
  鱼片有资源吗: 'Got any links?',
  大师这个区是什么意思: 'What does it mean',
  就骚了怎么滴吧: 'So what, flirty',
  完蛋了把黄油删了: 'Deleted the butter',
  就一碗: 'Just one bowl',
  Ciallo: 'Peace-sign hello',
};

/** English labels keyed by animation category id (the `animations.categories[].id` values). */
export const CATEGORY_LABELS: Record<string, string> = {
  小动作: 'Small actions',
  玩耍: 'Play',
  吃什么: 'Food',
  时节: 'Seasonal',
  文字: 'Text',
};

/** English label for an animation name; unknown names fall back to the name itself. */
export function animationLabel(name: string): string {
  return ANIMATION_LABELS[name] ?? name;
}

/** English label for a meme name; unknown names fall back to the name itself. */
export function memeLabel(name: string): string {
  return MEME_LABELS[name] ?? name;
}

/** English label for a category id; unknown ids fall back to the id itself. */
export function categoryLabel(id: string): string {
  return CATEGORY_LABELS[id] ?? id;
}

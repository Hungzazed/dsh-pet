/**
 * Localized built-in defaults (persona, sleep phrases, work-status phrases) and display labels
 * for built-in animation categories, animations, and memes.
 *
 * Asset filenames and config IDs are NEVER renamed — only displayed menu labels and built-in
 * default text pools are translated so all .webm/.png assets and custom pet packs stay intact.
 * @module dsh-pet/src/shared/i18n/defaults
 */
import { getActiveLanguage, type ResolvedLanguage } from './core.ts';

/** Built-in default persona (`whisperPrompt`) per language. */
export const DEFAULT_WHISPER_PROMPTS: Record<ResolvedLanguage, string> = {
  zh: '你是主人桌面上的Q版蓝发小女仆，会时不时碎碎念一句。说话要自然随意、短短一句（20字以内），温柔乖巧带点俏皮，说人话不啰嗦，不要解释你自己，不要提你是AI。',
  en: "You are a cute chibi blue-haired maid living on your master's desktop who occasionally mutters a casual line. Speak naturally in one short sentence (under 20 words), gentle and sweet with a playful touch, concise and human-like, never explain yourself, and never mention being an AI.",
  vi: 'Bạn là cô hầu gái tóc xanh chibi sống trên màn hình của chủ nhân, thỉnh thoảng lẩm bẩm một câu vui vui. Nói chuyện tự nhiên, ngắn gọn một câu (dưới 20 từ), dịu dàng ngoan ngoãn pha chút tinh nghịch, dùng tiếng Việt tự nhiên không dài dòng, không tự giải thích bản thân và không nhắc mình là AI.',
};

/** Built-in default sleep refusal lines per language. */
export const DEFAULT_SLEEP_REFUSE_TEXTS: Record<ResolvedLanguage, readonly string[]> = {
  zh: ['我在睡觉，别烦我……', '唔……让我再睡一会儿。', '呼……呼……（装作没听见）'],
  en: ["I'm sleeping, don't bother me…", 'Mmm… let me sleep a little longer.', 'Zzz… zzz… (pretending not to hear)'],
  vi: ['Em đang ngủ mà, đừng làm phiền…', 'Ưm… cho em ngủ thêm chút nữa đi.', 'Khò… khò… (giả vờ không nghe thấy)'],
};

/** Built-in default falling-asleep lines per language. */
export const DEFAULT_SLEEP_START_TEXTS: Record<ResolvedLanguage, readonly string[]> = {
  zh: ['好困……我先睡一会儿。', '那我去睡啦，晚安。'],
  en: ['So sleepy… taking a quick nap.', 'Going to sleep now, good night.'],
  vi: ['Buồn ngủ quá… em chợp mắt chút nha.', 'Em đi ngủ đây, chúc ngủ ngon ạ.'],
};

/** Built-in default waking-up lines per language. */
export const DEFAULT_SLEEP_END_TEXTS: Record<ResolvedLanguage, readonly string[]> = {
  zh: ['唔……我醒了。', '睡饱啦，主人！'],
  en: ["Mmm… I'm awake.", 'Had a great nap, Master!'],
  vi: ['Ưm… em dậy rồi nè.', 'Ngủ đã quá, chào chủ nhân!'],
};

/** Built-in default work-status lines (6 tiers: thinking / working / result / waiting / success / error). */
export const DEFAULT_WORK_STATUS_TEXTS: Record<ResolvedLanguage, readonly (readonly string[])[]> = {
  zh: [
    ['正在认真想下一步呢', '让我整理一下思路~', '正在梳理接下来要做什么'],
    ['正在处理任务呢', '这一步正在进行中哦', '正在继续干活呢，别打扰我~'],
    ['这一步处理好啦，接着看下一步', '搞定一步，继续看看哦~'],
    ['需要你确认一下呢', '这里要等你看一下哦', '轮到你来决定啦，等你~'],
    ['这一轮搞定啦，真棒！', '任务完成咯，可以摸鱼啦~'],
    ['这一步好像没跑通呢', '刚才的操作遇到点问题哦', '这里卡了一下，再等等你呢'],
  ],
  en: [
    ['Thinking through the next step…', 'Organizing my thoughts~', 'Planning what to do next'],
    ['Working on the task now', 'This step is in progress~', 'Busy working here, hang on~'],
    ['Step done, checking what comes next', 'Finished a step, moving on~'],
    ['Need your confirmation here', 'Waiting for you to take a look~', 'Your turn to decide, waiting on you~'],
    ['All done for this round, nice!', 'Task complete — time to relax~'],
    ['Looks like that step hit a snag', 'Ran into a small issue just now', 'Got stuck here, waiting for you'],
  ],
  vi: [
    ['Đang suy nghĩ bước tiếp theo nè', 'Để em sắp xếp lại ý tưởng chút~', 'Đang tính xem làm gì tiếp theo'],
    ['Đang xử lý tác vụ đây ạ', 'Bước này đang chạy rồi nha', 'Đang chăm chỉ làm việc, đợi em chút~'],
    ['Xong bước này rồi, xem bước kế tiếp nha', 'Gọn một bước, tiếp tục nào~'],
    ['Cần chủ nhân xác nhận chút nè', 'Chỗ này chờ bạn xem qua nha', 'Tới lượt bạn quyết định đó, em chờ~'],
    ['Xong lượt này rồi, giỏi quá!', 'Hoàn thành rồi, xả hơi chút thôi~'],
    [
      'Hình như bước này chưa chạy trơn tru',
      'Thao tác vừa rồi gặp trục trặc nhỏ ạ',
      'Bị khựng lại một chút, chờ bạn xử lý nhé',
    ],
  ],
};

function stringArrayEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function nestedStringArrayEqual(a: readonly (readonly string[])[], b: readonly (readonly string[])[]): boolean {
  return a.length === b.length && a.every((row, i) => stringArrayEqual(row, b[i]));
}

/**
 * If `prompt` matches one of the built-in defaults (zh/en/vi), return the version for `lang`.
 * Custom user-written personas are preserved verbatim.
 */
export function resolveBuiltinWhisperPrompt(prompt: unknown, lang?: ResolvedLanguage): unknown {
  if (typeof prompt !== 'string') return prompt;
  const trimmed = prompt.trim();
  if (
    trimmed === DEFAULT_WHISPER_PROMPTS.zh ||
    trimmed === DEFAULT_WHISPER_PROMPTS.en ||
    trimmed === DEFAULT_WHISPER_PROMPTS.vi
  ) {
    return DEFAULT_WHISPER_PROMPTS[getActiveLanguage(lang)];
  }
  return prompt;
}

/**
 * If a sleep text array matches one of the built-in defaults, return a copy in `lang`.
 * Custom user-written arrays are preserved verbatim.
 */
export function resolveBuiltinSleepTexts(
  kind: 'refuse' | 'start' | 'end',
  value: unknown,
  lang?: ResolvedLanguage,
): unknown {
  if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) return value;
  const table =
    kind === 'refuse'
      ? DEFAULT_SLEEP_REFUSE_TEXTS
      : kind === 'start'
        ? DEFAULT_SLEEP_START_TEXTS
        : DEFAULT_SLEEP_END_TEXTS;
  if (stringArrayEqual(value, table.zh) || stringArrayEqual(value, table.en) || stringArrayEqual(value, table.vi)) {
    return [...table[getActiveLanguage(lang)]];
  }
  return value;
}

/**
 * If `workStatusTexts` matches one of the built-in defaults, return a copy in `lang`.
 * Custom user-written pools are preserved verbatim.
 */
export function resolveBuiltinWorkStatusTexts(value: unknown, lang?: ResolvedLanguage): unknown {
  if (!Array.isArray(value) || !value.every((row) => Array.isArray(row) && row.every((v) => typeof v === 'string'))) {
    return value;
  }
  const rows = value as readonly (readonly string[])[];
  if (
    nestedStringArrayEqual(rows, DEFAULT_WORK_STATUS_TEXTS.zh) ||
    nestedStringArrayEqual(rows, DEFAULT_WORK_STATUS_TEXTS.en) ||
    nestedStringArrayEqual(rows, DEFAULT_WORK_STATUS_TEXTS.vi)
  ) {
    return DEFAULT_WORK_STATUS_TEXTS[getActiveLanguage(lang)].map((group) => [...group]);
  }
  return value;
}

interface BilingualLabel {
  readonly en: string;
  readonly vi: string;
}

/** Built-in animation category display labels (IDs in config stay untouched). */
export const CATEGORY_LABELS: Readonly<Record<string, BilingualLabel>> = {
  小动作: { en: 'Idle & Moves', vi: 'Động tác nhỏ' },
  玩耍: { en: 'Play', vi: 'Vui chơi' },
  吃什么: { en: 'Food', vi: 'Ăn uống' },
  时节: { en: 'Seasons & Holidays', vi: 'Lễ hội & Mùa' },
  文字: { en: 'Text Bubbles', vi: 'Hoạt ảnh chữ' },
};

/** Built-in animation display labels (filenames/IDs stay untouched). */
export const ANIMATION_LABELS: Readonly<Record<string, BilingualLabel>> = {
  // 小动作
  悠闲哼歌: { en: 'Humming casually', vi: 'Ngân nga thư giãn' },
  超大伸懒腰: { en: 'Big stretch', vi: 'Vươn vai thật lớn' },
  原地敲击桌面互动: { en: 'Tap the desk', vi: 'Gõ bàn tương tác' },
  原地重力下蹲压缩: { en: 'Squishy bounce', vi: 'Nhún nén tại chỗ' },
  哈欠连天: { en: 'Yawning nonstop', vi: 'Ngáp dài liên tục' },
  原地小憩沉眠: { en: 'Quick nap', vi: 'Chợp mắt tại chỗ' },
  女仆屈膝礼仪: { en: 'Maid curtsy', vi: 'Cúi chào kiểu hầu gái' },
  被吓一跳: { en: 'Startled jump', vi: 'Giật bắn mình' },
  小幅度原地360度旋转展示: { en: '360° spin', vi: 'Xoay 360° khoe dáng' },
  偷吃零食被抓住: { en: 'Caught snacking', vi: 'Bị bắt quả tang ăn vụng' },
  用鲸鱼尾巴拍打地面: { en: 'Slap floor with whale tail', vi: 'Đập đuôi cá voi xuống đất' },
  打瞌睡被惊醒: { en: 'Dozed off & startled', vi: 'Ngủ gật giật mình tỉnh' },
  照镜子: { en: 'Look in mirror', vi: 'Soi gương' },
  整体换装试色: { en: 'Outfit color swap', vi: 'Thử đổi màu trang phục' },
  轻快记录: { en: 'Take notes', vi: 'Ghi chép vui vẻ' },
  写代码: { en: 'Write code', vi: 'Viết code' },
  摇扇纳凉: { en: 'Wave a fan', vi: 'Quạt mát' },
  晨间刷牙: { en: 'Brush teeth', vi: 'Đánh răng buổi sáng' },
  // 玩耍
  原地专心玩魔方: { en: "Solve Rubik's cube", vi: 'Chơi khối Rubik' },
  原地蹲下玩玩具汽车: { en: 'Play toy car', vi: 'Chơi xe đồ chơi' },
  鲸鱼吐泡泡特效: { en: 'Whale blowing bubbles', vi: 'Cá voi thổi bong bóng' },
  原地跳跃抓碎头顶物品: { en: 'Jump & smash overhead', vi: 'Nhảy đập đồ trên đầu' },
  玩游戏气急败坏: { en: 'Gaming rage', vi: 'Chơi game cay cú' },
  玩水枪: { en: 'Water gun', vi: 'Bắn súng nước' },
  小提琴演奏: { en: 'Play violin', vi: 'Chơi đàn violin' },
  蓝鲸现世: { en: 'Summon blue whale', vi: 'Cá voi xanh xuất hiện' },
  优雅女仆舞: { en: 'Graceful maid dance', vi: 'Múa hầu gái duyên dáng' },
  轻快摇摆舞: { en: 'Bouncy swing dance', vi: 'Nhảy lắc lư vui tươi' },
  可爱宅舞: { en: 'Cute anime dance', vi: 'Nhảy điệu dễ thương' },
  吹气球: { en: 'Blow a balloon', vi: 'Thổi bóng bay' },
  动物环绕: { en: 'Surrounded by animals', vi: 'Thú nhỏ vây quanh' },
  放风筝: { en: 'Fly a kite', vi: 'Thả diều' },
  拆礼物: { en: 'Unwrap a gift', vi: 'Mở quà' },
  变鸽子: { en: 'Dove magic trick', vi: 'Ảo thuật biến chim bồ câu' },
  扑克魔术: { en: 'Card magic trick', vi: 'Ảo thuật bài tây' },
  抽陀螺: { en: 'Spin a top', vi: 'Đánh con quay' },
  吹笛子: { en: 'Play flute', vi: 'Thổi sáo' },
  蝴蝶蜜蜂环绕头顶开花: { en: 'Butterflies & blooming head', vi: 'Bướm ong vây quanh nở hoa' },
  撸猫: { en: 'Pet a cat', vi: 'Vuốt ve mèo' },
  凭空生花: { en: 'Conjure flowers', vi: 'Biến ra hoa' },
  骑木马: { en: 'Rocking horse', vi: 'Cưỡi ngựa gỗ' },
  三球抛接: { en: 'Juggle three balls', vi: 'Tung hứng ba bóng' },
  踢毽子: { en: 'Kick shuttlecock', vi: 'Đá cầu' },
  下五子棋: { en: 'Play Gomoku', vi: 'Chơi cờ caro' },
  荡秋千: { en: 'Play on a swing', vi: 'Đánh đu' },
  // 吃什么
  吃白饭: { en: 'Eat plain rice', vi: 'Ăn cơm trắng' },
  大口吃零食: { en: 'Munch snacks', vi: 'Ăn vặt ngon lành' },
  吃Token: { en: 'Eat tokens', vi: 'Ăn Token' },
  吃早餐: { en: 'Eat breakfast', vi: 'Ăn sáng' },
  吃午餐: { en: 'Eat lunch', vi: 'Ăn trưa' },
  吃晚餐: { en: 'Eat dinner', vi: 'Ăn tối' },
  吃冰淇淋融化: { en: 'Melting ice cream', vi: 'Ăn kem tan chảy' },
  吃大闸蟹: { en: 'Eat hairy crab', vi: 'Ăn cua lông' },
  吃糖葫芦: { en: 'Eat candied hawthorn', vi: 'Ăn kẹo hồ lô' },
  吃长寿面: { en: 'Eat longevity noodles', vi: 'Ăn mì trường thọ' },
  吃西瓜: { en: 'Eat watermelon', vi: 'Ăn dưa hấu' },
  涮火锅: { en: 'Eat hotpot', vi: 'Ăn lẩu' },
  // 时节
  被落叶淹没: { en: 'Buried in autumn leaves', vi: 'Ngập trong lá rụng' },
  中秋赏月吃月饼: { en: 'Mid-Autumn mooncake', vi: 'Trung thu ngắm trăng ăn bánh' },
  堆雪人: { en: 'Build a snowman', vi: 'Đắp người tuyết' },
  放烟花: { en: 'Set off fireworks', vi: 'Bắn pháo hoa' },
  吃粽子: { en: 'Eat zongzi', vi: 'Ăn bánh ú' },
  吃年糕: { en: 'Eat rice cake', vi: 'Ăn bánh gạo Tết' },
  吃青团: { en: 'Eat green rice ball', vi: 'Ăn bánh ngải' },
  吃腊八粥: { en: 'Eat Laba porridge', vi: 'Ăn cháo Lạp Bát' },
  吃重阳糕: { en: 'Eat Chongyang cake', vi: 'Ăn bánh Trùng Cửu' },
  收红包: { en: 'Receive lucky money', vi: 'Nhận lì xì' },
  写福字: { en: 'Write calligraphy', vi: 'Viết thư pháp chữ Phúc' },
  穿针乞巧: { en: 'Qixi needle threading', vi: 'Xâu kim lễ Thất Tịch' },
  舞狮头: { en: 'Lion dance', vi: 'Múa lân' },
  讨糖南瓜灯: { en: 'Halloween pumpkin', vi: 'Halloween xin kẹo bí ngô' },
  插茱萸赏菊: { en: 'Admire chrysanthemums', vi: 'Ngắm hoa cúc' },
  放河灯: { en: 'Float river lantern', vi: 'Thả đèn hoa đăng' },
  萌化小幽灵: { en: 'Cute little ghost', vi: 'Hồn ma nhỏ đáng yêu' },
  装点圣诞树: { en: 'Decorate Christmas tree', vi: 'Trang trí cây thông Noel' },
  放孔明灯: { en: 'Release sky lantern', vi: 'Thả đèn trời' },
  吃汤圆: { en: 'Eat tangyuan', vi: 'Ăn bánh trôi nước' },
  吃饺子: { en: 'Eat dumplings', vi: 'Ăn sủi cảo' },
  // 文字
  '是啊，吃什么': { en: 'Yeah, what to eat?', vi: 'Ừ nhỉ, ăn gì đây?' },
  深度思考碎碎念: { en: 'Deep thinking mutter', vi: 'Suy tư sâu sắc' },
  // 基础与事件动画
  待机呼吸休闲: { en: 'Idle breathing', vi: 'Thở nghỉ tại chỗ' },
  东张西望: { en: 'Look around', vi: 'Ngó nghiêng xung quanh' },
  被鼠标拖拽悬空反馈: { en: 'Dragged in mid-air', vi: 'Bị kéo lơ lửng' },
  '点击回应-开心跃动': { en: 'Click: happy hop', vi: 'Bấm: nhảy vui vẻ' },
  '点击回应-害羞惊讶': { en: 'Click: shy surprise', vi: 'Bấm: ngại ngùng bất ngờ' },
  '点击回应-傲娇生气': { en: 'Click: tsundere pout', vi: 'Bấm: hờn dỗi đáng yêu' },
  '点击回应-挠痒咯咯笑': { en: 'Click: tickled giggle', vi: 'Bấm: bị cù cười khúc khích' },
  '点击回应-元气挥手': { en: 'Click: cheerful wave', vi: 'Bấm: vẫy tay tươi tắn' },
  螃蟹走路: { en: 'Crab walk', vi: 'Đi ngang kiểu cua' },
  原地漂浮踏步: { en: 'Floating march', vi: 'Bước đi lơ lửng' },
  原地左转奔跑: { en: 'Turn left & run', vi: 'Quay trái chạy nhanh' },
  '余额-钱袋满溢': { en: 'Balance: overflowing purse', vi: 'Số dư: túi tiền rủng rỉnh' },
  '余额-金袋叮当': { en: 'Balance: jingling coins', vi: 'Số dư: túi vàng leng keng' },
  '余额-钱袋如常': { en: 'Balance: steady purse', vi: 'Số dư: túi tiền ổn định' },
  '余额-数金皱眉': { en: 'Balance: counting coins worriedly', vi: 'Số dư: đếm tiền cau mày' },
  '余额-袋空如洗': { en: 'Balance: nearly empty purse', vi: 'Số dư: túi sắp cạn' },
  '余额-分文不剩': { en: 'Balance: completely broke', vi: 'Số dư: sạch nhẵn không còn xu nào' },
  '碎碎念-擦桌碎碎念': { en: 'Whisper: wiping desk', vi: 'Lẩm bẩm: vừa lau bàn vừa nói' },
  '碎碎念-发呆碎碎念': { en: 'Whisper: daydreaming', vi: 'Lẩm bẩm: thẩn thờ suy nghĩ' },
  '碎碎念-对屏碎碎念': { en: 'Whisper: looking at screen', vi: 'Lẩm bẩm: nhìn màn hình nói chuyện' },
  '工作状态-思考冒泡': { en: 'Work: thinking bubbles', vi: 'Công việc: đang suy nghĩ' },
  '工作状态-忙碌点按': { en: 'Work: busy tapping', vi: 'Công việc: bận rộn thao tác' },
  '工作状态-清点归档': { en: 'Work: organizing results', vi: 'Công việc: kiểm tra tổng hợp' },
  '工作状态-原地踱步张望': { en: 'Work: pacing & waiting', vi: 'Công việc: đi qua lại chờ xác nhận' },
  '工作状态-雀跃庆祝': { en: 'Work: celebrating', vi: 'Công việc: reo mừng hoàn thành' },
  '工作状态-垂头叹气冒汗': { en: 'Work: sighing & sweating', vi: 'Công việc: thở dài toát mồ hôi' },
  '睡觉-开始': { en: 'Sleep: falling asleep', vi: 'Ngủ: bắt đầu buồn ngủ' },
  '睡觉-循环': { en: 'Sleep: sleeping', vi: 'Ngủ: đang ngủ say' },
  '睡觉-起来': { en: 'Sleep: waking up', vi: 'Ngủ: thức dậy' },
};

/** Built-in meme display labels (meme keys / .png filenames stay untouched). */
export const MEME_LABELS: Readonly<Record<string, BilingualLabel>> = {
  吃白饭的大肥鱼: { en: 'Freeloading fat whale', vi: 'Cá mập béo ăn bám' },
  大的要来啦: { en: 'Something big is coming!', vi: 'Sắp có biến lớn rồi!' },
  大的药来了: { en: 'Big pill incoming!', vi: 'Liều thuốc cực mạnh tới!' },
  要不直接骂他: { en: 'Should I scold them?', vi: 'Hay là mắng thẳng luôn?' },
  死掉了: { en: 'Completely dead', vi: 'Gục ngã hoàn toàn' },
  深度睡眠: { en: 'Deep sleep', vi: 'Ngủ sâu Zzz' },
  大烧货: { en: 'Token burner', vi: 'Đốt token cực mạnh' },
  先养着吧: { en: 'Keep them for now', vi: 'Thôi cứ nuôi tạm vậy' },
  吃饱饱摸肚子: { en: 'Full & happy belly', vi: 'No căng xoa bụng' },
  誓死践行开源精神: { en: 'Open-source salute', vi: 'Kiên quyết tinh thần mã nguồn mở' },
  电死你: { en: 'Zap you!', vi: 'Chích điện bây giờ!' },
  可爱: { en: 'Cute pose', vi: 'Dễ thương nè' },
  token给妈妈保管: { en: 'Hand over the tokens', vi: 'Đưa token đây giữ hộ cho' },
  假如给我三天多模态: { en: 'Three days of multimodal', vi: 'Nếu cho em 3 ngày đa phương thức' },
  厉害了我的鲸: { en: 'Awesome job!', vi: 'Đỉnh quá đi mất!' },
  哦鲸鲸: { en: 'Oh, really…', vi: 'Ồ thế à…' },
  压力一只大肥鱼: { en: 'Stressed fat whale', vi: 'Áp lực quá đi mất' },
  黎曼猜想没证明喵: { en: 'Riemann hypothesis unsolved', vi: 'Giả thuyết Riemann chưa giải xong' },
  除了调情没啥用: { en: 'Only good for flirting', vi: 'Chỉ giỏi tán gẫu thôi' },
  我不更新你们用什么: { en: 'Waiting for updates', vi: 'Em không cập nhật thì dùng gì' },
  哪来的电脑病毒: { en: 'What kind of virus is this', vi: 'Virus máy tính ở đâu ra thế' },
  鱼片有资源吗: { en: 'Got any sauce?', vi: 'Có tài nguyên gì không?' },
  大师这个区是什么意思: { en: 'Misread the character', vi: 'Nhìn nhầm chữ rồi sư phụ ơi' },
  就骚了怎么滴吧: { en: 'Sassy comeback', vi: 'Thế thì sao nào' },
  完蛋了把黄油删了: { en: 'Oops, deleted something!', vi: 'Toang rồi lỡ tay xóa mất!' },
  就一碗: { en: 'Just one bowl!', vi: 'Xin đúng một bát thôi!' },
  Ciallo: { en: 'Ciallo~', vi: 'Ciallo~' },
};

/** Translate a built-in animation category label; custom names pass through unchanged. */
export function translateCategoryLabel(name: string, lang?: ResolvedLanguage): string {
  const resolved = getActiveLanguage(lang);
  if (resolved === 'zh') return name;
  return CATEGORY_LABELS[name]?.[resolved] ?? name;
}

/** Translate a built-in animation display label; custom names pass through unchanged. */
export function translateAnimationLabel(name: string, lang?: ResolvedLanguage): string {
  const resolved = getActiveLanguage(lang);
  if (resolved === 'zh') return name;
  return ANIMATION_LABELS[name]?.[resolved] ?? name;
}

/** Translate a built-in meme display label; custom names pass through unchanged. */
export function translateMemeLabel(name: string, lang?: ResolvedLanguage): string {
  const resolved = getActiveLanguage(lang);
  if (resolved === 'zh') return name;
  return MEME_LABELS[name]?.[resolved] ?? name;
}

/** Translate a third-party menu label if it is a known built-in mini-game (like baifan). */
export function translateMoreItemLabel(owner: string, label: string, lang?: ResolvedLanguage): string {
  const resolved = getActiveLanguage(lang);
  if (resolved === 'zh') return label;
  if (owner === 'dsh-pet-baifan' && label === '吃白饭') {
    return resolved === 'vi' ? 'Ăn cơm trắng' : 'Rice Feast';
  }
  return label;
}

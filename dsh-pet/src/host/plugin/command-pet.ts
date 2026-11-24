/**
 * 斜杠命令 /pet：按 id 或名字切换当前桌宠。
 * @module dsh-pet/src/host/plugin/command-pet
 */
import type { BalancePoll } from './balance-poll.ts';
import type { ChatMemory } from './chat-memory.ts';
import type { ResolvedLanguage } from '../../shared/i18n/core.ts';
import type { HostContext } from './context.ts';

/** 桌宠选择命令的输入。 */
export type CommandPetInput = {
  /** 宿主上下文（apply 收到的那一个）。 */
  ctx: HostContext;
  /** Optional language reader for localized command text. */
  language?: () => ResolvedLanguage;
} & Pick<BalancePoll, 'effectivePetList'> &
  Pick<BalancePoll, 'petDisplayName'> &
  Pick<BalancePoll, 'resolveActivePetId'> &
  Pick<ChatMemory, 'setActivePetId'>;

/** 注册桌宠选择命令；返回的清理函数由 ctx.effect 收集。 */
export function registerPetCommand(deps: CommandPetInput): void {
  const { ctx, effectivePetList, language, petDisplayName, resolveActivePetId, setActivePetId } = deps;
  const lang = (): ResolvedLanguage => language?.() ?? 'zh';
  // /pet 斜杠命令：选择「当前桌宠」（/chat 对话的目标）。浏览器端另有 commandUi 装饰的选择框
  // （裸输 /pet 回车或菜单点选时弹出，选中后提交 /pet <id> 走同一 handler）；手输参数认 id 或名字
  // （name 可重复：唯一命中才认，重名报错列出候选 id）。
  ctx.effect(
    () =>
      ctx.commands.register({
        name: 'pet',
        description:
          lang() === 'vi'
            ? 'Chọn thú cưng đang tương tác cho /chat (chọn từ danh sách hoặc nhập id/tên)'
            : lang() === 'en'
              ? 'Select the active pet for /chat (picker or enter id/name)'
              : '选择桌宠（/chat 对话的目标；支持选择框或手输 id/名字）',
        input: {
          hint:
            lang() === 'vi'
              ? '[id hoặc tên] (để trống để xem hiện tại)'
              : lang() === 'en'
                ? '[pet id or name] (empty to show current)'
                : '[宠物 id 或名字]（留空查看当前）',
        },
        handler: ({ rawInput }: { rawInput: string }) => {
          const l = lang();
          const arg = rawInput.trim();
          let eff: Record<string, unknown>[];
          try {
            eff = effectivePetList();
          } catch {
            eff = [];
          }
          if (!arg) {
            const cur = resolveActivePetId();
            const found = eff.find((p) => String(p.id) === cur);
            const fallbackNone = l === 'vi' ? '(không có thú cưng nào)' : l === 'en' ? '(none)' : '（无可交互桌宠）';
            const prefix = l === 'vi' ? 'Thú cưng hiện tại: ' : l === 'en' ? 'Current pet: ' : '当前桌宠：';
            return {
              kind: 'success',
              text: prefix + (found ? petDisplayName(found) : cur || fallbackNone),
            };
          }
          const selectedPrefix = l === 'vi' ? 'Đã chọn thú cưng: ' : l === 'en' ? 'Selected pet: ' : '已选择桌宠：';
          const byId = eff.find((p) => String(p.id) === arg);
          if (byId) {
            setActivePetId(String(byId.id));
            return { kind: 'success', text: selectedPrefix + petDisplayName(byId) };
          }
          const byName = eff.filter((p) => petDisplayName(p) === arg);
          if (byName.length === 1) {
            setActivePetId(String(byName[0].id));
            return { kind: 'success', text: selectedPrefix + petDisplayName(byName[0]) };
          }
          if (byName.length > 1) {
            const ids = byName.map((p) => String(p.id)).join(l === 'zh' ? '、' : ', ');
            return {
              kind: 'error',
              text:
                l === 'vi'
                  ? `Có ${byName.length} thú cưng tên "${arg}" (id: ${ids}), hãy chỉ định theo id`
                  : l === 'en'
                    ? `${byName.length} pets share the name "${arg}" (ids: ${ids}) — specify by id`
                    : '「' + arg + '」有 ' + byName.length + ' 只桌宠（id：' + ids + '），请用 id 指定',
            };
          }
          return {
            kind: 'error',
            text:
              l === 'vi'
                ? `Không tìm thấy thú cưng "${arg}" (nhập id hoặc tên, hoặc gõ /pet để chọn)`
                : l === 'en'
                  ? `Pet "${arg}" not found (enter an id or name, or run /pet to open the picker)`
                  : '找不到桌宠「' + arg + '」（id 或名字都行；/pet 回车可打开选择框）',
          };
        },
      }),
    'dsh-pet: /pet command',
  );
}

/**
 * 语言设置卡（全局默认）：控制插件界面、菜单、待办、托盘与默认 AI 提示词语言。
 * 与其余全局默认同语义：只改本地状态，随「保存」整包写入并立即生效。
 * @module dsh-pet/src/client/settings/language-card
 */
import type { FunctionComponent } from 'react';
import { PET_LANGUAGES, type PetLanguage } from '../../shared/i18n/core.ts';
import type { SettingsRuntime } from './runtime.ts';
import { makeUiKit } from './ui.ts';
import { makeSelect } from './panel/select.ts';

/** 语言卡的输入。 */
export interface LanguageCardProps {
  /** 保存中或配置未就绪时禁用控件。 */
  busy: boolean;
  /** 当前配置的语言选项。 */
  language: PetLanguage;
  /** 修改语言选项。 */
  onChange: (language: PetLanguage) => void;
}

/**
 * 造语言设置卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export function makeLanguageCard(rt: SettingsRuntime): FunctionComponent<LanguageCardProps> {
  const { h, t } = rt;
  const { cardHead, field } = makeUiKit({ h, t });
  const Select = makeSelect(rt);

  return function LanguageCard(props: LanguageCardProps) {
    const { busy, language } = props;
    return h('div', {
      className: 'dsh-pet-cfg__card',
      children: [
        cardHead(t('languageTitle'), t('languageHint')),
        field(
          t('languageLabel'),
          h(Select, {
            label: t('languageLabel'),
            value: language,
            options: PET_LANGUAGES.map((id) => ({ id, label: t('language.' + id) })),
            disabled: busy,
            onChange: (id: string) => props.onChange(id as PetLanguage),
          }),
          t('languageFieldHint'),
        ),
      ],
    });
  };
}

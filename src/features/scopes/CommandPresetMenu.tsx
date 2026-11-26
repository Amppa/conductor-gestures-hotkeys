import type { ReactElement } from "react";
import { Menu, MenuDivider, MenuItem, MenuList, MenuPopover, MenuTrigger } from "@fluentui/react-components";
import { Add16Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import type { Action } from "../../domain/types";
import { COMMAND_CATEGORIES, getCommandCategory, type CommandCategory } from "../../domain/commandCategories";
import { formatActionName } from "../../shared/displayNames";

export function CommandPresetMenu({ templates, menuClassName, children, onSelect, onCreate }: {
  templates: Action[]; menuClassName: string; children: ReactElement;
  onSelect: (action: Action) => void; onCreate: (category: CommandCategory) => void;
}) {
  const { t } = useTranslation();
  return <Menu>
    <MenuTrigger disableButtonEnhancement>{children}</MenuTrigger>
    <MenuPopover><MenuList className={menuClassName}>
      {COMMAND_CATEGORIES.map((category) => <Menu key={category}>
        <MenuTrigger disableButtonEnhancement><MenuItem>{t(`nav.${category}`)}</MenuItem></MenuTrigger>
        <MenuPopover><MenuList className={menuClassName}>
          {templates.filter((item) => getCommandCategory(item) === category).map((item) =>
            <MenuItem key={item.id} onClick={() => onSelect(item)}>{formatActionName(t, item)}</MenuItem>)}
          <MenuDivider />
          <MenuItem icon={<Add16Regular />} onClick={() => onCreate(category)}>{t("targets.addNewAction")}</MenuItem>
        </MenuList></MenuPopover>
      </Menu>)}
    </MenuList></MenuPopover>
  </Menu>;
}

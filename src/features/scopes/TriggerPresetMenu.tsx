import type { ReactElement } from "react";
import { Menu, MenuDivider, MenuItem, MenuList, MenuPopover, MenuTrigger } from "@fluentui/react-components";
import { Add16Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import type { Gesture } from "../../domain/types";
import { getTriggerCategory, TRIGGER_CATEGORIES, type TriggerCategory } from "../../domain/triggerTypes";
import { formatGestureLabel } from "../gestures/gestureSymbols";
import { formatHotkeyTrigger } from "../hotkeys/hotkeyTrigger";
import { compareScreenTriggers } from "../../domain/triggers/screen";

interface TriggerPresetMenuProps {
  templates: Gesture[];
  menuClassName: string;
  children: ReactElement;
  onSelect: (template: Gesture) => void;
  onCreate: (category: TriggerCategory) => void;
}

export function TriggerPresetMenu({ templates, menuClassName, children, onSelect, onCreate }: TriggerPresetMenuProps) {
  const { t } = useTranslation();
  const screenTemplates = templates.filter((template) => getTriggerCategory(template) === "screen").sort(compareScreenTriggers);
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>{children}</MenuTrigger>
      <MenuPopover>
        <MenuList className={menuClassName}>
          {TRIGGER_CATEGORIES.map((category) => (
            <Menu key={category}>
              <MenuTrigger disableButtonEnhancement>
                <MenuItem>{t(`nav.${category}`)}</MenuItem>
              </MenuTrigger>
              <MenuPopover>
                <MenuList className={menuClassName}>
                  {(category === "screen" ? screenTemplates : templates.filter((template) => getTriggerCategory(template) === category)).map((template) => (
                    <MenuItem key={template.id} onClick={() => onSelect(template)}>
                      {category === "hotkeys"
                        ? formatHotkeyTrigger(template.trigger)
                        : formatGestureLabel(template.trigger, template.steps, t)}
                    </MenuItem>
                  ))}
                  <MenuDivider />
                  <MenuItem icon={<Add16Regular />} onClick={() => onCreate(category)}>
                    {t(category === "hotkeys" ? "hotkeys.add" : category === "mouseButtons" ? "gestures.addButton" : "gestures.add")}
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}

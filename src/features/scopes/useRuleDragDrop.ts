import { useState, type DragEvent } from "react";
import { tokens } from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import type { Target } from "../../domain/types";
import { moveBinding } from "../../domain/targetMutations";
import { formatScopeName } from "../../shared/displayNames";

interface DragSource {
  targetId: string;
  bindingId: string;
}

export function useRuleDragDrop(targets: Target[], onUpdateTargets: (targets: Target[]) => void) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState<DragSource | null>(null);
  const [dropLine, setDropLine] = useState<{ id: string; after: boolean } | null>(null);
  const [hoverScope, setHoverScope] = useState<string | null>(null);
  const [moveNotice, setMoveNotice] = useState("");

  const scopeName = (target: Target) => formatScopeName(t, target);

  const resetDrag = () => {
    setDragging(null);
    setDropLine(null);
    setHoverScope(null);
  };

  const moveRule = (destination: Target, beforeId?: string, after = false) => {
    if (!dragging) return;
    const result = moveBinding(targets, dragging.targetId, destination.id, dragging.bindingId, beforeId, after);
    if (result.moved) {
      onUpdateTargets(result.targets);
      setMoveNotice(t(result.conflict ? "targets.movedDisabled" : "targets.movedRule", { name: scopeName(destination) }));
    }
    resetDrag();
  };

  const scopeDropProps = (target: Target) => ({
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!dragging) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDropLine(null);
      setHoverScope(target.id);
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setHoverScope(null);
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      moveRule(target);
    },
    style: hoverScope === target.id ? { outline: `2px solid ${tokens.colorBrandStroke1}` } : undefined,
  });

  const rowDropProps = (target: Target, bindingId: string) => ({
    style: dropLine?.id === bindingId
      ? { boxShadow: `inset 0 ${dropLine.after ? "-2px" : "2px"} ${tokens.colorBrandStroke1}` }
      : undefined,
    onDragOver: (event: DragEvent<HTMLTableRowElement>) => {
      if (!dragging || dragging.bindingId === bindingId) return;
      event.preventDefault();
      event.stopPropagation();
      setHoverScope(null);
      event.dataTransfer.dropEffect = "move";
      const rect = event.currentTarget.getBoundingClientRect();
      setDropLine({ id: bindingId, after: event.clientY > rect.top + rect.height / 2 });
    },
    onDrop: (event: DragEvent<HTMLTableRowElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      moveRule(target, bindingId, event.clientY > rect.top + rect.height / 2);
    },
  });

  const dragHandleProps = (targetId: string, bindingId: string) => ({
    draggable: true,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", bindingId);
      setDragging({ targetId, bindingId });
    },
    onDragEnd: resetDrag,
  });

  return { hoverScope, moveNotice, scopeName, scopeDropProps, rowDropProps, dragHandleProps };
}

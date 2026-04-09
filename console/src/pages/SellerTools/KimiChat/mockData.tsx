import React from "react";
import {
  Globe,
  FileText,
  LayoutGrid,
  Table2,
  Search,
  Code,
  Cat,
  MessageSquare,
  Layers,
} from "lucide-react";

/* ─── Types ─── */

export interface NavItem {
  icon: React.ReactNode;
  labelKey: string;
  badge?: string;
}

export interface AltNameRow {
  name: string;
  style: string;
  desc: string;
}

/* ─── Navigation ─── */

export const mainNav: NavItem[] = [
  { icon: <Globe size={16} />, labelKey: "navWebsites" },
  { icon: <FileText size={16} />, labelKey: "navDocs" },
  { icon: <LayoutGrid size={16} />, labelKey: "navSlides" },
  { icon: <Table2 size={16} />, labelKey: "navSheets" },
  { icon: <Search size={16} />, labelKey: "navDeepResearch" },
];

export const toolsNav: NavItem[] = [
  { icon: <Code size={16} />, labelKey: "navKimiCode" },
  { icon: <Cat size={16} />, labelKey: "navKimiCat", badge: "Beta" },
];

export const historyItems: NavItem[] = [
  { icon: <MessageSquare size={16} />, labelKey: "history1" },
  { icon: <MessageSquare size={16} />, labelKey: "history2" },
  { icon: <MessageSquare size={16} />, labelKey: "history3" },
  { icon: <MessageSquare size={16} />, labelKey: "history4" },
  { icon: <MessageSquare size={16} />, labelKey: "history5" },
];

export const allChatsNav: NavItem = {
  icon: <Layers size={16} />,
  labelKey: "allChats",
};

/* ─── Chat Content ─── */

export const altNames: AltNameRow[] = [
  {
    name: "\u767D\u67DA (White Pomelo)",
    style: "\u6E05\u65B0\u54C1\u724C\u98CE",
    desc: "\u5EF6\u7EED\u201C\u897F\u67DA\u201D\u6C34\u679C\u7CFB\uFF0C\u7A81\u51FA\u7EAF\u767D\u4E3B\u9898\uFF0C\u9002\u5408\u4F5C\u4E3A\u4EA7\u54C1\u7CFB\u5217\u540D",
  },
  {
    name: "\u7D20\u89C6 (PureView)",
    style: "\u6781\u7B80\u8BBE\u8BA1\u98CE",
    desc: "\u201C\u7D20\u201D=\u7EAF\u767D\u65E0\u6742\uFF0C\u201C\u89C6\u201D=\u6570\u636E\u53EF\u89C6/\u6D1E\u5BDF\uFF0C\u5951\u5408\u6781\u7B80\u7F8E\u5B66",
  },
  {
    name: "\u660E\u955C (ClearMirror)",
    style: "\u4E13\u4E1A\u5546\u52A1\u98CE",
    desc: "\u5BC4\u610F\u6570\u636E\u6E05\u6670\u5982\u955C\uFF0C\u4E00\u76EE\u4E86\u7136\uFF0C\u9002\u5408 B2B \u5DE5\u5177\u5B9A\u4F4D",
  },
  {
    name: "\u6D41\u5149\u677F (FlowBoard)",
    style: "\u73B0\u4EE3\u6280\u672F\u98CE",
    desc: "\u201C\u6D41\u5149\u201D=\u6D41\u91CF+\u5149\u4EAE\uFF08\u767D\uFF09\uFF0C\u201C\u677F\u201D=Dashboard\uFF0C\u5E74\u8F7B\u5316",
  },
  {
    name: "\u4E00\u89C8 (YiLan)",
    style: "\u4E1C\u65B9\u6781\u7B80\u98CE",
    desc: "\u53D6\u81EA\u201C\u4E00\u89C8\u65E0\u4F59\u201D\uFF0C\u5355\u5B57\u54C1\u724C\u6781\u7B80\u5355\uFF0C\u9002\u5408\u4F5C\u4E3A\u5185\u90E8\u4EE3\u53F7",
  },
];

export const whiteModeNames = [
  "\u5BA3\u7EB8\u6A21\u5F0F",
  "\u7693\u767D\u89C6\u754C",
  "\u96F6\u5EA6\u767D (Zero White)",
];

export const EMOJI_TAG = "\u{1F3F7}\u{FE0F}";
export const EMOJI_LIGHT = "\u{1F4A1}";

export type ResourceItem = {
  id: string;
  title: string;
  /** 来自首个非空「文本」类属性，用于卡片展示 */
  excerpt: string;
  /** 标题 + 各属性纯文本的小写串，供前端过滤 */
  searchText: string;
  notionUrl: string;
  lastEdited: string;
  section: string;
  recommendType: string;
  visible: boolean;
  pinWeight: number;
  promoEndAt: string;
};

export type ResourcesResult =
  | { status: "ok"; items: ResourceItem[] }
  | { status: "not_configured"; items: [] }
  | { status: "error"; items: []; message: string };

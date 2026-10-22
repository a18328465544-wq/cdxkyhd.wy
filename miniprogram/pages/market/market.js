const { request } = require("../../utils/request");

function money(value) {
  return value == null ? "暂无报价" : `¥${Number(value).toLocaleString("zh-CN")}`;
}

function formatRange(low, high) {
  if (low == null || high == null) return "暂无报价";
  return low === high ? money(low) : `${money(low)} - ${money(high)}`;
}

Page({
  data: { keyword: "", rows: [], loading: false, error: false },
  onLoad() {
    this.loadRows();
  },
  onPullDownRefresh() {
    this.loadRows();
  },
  onKeyword(event) {
    this.setData({ keyword: event.detail.value });
  },
  search() {
    this.loadRows();
  },
  async loadRows() {
    this.setData({ loading: true, error: false });
    try {
      const query = this.data.keyword.trim() ? `?q=${encodeURIComponent(this.data.keyword.trim())}` : "";
      const result = await request({ path: `/api/miniprogram/market-prices${query}` });
      const rows = (result.data || []).map((row) => ({
        ...row,
        recycleText: formatRange(row.recyclePriceLow, row.recyclePriceHigh),
        dateText: row.date ? row.date : "未提供更新日期"
      }));
      this.setData({ rows, error: false });
    } catch (error) {
      this.setData({ rows: [], error: true });
      wx.showToast({ title: error.message || "行情加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  }
});

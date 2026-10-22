const { request } = require("../../utils/request");

function money(value) {
  return `¥${Number(value || 0).toLocaleString("zh-CN")}`;
}

function range(low, high) {
  if (low == null || high == null) return "暂无报价";
  return low === high ? money(low) : `${money(low)} - ${money(high)}`;
}

Page({
  data: {
    loading: true,
    error: false,
    options: [],
    selectedIndex: 0,
    selectedQuote: null,
    quantity: "1",
    unitText: "",
    totalText: ""
  },
  onLoad() {
    this.loadQuotes();
  },
  onPullDownRefresh() {
    this.loadQuotes();
  },
  async loadQuotes() {
    this.setData({ loading: true, error: false });
    try {
      const result = await request({ path: "/api/miniprogram/market-prices" });
      const options = (result.data || []).map((row) => ({
        ...row,
        label: `${row.model}${row.variant ? ` · ${row.variant}` : ""}`,
        dateText: row.date ? row.date : "未提供更新日期"
      }));
      this.setData({ options, selectedIndex: 0, selectedQuote: options[0] || null, error: false });
      this.updateEstimate(options[0] || null, this.data.quantity);
    } catch (error) {
      this.setData({ options: [], selectedQuote: null, error: true });
      this.updateEstimate(null, this.data.quantity);
      wx.showToast({ title: error.message || "行情加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },
  onQuoteChange(event) {
    const selectedIndex = Number(event.detail.value);
    const selectedQuote = this.data.options[selectedIndex] || null;
    this.setData({ selectedIndex, selectedQuote });
    this.updateEstimate(selectedQuote, this.data.quantity);
  },
  onQuantity(event) {
    const quantity = event.detail.value.replace(/[^0-9]/g, "").slice(0, 3);
    this.setData({ quantity });
    if (quantity) this.updateEstimate(this.data.selectedQuote, quantity);
  },
  onQuantityBlur() {
    const quantity = String(Math.max(1, Math.min(999, Number(this.data.quantity || 1))));
    this.setData({ quantity });
    this.updateEstimate(this.data.selectedQuote, quantity);
  },
  decrease() {
    const quantity = String(Math.max(1, Number(this.data.quantity || 1) - 1));
    this.setData({ quantity });
    this.updateEstimate(this.data.selectedQuote, quantity);
  },
  increase() {
    const quantity = String(Math.min(999, Number(this.data.quantity || 1) + 1));
    this.setData({ quantity });
    this.updateEstimate(this.data.selectedQuote, quantity);
  },
  updateEstimate(quote, quantityValue) {
    if (!quote) {
      this.setData({ unitText: "", totalText: "" });
      return;
    }
    const count = Math.max(1, Number(quantityValue || 1));
    const low = quote.recyclePriceLow;
    const high = quote.recyclePriceHigh;
    this.setData({
      unitText: range(low, high),
      totalText: range(low == null ? null : low * count, high == null ? null : high * count)
    });
  }
});

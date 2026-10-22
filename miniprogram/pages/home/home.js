const { request } = require("../../utils/request");

function money(value) {
  return value == null ? "到店询价" : `¥${Number(value).toLocaleString("zh-CN")}`;
}

function range(low, high) {
  if (low == null || high == null) return "暂无报价";
  return low === high ? money(low) : `${money(low)} - ${money(high)}`;
}

Page({
  data: { loading: true, error: false, quotes: [], products: [] },
  onLoad() {
    this.loadHome();
  },
  onPullDownRefresh() {
    this.loadHome();
  },
  async loadHome() {
    this.setData({ loading: true, error: false });
    try {
      const [quoteResult, productResult] = await Promise.all([
        request({ path: "/api/miniprogram/market-prices" }),
        request({ path: "/api/miniprogram/products" })
      ]);
      const quotes = (quoteResult.data || []).slice(0, 3).map((row) => ({
        ...row,
        recycleText: range(row.recyclePriceLow, row.recyclePriceHigh),
        dateText: row.date ? row.date : "未提供更新日期"
      }));
      const products = (productResult.data || []).slice(0, 3).map((product) => ({
        ...product,
        categoryShort: product.category?.slice(0, 3) || "数码",
        priceText: product.priceLow == null ? "到店询价" : money(product.priceLow)
      }));
      this.setData({ quotes, products });
    } catch (error) {
      this.setData({ error: true, quotes: [], products: [] });
      wx.showToast({ title: error.message || "内容加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  }
});

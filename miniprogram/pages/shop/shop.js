const { request } = require("../../utils/request");

const PAGE_SIZE = 9;
Page({
  data: {
    loading: false, error: false, keyword: "", category: "GPU",
    categories: [], products: [], visibleProducts: [], totalLabel: "", page: 1, pageCount: 1
  },
  onLoad() { this.loadProducts(); },
  onPullDownRefresh() { this.loadProducts(); },
  onKeyword(event) { this.setData({ keyword: event.detail.value }); },
  search() { this.loadProducts(); },
  selectCategory(event) {
    this.setData({ category: event.currentTarget.dataset.category });
    this.loadProducts();
  },
  async loadProducts() {
    const requestId = (this.requestId || 0) + 1;
    this.requestId = requestId;
    this.setData({ loading: true, error: false });
    try {
      const query = [`category=${encodeURIComponent(this.data.category)}`];
      if (this.data.keyword.trim()) query.push(`q=${encodeURIComponent(this.data.keyword.trim())}`);
      const result = await request({ path: `/api/miniprogram/products?${query.join("&")}` });
      if (requestId !== this.requestId) return;
      const products = (result.data || []).map((product) => ({
        ...product,
        categoryShort: product.category?.slice(0, 3) || "数码",
        priceText: product.priceLow == null ? "到店询价" : `¥${Number(product.priceLow).toLocaleString("zh-CN")}`
      }));
      this.setData({
        products, categories: result.categories || [], page: 1,
        pageCount: Math.max(1, Math.ceil(products.length / PAGE_SIZE)),
        totalLabel: `共 ${products.length} 件在售商品`, error: false
      });
      this.showPage(1);
    } catch (error) {
      if (requestId !== this.requestId) return;
      this.setData({ products: [], visibleProducts: [], totalLabel: "", error: true });
      wx.showToast({ title: error.message || "商品加载失败", icon: "none" });
    } finally {
      if (requestId === this.requestId) {
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
      }
    }
  },
  showPage(page) {
    this.setData({ page, visibleProducts: this.data.products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) });
  },
  previousPage() { if (this.data.page > 1) this.showPage(this.data.page - 1); },
  nextPage() { if (this.data.page < this.data.pageCount) this.showPage(this.data.page + 1); },
  openInquiry(event) {
    wx.navigateTo({ url: `/pages/inquiry/inquiry?productId=${encodeURIComponent(event.currentTarget.dataset.id)}` });
  }
});

const { request } = require("../../utils/request");

Page({
  data: { loading: true, product: null, contact: null, error: "" },
  onLoad(options) {
    this.productId = options.productId || "";
    this.loadProduct();
  },
  onPullDownRefresh() { this.loadProduct(); },
  async loadProduct() {
    this.setData({ loading: true, product: null, contact: null, error: "" });
    try {
      const contact = await request({ path: "/api/miniprogram/contact" });
      this.setData({ contact: contact.data });
      if (!this.productId) throw new Error("商品信息缺失");
      const result = await request({ path: `/api/miniprogram/products?id=${encodeURIComponent(this.productId)}` });
      const product = (result.data || [])[0];
      if (!product) throw new Error("商品已下架或暂时无货，请联系门店");
      this.setData({
        product: {
          ...product, categoryShort: product.category?.slice(0, 3) || "数码",
          priceText: product.priceLow == null ? "到店询价" : `¥${Number(product.priceLow).toLocaleString("zh-CN")}`
        }
      });
    } catch (error) {
      this.setData({ error: error.message || "商品加载失败" });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },
  callStore() {
    if (this.data.contact) wx.makePhoneCall({ phoneNumber: this.data.contact.phoneDisplay });
  },
  copyWechat() {
    if (this.data.contact) wx.setClipboardData({ data: this.data.contact.wechatId });
  },
  copyProduct() {
    const product = this.data.product;
    if (!product) return;
    wx.setClipboardData({
      data: `商品：${product.name}\n库存编号：${product.id}\n参考价格：${product.priceText}\n成色：${product.conditionLevel}\n请帮我确认当前库存、价格和购买方式。`
    });
  }
});

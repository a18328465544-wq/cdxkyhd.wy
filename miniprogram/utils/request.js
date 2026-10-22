const { API_BASE_URL } = require("../config");

function request({ path, method = "GET", data }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL.replace(/\/+$/, "")}${path}`,
      method,
      data,
      timeout: 15000,
      header: { Accept: "application/json", "Content-Type": "application/json" },
      success(response) {
        const body = response.data;
        if (response.statusCode >= 200 && response.statusCode < 300 &&
            body && typeof body === "object" && body.success === true) {
          resolve(body);
          return;
        }
        reject(new Error(typeof body?.error === "string" ? body.error : "门店服务暂时不可用，请稍后重试"));
      },
      fail() {
        reject(new Error("暂时无法连接门店，请检查网络后重试"));
      }
    });
  });
}
module.exports = { request };

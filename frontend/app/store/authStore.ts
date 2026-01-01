import {makeAutoObservable} from "mobx";

class Store {
  constructor() {
    makeAutoObservable(this);
  }

  // 工具函数：获取指定名称的 Cookie
  getCookie(name: string): string | null {
    let cookieValue: string | null = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // 工具函数：获取 Cookie，返回 string | undefined（用于 fetch headers）
  getCookieOrUndefined(name: string): string | undefined {
    return this.getCookie(name) ?? undefined;
  }
}

export default new Store();


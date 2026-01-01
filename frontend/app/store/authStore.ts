// Cookie 工具函数
// 注意：这些是纯函数，不需要状态管理，所以不使用 Zustand

export function getCookie(name: string): string | null {
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
export function getCookieOrUndefined(name: string): string | undefined {
  return getCookie(name) ?? undefined;
}


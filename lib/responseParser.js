/**
 * 解析后端JSON响应数据
 * @param {string} responseBody - 后端返回的JSON字符串
 * @returns {[boolean, any]}    - [是否成功, 数据或错误信息]
 */
export function parseResponse(responseBody) {
  try {
    const obj = typeof responseBody === 'string' 
      ? JSON.parse(responseBody) 
      : responseBody;

    if (obj && typeof obj === 'object') {
      if (Number(obj.Code) === 0) {
        return [true, obj.Data];
      } else {
        return [false, {
          code: obj.Code,
          message: obj.Msg || "请求失败"
        }];
      }
    } else {
      return [false, {
        code: -1,
        message: "无效的JSON格式"
      }];
    }
  } catch (e) {
    return [false, {
      code: -1,
      message: "JSON解析错误: " + e.message
    }];
  }
}
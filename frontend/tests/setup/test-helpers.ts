/**
 * 测试辅助函数
 * 提供生成唯一测试数据的功能
 */

/**
 * 基于测试文件路径生成唯一的测试标识符
 * 确保每个测试文件使用唯一的email和username，避免冲突
 */
export function generateTestUserIdentifiers(testFilePath: string, suffix?: string): {
  userId: string;
  email: string;
  username: string;
} {
  // 从测试文件路径提取有意义的名称
  const parts = testFilePath.split(/[/\\]/);
  const fileName = parts[parts.length - 1].replace('.test.ts', '').replace('.spec.ts', '');
  const domain = parts[parts.length - 3] || 'unknown';
  
  // 生成唯一标识符：使用时间戳和随机数确保唯一性
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const uniqueId = `${timestamp}-${randomId}`;
  
  // 清理文件名和域名，只保留字母数字和下划线
  const cleanFileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const cleanDomain = domain.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  // 生成唯一后缀（如果提供）
  const testSuffix = suffix ? `_${suffix.replace(/[^a-z0-9]/gi, '_').toLowerCase()}` : '';
  
  // 生成唯一标识符
  const baseId = `test_${cleanDomain}_${cleanFileName}${testSuffix}_${uniqueId}`;
  
  return {
    userId: baseId,
    email: `${baseId}@test.example.com`,
    username: `testuser_${cleanDomain}_${cleanFileName}${testSuffix}_${uniqueId}`,
  };
}

/**
 * 生成简单的测试用户标识符（用于单个测试用例）
 * 基于测试文件路径和可选的测试名称
 */
export function generateSimpleTestUserIdentifiers(
  testFilePath: string,
  testName?: string
): {
  userId: string;
  email: string;
  username: string;
} {
  return generateTestUserIdentifiers(testFilePath, testName);
}


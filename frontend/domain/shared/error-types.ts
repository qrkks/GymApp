/**
 * 统一错误类型定义
 * 所有领域共享相同的错误类型系统
 */

/**
 * 错误代码枚举
 */
export type ErrorCode =
  // 通用错误
  | 'INTERNAL_ERROR'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  // User 相关错误
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'INVALID_EMAIL'
  // BodyPart 相关错误
  | 'BODY_PART_ALREADY_EXISTS'
  | 'BODY_PART_NOT_FOUND'
  // Exercise 相关错误
  | 'EXERCISE_ALREADY_EXISTS'
  | 'EXERCISE_NOT_FOUND'
  // Workout 相关错误
  | 'WORKOUT_NOT_FOUND'
  | 'WORKOUT_ALREADY_EXISTS'
  // WorkoutSet 相关错误
  | 'WORKOUT_SET_NOT_FOUND'
  // Set 相关错误
  | 'SET_NOT_FOUND';

/**
 * 用例错误类型
 */
export interface UseCaseError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

/**
 * Result 类型 - 统一的返回类型
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: UseCaseError };

/**
 * 创建成功结果
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * 创建失败结果
 */
export function failure(
  code: ErrorCode,
  message: string,
  details?: unknown
): Result<never> {
  return {
    success: false,
    error: { code, message, details },
  };
}

/**
 * 根据错误代码获取 HTTP 状态码
 */
export function getStatusCode(errorCode: ErrorCode): number {
  switch (errorCode) {
    case 'UNAUTHORIZED':
      return 401;
    case 'NOT_FOUND':
    case 'USER_NOT_FOUND':
    case 'BODY_PART_NOT_FOUND':
    case 'EXERCISE_NOT_FOUND':
    case 'WORKOUT_NOT_FOUND':
    case 'WORKOUT_SET_NOT_FOUND':
    case 'SET_NOT_FOUND':
      return 404;
    case 'VALIDATION_ERROR':
    case 'INVALID_EMAIL':
    case 'USER_ALREADY_EXISTS':
    case 'BODY_PART_ALREADY_EXISTS':
    case 'EXERCISE_ALREADY_EXISTS':
    case 'WORKOUT_ALREADY_EXISTS':
      return 400;
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}

/**
 * 将 Result 转换为 HTTP 响应
 */
export function toHttpResponse<T>(result: Result<T>) {
  if (result.success) {
    return {
      status: 200,
      body: result.data,
    };
  }

  return {
    status: getStatusCode(result.error.code),
    body: { error: result.error.message },
  };
}


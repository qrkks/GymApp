#!/usr/bin/env node

/**
 * 配置验证脚本
 * 在不实际构建 Docker 镜像的情况下，检查配置文件的语法和逻辑问题
 * 可以在 Windows 下运行：node validate-config.js
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function logError(msg) {
  errors.push(msg);
  console.error(`${colors.red}❌ ${msg}${colors.reset}`);
}

function logWarning(msg) {
  warnings.push(msg);
  console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
}

function logSuccess(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function logInfo(msg) {
  console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`);
}

// 检查文件是否存在
function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    logError(`${description} 不存在: ${filePath}`);
    return false;
  }
  logSuccess(`${description} 存在: ${filePath}`);
  return true;
}

// 读取并解析 YAML（简单版本，不依赖外部库）
function readYaml(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const result = {};
  let currentSection = null;
  let indentStack = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    
    // 简单的 YAML 解析（仅用于验证）
    if (line.includes(':')) {
      const [key, value] = line.split(':').map(s => s.trim());
      if (value === '' || value === undefined) {
        currentSection = key;
      }
    }
  }
  
  return { content, lines };
}

// 检查 Dockerfile
function validateDockerfile() {
  logInfo('\n📋 检查 Dockerfile...');
  const dockerfilePath = path.join(__dirname, 'Dockerfile');
  
  if (!checkFileExists('Dockerfile', 'Dockerfile')) {
    return;
  }
  
  const content = fs.readFileSync(dockerfilePath, 'utf-8');
  const lines = content.split('\n');
  
  // 检查关键指令
  const requiredInstructions = ['FROM', 'WORKDIR', 'COPY', 'RUN', 'CMD'];
  const foundInstructions = new Set();
  
  let hasBuilder = false;
  let hasRunner = false;
  let userCreated = null;
  let userSwitched = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检查多阶段构建
    if (line.startsWith('FROM') && line.includes('AS builder')) {
      hasBuilder = true;
      logSuccess('找到构建阶段 (builder)');
    }
    if (line.startsWith('FROM') && line.includes('AS runner')) {
      hasRunner = true;
      logSuccess('找到运行时阶段 (runner)');
    }
    
    // 检查用户创建和切换
    if (line.includes('useradd') && line.includes('nextjs')) {
      userCreated = 'nextjs';
      logSuccess('找到用户创建: nextjs');
    }
    if (line.startsWith('USER')) {
      const match = line.match(/USER\s+(\w+)/);
      if (match) {
        userSwitched = match[1];
        logSuccess(`找到用户切换: ${userSwitched}`);
      }
    }
    
    // 检查关键指令
    for (const inst of requiredInstructions) {
      if (line.startsWith(inst)) {
        foundInstructions.add(inst);
      }
    }
    
    // 检查 COPY 指令中的 || true（这是错误的）
    if (line.includes('COPY') && line.includes('|| true')) {
      logError(`第 ${i + 1} 行: COPY 指令不能使用 || true (这是 shell 语法)`);
    }
    
    // 检查 pnpm-lock.yaml 处理（已使用 --mount，不需要警告）
    // 第 20 行的 COPY 是正常的（构建阶段）
    // 第 95 行已使用 --mount 处理，这是正确的
  }
  
  // 验证多阶段构建
  if (!hasBuilder) {
    logWarning('未找到构建阶段 (AS builder)，可能不是多阶段构建');
  }
  if (!hasRunner) {
    logError('未找到运行时阶段 (AS runner)，多阶段构建可能不完整');
  }
  
  // 验证用户一致性
  if (userCreated && userSwitched && userCreated !== userSwitched) {
    logWarning(`用户创建 (${userCreated}) 和切换 (${userSwitched}) 不一致`);
  }
  
  // 检查关键指令
  for (const inst of requiredInstructions) {
    if (!foundInstructions.has(inst)) {
      logWarning(`未找到关键指令: ${inst}`);
    }
  }
}

// 检查 docker-compose.yml
function validateDockerCompose() {
  logInfo('\n📋 检查 docker-compose.yml...');
  const composePath = path.join(__dirname, 'docker-compose.yml');
  
  if (!checkFileExists('docker-compose.yml', 'docker-compose.yml')) {
    return;
  }
  
  const { content, lines } = readYaml(composePath);
  
  // 检查服务定义
  if (!content.includes('gymapp:')) {
    logError('未找到 gymapp 服务定义');
  } else {
    logSuccess('找到 gymapp 服务定义');
  }
  
  if (!content.includes('postgres:')) {
    logWarning('未找到 postgres 服务定义');
  } else {
    logSuccess('找到 postgres 服务定义');
  }
  
  // 检查用户配置
  let userInCompose = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('user:') && line.includes('gymapp')) {
      const match = line.match(/user:\s*["']?(\w+)["']?/);
      if (match) {
        userInCompose = match[1];
        logSuccess(`docker-compose.yml 中指定的用户: ${userInCompose}`);
      }
    }
  }
  
  // 检查环境变量
  if (!content.includes('env_file:')) {
    logWarning('未找到 env_file 配置，环境变量可能不会自动加载');
  } else {
    logSuccess('找到 env_file 配置');
  }
  
  // 检查健康检查
  if (!content.includes('healthcheck:')) {
    logWarning('未找到健康检查配置');
  } else {
    logSuccess('找到健康检查配置');
  }
  
  return userInCompose;
}

// 检查脚本文件
function validateScripts() {
  logInfo('\n📋 检查启动脚本...');
  const scriptsDir = path.join(__dirname, 'scripts');
  
  if (!fs.existsSync(scriptsDir)) {
    logError('scripts 目录不存在');
    return;
  }
  
  const startScript = path.join(scriptsDir, 'start.sh');
  if (checkFileExists('scripts/start.sh', '启动脚本')) {
    const content = fs.readFileSync(startScript, 'utf-8');
    
    // 检查 shebang
    if (!content.startsWith('#!/bin/bash')) {
      logWarning('启动脚本缺少 shebang (#!/bin/bash)');
    } else {
      logSuccess('启动脚本包含正确的 shebang');
    }
    
    // 检查关键命令
    if (!content.includes('drizzle-kit')) {
      logWarning('启动脚本中未找到 drizzle-kit 命令');
    } else {
      logSuccess('启动脚本包含数据库迁移命令');
    }
    
    if (!content.includes('pnpm start')) {
      logWarning('启动脚本中未找到 pnpm start 命令');
    } else {
      logSuccess('启动脚本包含应用启动命令');
    }
  }
}

// 检查必需文件
function validateRequiredFiles() {
  logInfo('\n📋 检查必需文件...');
  
  const requiredFiles = [
    'package.json',
    'next.config.mjs',
    'tsconfig.json',
  ];
  
  for (const file of requiredFiles) {
    checkFileExists(file, file);
  }
  
  // 检查可选文件
  if (checkFileExists('pnpm-lock.yaml', 'pnpm-lock.yaml')) {
    logSuccess('找到 pnpm-lock.yaml');
  } else {
    logWarning('未找到 pnpm-lock.yaml（可选文件）');
  }
}

// 检查用户一致性
function checkUserConsistency(dockerfileUser, composeUser) {
  logInfo('\n📋 检查用户配置一致性...');
  
  if (dockerfileUser && composeUser) {
    if (dockerfileUser === composeUser) {
      logSuccess(`用户配置一致: ${dockerfileUser}`);
    } else {
      logError(`用户配置不一致: Dockerfile 使用 ${dockerfileUser}，docker-compose.yml 使用 ${composeUser}`);
    }
  } else {
    logWarning('无法验证用户配置一致性（缺少信息）');
  }
}

// 主函数
function main() {
  console.log(`${colors.blue}
╔═══════════════════════════════════════════════════════════╗
║          Docker 配置验证脚本                              ║
║          无需构建即可检查配置问题                          ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  // 检查必需文件
  validateRequiredFiles();
  
  // 检查 Dockerfile
  validateDockerfile();
  
  // 检查 docker-compose.yml
  const composeUser = validateDockerCompose();
  
  // 检查脚本
  validateScripts();
  
  // 检查用户一致性（需要从 Dockerfile 提取）
  // 这里简化处理，实际应该解析 Dockerfile
  const dockerfilePath = path.join(__dirname, 'Dockerfile');
  if (fs.existsSync(dockerfilePath)) {
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
    const userMatch = dockerfileContent.match(/USER\s+(\w+)/);
    const dockerfileUser = userMatch ? userMatch[1] : null;
    
    if (dockerfileUser && composeUser) {
      checkUserConsistency(dockerfileUser, composeUser);
    }
  }
  
  // 总结
  console.log(`\n${colors.blue}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║                      验证总结                              ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  if (errors.length === 0 && warnings.length === 0) {
    logSuccess('所有检查通过！配置看起来正常。');
    process.exit(0);
  } else {
    if (errors.length > 0) {
      console.log(`\n${colors.red}发现 ${errors.length} 个错误：${colors.reset}`);
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    if (warnings.length > 0) {
      console.log(`\n${colors.yellow}发现 ${warnings.length} 个警告：${colors.reset}`);
      warnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }
    
    console.log(`\n${colors.yellow}⚠️  请修复上述问题后再进行部署${colors.reset}\n`);
    process.exit(errors.length > 0 ? 1 : 0);
  }
}

// 运行验证
main();


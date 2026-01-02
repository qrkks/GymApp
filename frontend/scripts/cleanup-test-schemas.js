#!/usr/bin/env node

/**
 * 清理残留的测试schema
 * 用于删除测试过程中可能残留的schema
 */

const { Client } = require('pg');

// 数据库连接配置
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_TEST_DB || 'gymapp',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
};

async function cleanupTestSchemas() {
  const client = new Client(dbConfig);

  try {
    console.log('🔍 连接到数据库...');
    await client.connect();

    // 查询所有以 'test_' 开头的schema
    console.log('📋 查询测试schema...');
    const result = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name LIKE 'test_%'
      ORDER BY schema_name
    `);

    const testSchemas = result.rows.map(row => row.schema_name);

    if (testSchemas.length === 0) {
      console.log('✅ 没有找到残留的测试schema');
      return;
    }

    console.log(`🗑️ 发现 ${testSchemas.length} 个测试schema:`);
    testSchemas.forEach(schema => console.log(`  - ${schema}`));

    // 删除所有测试schema
    console.log('\n🧹 开始清理...');
    for (const schemaName of testSchemas) {
      try {
        await client.query(`DROP SCHEMA ${schemaName} CASCADE`);
        console.log(`✅ 已删除: ${schemaName}`);
      } catch (error) {
        console.error(`❌ 删除失败 ${schemaName}:`, error.message);
      }
    }

    console.log('\n🎉 清理完成！');

  } catch (error) {
    console.error('❌ 清理过程中出错:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupTestSchemas();
}

module.exports = { cleanupTestSchemas };

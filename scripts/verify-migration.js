#!/usr/bin/env node

/**
 * PostgreSQL迁移验证脚本
 * 验证数据迁移的完整性和正确性
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/gymapp'
});

async function verifyMigration() {
  console.log('🔍 开始验证PostgreSQL迁移结果...\n');

  try {
    const client = await pool.connect();

    // 验证表是否存在
    console.log('📋 验证表结构:');
    const tables = ['users', 'body_parts', 'exercises', 'workouts', 'workout_body_parts', 'workout_sets', 'sets'];
    for (const table of tables) {
      const result = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      `, [table]);

      const exists = result.rows[0].count > 0;
      console.log(`  ${table}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
    }

    console.log('\n📊 验证数据记录数:');

    // 验证每张表的数据量
    const tableQueries = {
      users: 'SELECT COUNT(*) FROM users',
      body_parts: 'SELECT COUNT(*) FROM body_parts',
      exercises: 'SELECT COUNT(*) FROM exercises',
      workouts: 'SELECT COUNT(*) FROM workouts',
      workout_body_parts: 'SELECT COUNT(*) FROM workout_body_parts',
      workout_sets: 'SELECT COUNT(*) FROM workout_sets',
      sets: 'SELECT COUNT(*) FROM sets'
    };

    for (const [table, query] of Object.entries(tableQueries)) {
      const result = await client.query(query);
      const count = result.rows[0].count;
      console.log(`  ${table}: ${count} 条记录`);
    }

    console.log('\n🔗 验证数据关系完整性:');

    // 验证外键关系
    const relationChecks = [
      {
        name: '用户 → 身体部位',
        query: 'SELECT COUNT(*) FROM body_parts bp LEFT JOIN users u ON bp.user_id = u.id WHERE u.id IS NULL'
      },
      {
        name: '身体部位 → 动作',
        query: 'SELECT COUNT(*) FROM exercises e LEFT JOIN body_parts bp ON e.body_part_id = bp.id WHERE bp.id IS NULL'
      },
      {
        name: '用户 → 动作',
        query: 'SELECT COUNT(*) FROM exercises e LEFT JOIN users u ON e.user_id = u.id WHERE u.id IS NULL'
      },
      {
        name: '用户 → 训练',
        query: 'SELECT COUNT(*) FROM workouts w LEFT JOIN users u ON w.user_id = u.id WHERE u.id IS NULL'
      },
      {
        name: '训练 → 训练组',
        query: 'SELECT COUNT(*) FROM workout_sets ws LEFT JOIN workouts w ON ws.workout_id = w.id WHERE w.id IS NULL'
      },
      {
        name: '动作 → 训练组',
        query: 'SELECT COUNT(*) FROM workout_sets ws LEFT JOIN exercises e ON ws.exercise_id = e.id WHERE e.id IS NULL'
      },
      {
        name: '训练组 → 组',
        query: 'SELECT COUNT(*) FROM sets s LEFT JOIN workout_sets ws ON s.workout_set_id = ws.id WHERE ws.id IS NULL'
      }
    ];

    for (const check of relationChecks) {
      const result = await client.query(check.query);
      const orphanedCount = result.rows[0].count;
      const status = orphanedCount === 0 ? '✅ 完整' : `❌ ${orphanedCount}条孤立记录`;
      console.log(`  ${check.name}: ${status}`);
    }

    console.log('\n🧪 验证数据质量:');

    // 检查必填字段
    const qualityChecks = [
      { name: '用户名不为空', query: 'SELECT COUNT(*) FROM users WHERE username IS NULL OR username = \'\'' },
      { name: '训练日期不为空', query: 'SELECT COUNT(*) FROM workouts WHERE date IS NULL OR date = \'\'' },
      { name: '训练开始时间不为空', query: 'SELECT COUNT(*) FROM workouts WHERE start_time IS NULL' },
      { name: '重量不为负数', query: 'SELECT COUNT(*) FROM sets WHERE weight < 0' },
      { name: '次数不为负数', query: 'SELECT COUNT(*) FROM sets WHERE reps < 0' }
    ];

    for (const check of qualityChecks) {
      const result = await client.query(check.query);
      const invalidCount = result.rows[0].count;
      const status = invalidCount === 0 ? '✅ 通过' : `⚠️ ${invalidCount}条异常数据`;
      console.log(`  ${check.name}: ${status}`);
    }

    // 样本数据检查
    console.log('\n📝 样本数据检查:');

    const sampleQueries = [
      { name: '前3个用户', query: 'SELECT id, username, email FROM users LIMIT 3' },
      { name: '前3个训练', query: 'SELECT id, user_id, date, start_time FROM workouts LIMIT 3' },
      { name: '前3个动作', query: 'SELECT id, name, body_part_id FROM exercises LIMIT 3' }
    ];

    for (const sample of sampleQueries) {
      const result = await client.query(sample.query);
      console.log(`  ${sample.name}:`);
      result.rows.forEach(row => {
        console.log(`    ${JSON.stringify(row)}`);
      });
    }

    client.release();

    console.log('\n🎉 验证完成！请检查上述结果是否符合预期。');

  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyMigration();

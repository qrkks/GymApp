/**
 * 导入生产数据库脚本
 * 处理旧数据库结构到新结构的迁移
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const productionDbPath = process.env.PRODUCTION_DB_PATH || './db.production.sqlite3';
const targetDbPath = process.env.DATABASE_PATH || './db.sqlite';

console.log('开始导入生产数据库...');
console.log(`生产数据库路径: ${productionDbPath}`);
console.log(`目标数据库路径: ${targetDbPath}`);

// 检查生产数据库文件是否存在
if (!fs.existsSync(productionDbPath)) {
  console.error(`错误: 生产数据库文件不存在: ${productionDbPath}`);
  console.log('请将生产数据库文件放在 frontend 目录下，或设置 PRODUCTION_DB_PATH 环境变量');
  process.exit(1);
}

// 备份当前数据库（如果存在）
if (fs.existsSync(targetDbPath)) {
  const backupPath = `${targetDbPath}.backup.${Date.now()}`;
  console.log(`备份当前数据库到: ${backupPath}`);
  fs.copyFileSync(targetDbPath, backupPath);
}

// 打开生产数据库
const productionDb = new Database(productionDbPath, { readonly: true });
const targetDb = new Database(targetDbPath);

try {
  // 检查生产数据库的表结构
  console.log('\n检查生产数据库结构...');
  const productionTables = productionDb
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as Array<{ name: string }>;
  
  console.log('生产数据库中的表:', productionTables.map(t => t.name).join(', '));

  // 检查 users 表结构
  const usersTableInfo = productionDb
    .prepare("PRAGMA table_info(users)")
    .all() as Array<{ cid: number; name: string; type: string; notnull: number; dflt_value: any; pk: number }>;
  
  console.log('\n生产数据库 users 表结构:');
  usersTableInfo.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'}`);
  });

  const hasEmailColumn = usersTableInfo.some(col => col.name === 'email');
  const hasEmailVerifiedColumn = usersTableInfo.some(col => col.name === 'emailVerified');
  const hasCreatedAtColumn = usersTableInfo.some(col => col.name === 'createdAt');
  const hasUpdatedAtColumn = usersTableInfo.some(col => col.name === 'updatedAt');

  console.log(`\n字段检查:`);
  console.log(`  - email: ${hasEmailColumn ? '存在' : '不存在'}`);
  console.log(`  - emailVerified: ${hasEmailVerifiedColumn ? '存在' : '不存在'}`);
  console.log(`  - createdAt: ${hasCreatedAtColumn ? '存在' : '不存在'}`);
  console.log(`  - updatedAt: ${hasUpdatedAtColumn ? '存在' : '不存在'}`);

  // 检查并创建新数据库结构（使用 Drizzle 迁移）
  console.log('\n检查数据库结构...');
  
  // 检查表是否存在
  const existingTables = targetDb
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as Array<{ name: string }>;
  
  if (existingTables.length === 0) {
    // 如果表不存在，创建表结构
    console.log('创建新数据库结构...');
    const migrationSql = fs.readFileSync(
      path.join(__dirname, '../drizzle/0000_chubby_vertigo.sql'),
      'utf-8'
    );
    
    // 执行迁移 SQL
    targetDb.exec(migrationSql);
    console.log('✓ 数据库结构创建完成');
  } else {
    // 如果表已存在，清空表数据
    console.log('清空现有表数据...');
    targetDb.exec(`
      DELETE FROM sets;
      DELETE FROM workout_sets;
      DELETE FROM workout_body_parts;
      DELETE FROM workouts;
      DELETE FROM exercises;
      DELETE FROM body_parts;
      DELETE FROM users;
    `);
    console.log('✓ 已清空现有表数据');
  }

  // 开始事务导入数据
  console.log('\n开始导入数据...');
  
  // 先读取所有用户，创建 ID 映射表
  const usersTableName = productionTables.some(t => t.name === 'auth_user') 
    ? 'auth_user' 
    : 'users';
  const productionUsers = productionDb
    .prepare(`SELECT * FROM ${usersTableName}`)
    .all() as Array<any>;
  
  // 创建用户 ID 映射：Django 整数 ID -> 新系统文本 ID（用户名）
  const userIdMap = new Map<number | string, string>();
  for (const user of productionUsers) {
    const newUserId = typeof user.id === 'number' 
      ? (user.username || String(user.id))
      : user.id;
    userIdMap.set(user.id, newUserId);
  }
  
  const transaction = targetDb.transaction(() => {
    // 1. 导入 users 表（Django 使用 auth_user）
    console.log('导入 users 表...');
    console.log(`  找到 ${productionUsers.length} 个用户`);
    
    const insertUser = targetDb.prepare(`
      INSERT INTO users (id, username, email, password, emailVerified, image, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const user of productionUsers) {
      // Django auth_user 表字段映射
      // Django 使用: id (整数), username, email, password, date_joined, last_login
      // 新系统使用: id (文本), username, email, password, createdAt, updatedAt
      
      // 处理用户 ID：Django 使用整数 ID，新系统使用文本 ID（通常是邮箱或用户名）
      const userId = userIdMap.get(user.id)!;
      
      // 处理 email 字段：Django 可能没有 email 字段或为空
      let email = user.email || null;
      if (!email || (typeof email === 'string' && email.trim() === '')) {
        email = null; // 保持为 null，因为新系统允许 email 为可选
      }

      // 处理时间戳：Django 使用 date_joined 和 last_login（可能是字符串或时间戳）
      let createdAt: number;
      if (user.date_joined) {
        createdAt = typeof user.date_joined === 'string' 
          ? new Date(user.date_joined).getTime()
          : (user.date_joined * 1000); // Django 可能使用 Unix 时间戳（秒）
      } else {
        createdAt = user.createdAt || user.created_at || Date.now();
      }
      
      let updatedAt: number;
      if (user.last_login) {
        updatedAt = typeof user.last_login === 'string'
          ? new Date(user.last_login).getTime()
          : (user.last_login * 1000);
      } else {
        updatedAt = user.updatedAt || user.updated_at || createdAt;
      }
      
      // 处理 emailVerified（Django 通常没有这个字段）
      const emailVerified = hasEmailVerifiedColumn 
        ? (user.emailVerified || user.email_verified || 0)
        : 0;

      try {
        insertUser.run(
          userId,
          user.username,
          email,
          user.password || null,
          emailVerified ? 1 : 0,
          null, // image 字段，Django 通常没有
          createdAt,
          updatedAt
        );
      } catch (error: any) {
        console.warn(`  警告: 跳过用户 ${user.username} (${user.id}): ${error.message}`);
      }
    }
    console.log(`  ✓ 已导入 ${productionUsers.length} 个用户`);

    // 2. 导入 body_parts 表（Django 使用 gym_bodypart）
    const bodyPartsTableName = productionTables.some(t => t.name === 'gym_bodypart')
      ? 'gym_bodypart'
      : (productionTables.some(t => t.name === 'body_parts') ? 'body_parts' : null);
    
    if (bodyPartsTableName) {
      console.log(`导入 ${bodyPartsTableName} 表...`);
      const productionBodyParts = productionDb
        .prepare(`SELECT * FROM ${bodyPartsTableName}`)
        .all() as Array<any>;
      
      console.log(`  找到 ${productionBodyParts.length} 个身体部位`);
      
      const insertBodyPart = targetDb.prepare(`
        INSERT INTO body_parts (id, user_id, name)
        VALUES (?, ?, ?)
      `);

      for (const bp of productionBodyParts) {
        try {
          // Django 可能使用 user_id（外键到 auth_user.id，整数）
          // 需要将整数 user_id 映射到新系统的文本 user_id
          const oldUserId = bp.user_id || bp.userId;
          const userId = userIdMap.get(oldUserId) || String(oldUserId);
          
          insertBodyPart.run(
            bp.id,
            userId,
            bp.name
          );
        } catch (error: any) {
          console.warn(`  警告: 跳过身体部位 ${bp.name}: ${error.message}`);
        }
      }
      console.log(`  ✓ 已导入 ${productionBodyParts.length} 个身体部位`);
    }

    // 3. 导入 exercises 表（Django 使用 gym_exercise）
    const exercisesTableName = productionTables.some(t => t.name === 'gym_exercise')
      ? 'gym_exercise'
      : (productionTables.some(t => t.name === 'exercises') ? 'exercises' : null);
    
    if (exercisesTableName) {
      console.log(`导入 ${exercisesTableName} 表...`);
      const productionExercises = productionDb
        .prepare(`SELECT * FROM ${exercisesTableName}`)
        .all() as Array<any>;
      
      console.log(`  找到 ${productionExercises.length} 个动作`);
      
      const insertExercise = targetDb.prepare(`
        INSERT INTO exercises (id, user_id, name, description, body_part_id)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const ex of productionExercises) {
        try {
          const oldUserId = ex.user_id || ex.userId;
          const userId = userIdMap.get(oldUserId) || String(oldUserId);
          
          insertExercise.run(
            ex.id,
            userId,
            ex.name,
            ex.description || null,
            ex.body_part_id || ex.bodyPartId
          );
        } catch (error: any) {
          console.warn(`  警告: 跳过动作 ${ex.name}: ${error.message}`);
        }
      }
      console.log(`  ✓ 已导入 ${productionExercises.length} 个动作`);
    }

    // 4. 导入 workouts 表（Django 使用 gym_workout）
    const workoutsTableName = productionTables.some(t => t.name === 'gym_workout')
      ? 'gym_workout'
      : (productionTables.some(t => t.name === 'workouts') ? 'workouts' : null);
    
    if (workoutsTableName) {
      console.log(`导入 ${workoutsTableName} 表...`);
      const productionWorkouts = productionDb
        .prepare(`SELECT * FROM ${workoutsTableName}`)
        .all() as Array<any>;
      
      console.log(`  找到 ${productionWorkouts.length} 个训练`);
      
      const insertWorkout = targetDb.prepare(`
        INSERT INTO workouts (id, user_id, date, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const workout of productionWorkouts) {
        try {
          const oldUserId = workout.user_id || workout.userId;
          const userId = userIdMap.get(oldUserId) || String(oldUserId);
          
          // 处理日期：Django 可能使用不同的日期格式
          let date = workout.date;
          if (date && typeof date === 'string' && date.includes(' ')) {
            // 如果是日期时间字符串，只取日期部分
            date = date.split(' ')[0];
          }
          
          insertWorkout.run(
            workout.id,
            userId,
            date,
            workout.start_time || workout.startTime || Date.now(),
            workout.end_time || workout.endTime || null
          );
        } catch (error: any) {
          console.warn(`  警告: 跳过训练 ${workout.id}: ${error.message}`);
        }
      }
      console.log(`  ✓ 已导入 ${productionWorkouts.length} 个训练`);
    }

    // 5. 导入 workout_body_parts 表（Django 使用 gym_workout_body_parts）
    const wbpTableName = productionTables.some(t => t.name === 'gym_workout_body_parts')
      ? 'gym_workout_body_parts'
      : (productionTables.some(t => t.name === 'workout_body_parts') ? 'workout_body_parts' : null);
    
    if (wbpTableName) {
      console.log(`导入 ${wbpTableName} 表...`);
      const productionWbps = productionDb
        .prepare(`SELECT * FROM ${wbpTableName}`)
        .all() as Array<any>;
      
      console.log(`  找到 ${productionWbps.length} 个训练-身体部位关联`);
      
      const insertWbp = targetDb.prepare(`
        INSERT INTO workout_body_parts (workout_id, body_part_id)
        VALUES (?, ?)
      `);

      // 先检查字段名
      const sampleWbp = productionWbps[0];
      if (sampleWbp) {
        console.log(`  示例字段名: ${Object.keys(sampleWbp).join(', ')}`);
      }

      // Django ManyToMany 中间表字段名：workout_id 和 bodypart_id (注意是 bodypart 不是 body_part)
      for (const wbp of productionWbps) {
        try {
          // Django 多对多中间表使用：workout_id 和 bodypart_id
          const workoutId = wbp.workout_id || wbp.workoutId;
          const bodyPartId = wbp.bodypart_id || wbp.body_part_id || wbp.bodyPartId;
          
          // 如果还是找不到，跳过
          if (!workoutId || bodyPartId === undefined || bodyPartId === null) {
            console.warn(`  警告: 跳过关联（缺少字段）: workout_id=${workoutId}, bodypart_id=${bodyPartId}, 所有字段: ${JSON.stringify(wbp)}`);
            continue;
          }
          
          insertWbp.run(workoutId, bodyPartId);
        } catch (error: any) {
          console.warn(`  警告: 跳过关联 ${wbp.workout_id || wbp.workoutId || '?'}-${wbp.bodypart_id || wbp.body_part_id || wbp.bodyPartId || '?'}: ${error.message}`);
        }
      }
      console.log(`  ✓ 已导入 ${productionWbps.length} 个训练-身体部位关联`);
    }

    // 6. 导入 workout_sets 表（Django 使用 gym_workoutset）
    const workoutSetsTableName = productionTables.some(t => t.name === 'gym_workoutset')
      ? 'gym_workoutset'
      : (productionTables.some(t => t.name === 'workout_sets') ? 'workout_sets' : null);
    
    if (workoutSetsTableName) {
      console.log(`导入 ${workoutSetsTableName} 表...`);
      const productionWorkoutSets = productionDb
        .prepare(`SELECT * FROM ${workoutSetsTableName}`)
        .all() as Array<any>;
      
      console.log(`  找到 ${productionWorkoutSets.length} 个训练组`);
      
      const insertWorkoutSet = targetDb.prepare(`
        INSERT INTO workout_sets (id, user_id, workout_id, exercise_id)
        VALUES (?, ?, ?, ?)
      `);

      for (const ws of productionWorkoutSets) {
        try {
          const oldUserId = ws.user_id || ws.userId;
          const userId = userIdMap.get(oldUserId) || String(oldUserId);
          
          insertWorkoutSet.run(
            ws.id,
            userId,
            ws.workout_id || ws.workoutId,
            ws.exercise_id || ws.exerciseId
          );
        } catch (error: any) {
          console.warn(`  警告: 跳过训练组 ${ws.id}: ${error.message}`);
        }
      }
      console.log(`  ✓ 已导入 ${productionWorkoutSets.length} 个训练组`);
    }

    // 7. 导入 sets 表（Django 使用 gym_set）
    const setsTableName = productionTables.some(t => t.name === 'gym_set')
      ? 'gym_set'
      : (productionTables.some(t => t.name === 'sets') ? 'sets' : null);
    
    if (setsTableName) {
      console.log(`导入 ${setsTableName} 表...`);
      const productionSets = productionDb
        .prepare(`SELECT * FROM ${setsTableName}`)
        .all() as Array<any>;
      
      console.log(`  找到 ${productionSets.length} 个组`);
      
      const insertSet = targetDb.prepare(`
        INSERT INTO sets (id, user_id, workout_set_id, set_number, weight, reps)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const set of productionSets) {
        try {
          const oldUserId = set.user_id || set.userId;
          const userId = userIdMap.get(oldUserId) || String(oldUserId);
          
          insertSet.run(
            set.id,
            userId,
            set.workout_set_id || set.workoutSetId,
            set.set_number || set.setNumber,
            set.weight,
            set.reps
          );
        } catch (error: any) {
          console.warn(`  警告: 跳过组 ${set.id}: ${error.message}`);
        }
      }
      console.log(`  ✓ 已导入 ${productionSets.length} 个组`);
    }
  });

  transaction();

  console.log('\n✓ 数据导入完成！');
  console.log(`\n数据库已保存到: ${targetDbPath}`);
  console.log('\n注意:');
  console.log('  - 如果用户没有邮箱，email 字段将设置为 NULL');
  console.log('  - 这些用户可能需要更新邮箱才能使用某些功能');
  console.log('  - 建议检查并更新缺少邮箱的用户');

} catch (error: any) {
  console.error('\n导入失败:', error);
  process.exit(1);
} finally {
  productionDb.close();
  targetDb.close();
}


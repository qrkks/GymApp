/**
 * 重置所有用户密码为 "123698"
 * 警告：此脚本会修改所有用户的密码！
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../lib/db/schema';
import { users } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const dbPath = process.env.DATABASE_PATH || './db.sqlite';
const NEW_PASSWORD = '123698';

async function resetAllPasswords() {
  try {
    console.log('🔐 正在重置所有用户密码...');
    console.log(`📁 数据库位置: ${dbPath}`);

    // 创建数据库连接
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, { schema });

    // 获取所有用户
    const allUsers = await db.select().from(users);
    console.log(`📊 找到 ${allUsers.length} 个用户`);

    if (allUsers.length === 0) {
      console.log('⚠️  数据库中没有用户，无需重置');
      sqlite.close();
      return;
    }

    // 哈希新密码
    console.log('🔒 正在生成密码哈希...');
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    console.log('✅ 密码哈希生成完成');

    // 更新所有用户的密码
    let successCount = 0;
    let failCount = 0;

    for (const user of allUsers) {
      try {
        await db
          .update(users)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        console.log(`✅ 已重置用户 ${user.username || user.email || user.id} 的密码`);
        successCount++;
      } catch (error) {
        console.error(`❌ 重置用户 ${user.username || user.email || user.id} 的密码失败:`, error);
        failCount++;
      }
    }

    sqlite.close();

    console.log('\n📊 重置结果:');
    console.log(`✅ 成功: ${successCount} 个用户`);
    if (failCount > 0) {
      console.log(`❌ 失败: ${failCount} 个用户`);
    }
    console.log(`\n🔑 所有用户的密码已重置为: ${NEW_PASSWORD}`);
    console.log('⚠️  请提醒用户尽快修改密码！');
  } catch (error) {
    console.error('❌ 重置密码失败:', error);
    process.exit(1);
  }
}

// 运行脚本
resetAllPasswords();


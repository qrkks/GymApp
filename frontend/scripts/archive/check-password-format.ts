import Database from 'better-sqlite3';

const db = new Database('./db.sqlite');

try {
  // 检查表是否存在
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
  console.log('数据库中的表:', tables.map(t => t.name).join(', '));

  if (tables.some(t => t.name === 'users')) {
    // 获取前3个用户的密码前缀（前30个字符，足够识别格式）
    const users = db.prepare(`
      SELECT id, username, email, 
             CASE 
               WHEN length(password) > 30 THEN substr(password, 1, 30) || '...'
               ELSE password
             END as pwd_preview
      FROM users 
      LIMIT 3
    `).all() as Array<{ id: string; username: string; email: string | null; pwd_preview: string | null }>;

    console.log('\n用户密码格式检查:');
    console.log('='.repeat(60));
    
    for (const user of users) {
      console.log(`\n用户: ${user.username} (${user.id})`);
      console.log(`邮箱: ${user.email || '无'}`);
      
      if (!user.pwd_preview) {
        console.log('密码: NULL（无密码）');
      } else {
        const pwd = user.pwd_preview;
        console.log(`密码前缀: ${pwd}`);
        
        // 检查密码格式
        if (pwd.startsWith('pbkdf2_')) {
          console.log('格式: Django PBKDF2 (不兼容 bcrypt)');
          console.log('⚠️  警告: 此密码格式与新系统的 bcrypt 不兼容！');
        } else if (pwd.startsWith('$2a$') || pwd.startsWith('$2b$') || pwd.startsWith('$2y$')) {
          console.log('格式: bcrypt (兼容)');
          console.log('✓ 此密码格式与新系统兼容');
        } else if (pwd.startsWith('argon2')) {
          console.log('格式: Argon2 (不兼容 bcrypt)');
          console.log('⚠️  警告: 此密码格式与新系统的 bcrypt 不兼容！');
        } else {
          console.log('格式: 未知格式');
          console.log('⚠️  警告: 无法识别密码格式，可能不兼容！');
        }
      }
    }
  } else {
    console.log('users 表不存在');
  }
} catch (error: any) {
  console.error('错误:', error.message);
} finally {
  db.close();
}


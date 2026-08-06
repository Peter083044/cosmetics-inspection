import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";

initDatabase();

// POST /api/users/batch - 批量创建用户（仅管理员）
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const {
      assistant_count = 0,
      line_leader_count = 0,
      supervisor_count = 0,
      qc_count = 0,
      password = "pass123",
    } = body;

    const hashedPassword = await hashPassword(password);
    const createdUsers: { username: string; role: string; name: string }[] = [];

    // 获取当前各角色的最大序号
    const getMaxId = (prefix: string): number => {
      const result = db
        .prepare(`SELECT username FROM users WHERE username LIKE ? ORDER BY id DESC LIMIT 1`)
        .get(`${prefix}%`) as { username: string } | undefined;
      if (!result) return 0;
      const match = result.username.match(new RegExp(`${prefix}(\\d+)`));
      return match ? parseInt(match[1]) : 0;
    };

    // 创建辅助人员
    let assistantStart = getMaxId("assistant") + 1;
    for (let i = 0; i < assistant_count; i++) {
      const username = `assistant${assistantStart + i}`;
      const name = `辅助${assistantStart + i}`;
      try {
        db.prepare(
          "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)"
        ).run(username, hashedPassword, name, "assistant");
        createdUsers.push({ username, role: "assistant", name });
      } catch {
        // 用户名已存在，跳过
      }
    }

    // 创建线长
    let leaderStart = getMaxId("leader") + 1;
    for (let i = 0; i < line_leader_count; i++) {
      const username = `leader${leaderStart + i}`;
      const name = `线长${leaderStart + i}`;
      try {
        db.prepare(
          "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)"
        ).run(username, hashedPassword, name, "line_leader");
        createdUsers.push({ username, role: "line_leader", name });
      } catch {
        // 用户名已存在，跳过
      }
    }

    // 创建主管
    let supervisorStart = getMaxId("supervisor") + 1;
    for (let i = 0; i < supervisor_count; i++) {
      const username = `supervisor${supervisorStart + i}`;
      const name = `主管${supervisorStart + i}`;
      try {
        db.prepare(
          "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)"
        ).run(username, hashedPassword, name, "supervisor");
        createdUsers.push({ username, role: "supervisor", name });
      } catch {
        // 用户名已存在，跳过
      }
    }

    // 创建QC
    let qcStart = getMaxId("qc") + 1;
    for (let i = 0; i < qc_count; i++) {
      const username = `qc${qcStart + i}`;
      const name = `QC${qcStart + i}`;
      try {
        db.prepare(
          "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)"
        ).run(username, hashedPassword, name, "qc");
        createdUsers.push({ username, role: "qc", name });
      } catch {
        // 用户名已存在，跳过
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功创建 ${createdUsers.length} 个账号\n辅助: ${assistant_count} 人\n线长: ${line_leader_count} 人\n主管: ${supervisor_count} 人\nQC: ${qc_count} 人\n\n所有账号密码: ${password}`,
      created_count: createdUsers.length,
    });
  } catch (error) {
    console.error("Batch create users error:", error);
    return NextResponse.json({ error: "批量创建失败" }, { status: 500 });
  }
}
